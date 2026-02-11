export type DocsSourceConfig = {
  baseUrl: string;
  includeDrafts?: boolean;
  auth?: {
    email: string;
    password: string;
  };
};

export type Media = {
  id: number | string;
  url?: string;
  filename?: string;
  mimeType?: string;
  alt?: string;
};

export type ServiceIcon = {
  source?: "lucide" | "custom";
  lucide?: string;
  customSvg?: Media | number | string | null;
};

export type Service = {
  id: number | string;
  name: string;
  slug: string;
  description?: string;
  icon?: ServiceIcon | string;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    logo?: number | string | null;
  };
  searchDefaults?: {
    placeholder?: string;
    includeOlderVersions?: boolean;
    resultsLimit?: number;
  };
  latestVersion?: DocVersion | number | string | null;
};

export type DocVersion = {
  id: number | string;
  service: number | string | Service;
  version: string;
  defaultPageSlug: string;
  versionKey?: string;
  isPrerelease?: boolean;
  status?: "draft" | "published";
};

export type DocPageGroup = {
  id: number | string;
  service: number | string | Service;
  version: number | string | DocVersion;
  name: string;
  slug?: string;
  order?: number;
  description?: string;
};

export type DocPage = {
  id: number | string;
  service: number | string | Service;
  version: number | string | DocVersion;
  group?: number | string | DocPageGroup | null;
  order?: number;
  slug: string;
  title: string;
  content: unknown;
  status?: "draft" | "published";
};

export type DocsSettings = {
  homeTitle?: string | null;
  homeDescription?: string | null;
  homeContent?: unknown | null;
};

export type NavNode = {
  kind?: "page" | "group";
  title: string;
  slug: string;
  children?: NavNode[];
};

type PayloadListResponse<T> = {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage?: number | null;
  nextPage?: number | null;
};

type FetchOptions = {
  params?: Record<string, string>;
};

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, "");

let cachedToken: string | undefined;
let cachedTokenExpiresAt = 0;
const DEFAULT_TOKEN_TTL_MS = 10 * 60 * 1000;

const buildHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const request = async <T>(
  config: DocsSourceConfig,
  path: string,
  options: FetchOptions = {},
  token?: string,
): Promise<T> => {
  const url = new URL(path, normalizeBaseUrl(config.baseUrl));
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) =>
      url.searchParams.set(key, value),
    );
  }

  const response = await fetch(url.toString(), {
    headers: buildHeaders(token),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Docs source request failed (${response.status}): ${message}`,
    );
  }

  return (await response.json()) as T;
};

const resolveAuthToken = async (config: DocsSourceConfig) => {
  const now = Date.now();
  if (cachedToken && cachedTokenExpiresAt > now) {
    return cachedToken;
  }
  if (!config.auth) return undefined;

  const response = await fetch(
    new URL("/api/users/login", normalizeBaseUrl(config.baseUrl)).toString(),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config.auth),
    },
  );

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Docs source login failed (${response.status}): ${message}`,
    );
  }

  const data = (await response.json()) as { token?: string };
  if (!data.token) {
    throw new Error("Docs source login did not return a token.");
  }
  cachedToken = data.token;
  cachedTokenExpiresAt = now + DEFAULT_TOKEN_TTL_MS;
  return data.token;
};

const fetchAll = async <T>(
  config: DocsSourceConfig,
  path: string,
  params: Record<string, string>,
): Promise<T[]> => {
  const token = await resolveAuthToken(config);
  const items: T[] = [];
  let page = 1;

  while (true) {
    const response = await request<PayloadListResponse<T>>(
      config,
      path,
      {
        params: {
          ...params,
          page: String(page),
        },
      },
      token,
    );

    items.push(...response.docs);

    if (!response.hasNextPage || !response.nextPage) {
      break;
    }

    page = response.nextPage;
  }

  return items;
};

const getStatusFilter = (config: DocsSourceConfig): Record<string, string> =>
  config.includeDrafts ? {} : { "where[status][equals]": "published" };

const toTitle = (segment: string) =>
  segment.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const isPopulatedDocVersion = (
  value: Service["latestVersion"],
): value is DocVersion =>
  typeof value === "object" &&
  value !== null &&
  "version" in value &&
  "id" in value;

const getServiceBySlug = async (
  config: DocsSourceConfig,
  slug: string,
  depth = 1,
): Promise<Service | null> => {
  const token = await resolveAuthToken(config);
  const response = await request<PayloadListResponse<Service>>(
    config,
    "/api/services",
    {
      params: {
        depth: String(depth),
        limit: "1",
        "where[slug][equals]": slug,
      },
    },
    token,
  );

  return response.docs[0] ?? null;
};

const getServiceId = async (
  config: DocsSourceConfig,
  slug: string,
): Promise<number | string> => {
  const service = await getServiceBySlug(config, slug, 0);
  if (!service) {
    throw new Error(`Service not found for slug "${slug}".`);
  }
  return service.id;
};

const getVersionById = async (
  config: DocsSourceConfig,
  id: number | string,
  depth = 0,
): Promise<DocVersion> =>
  request<DocVersion>(
    config,
    `/api/docVersions/${id}`,
    {
      params: {
        depth: String(depth),
      },
    },
    await resolveAuthToken(config),
  );

const getVersionId = async (
  config: DocsSourceConfig,
  serviceId: number | string,
  version: string,
): Promise<number | string> => {
  const token = await resolveAuthToken(config);
  const response = await request<PayloadListResponse<DocVersion>>(
    config,
    "/api/docVersions",
    {
      params: {
        depth: "0",
        limit: "1",
        "where[service][equals]": String(serviceId),
        "where[version][equals]": version,
        ...getStatusFilter(config),
      },
    },
    token,
  );

  const doc = response.docs[0];
  if (!doc) {
    throw new Error(
      `Doc version "${version}" not found for service "${serviceId}".`,
    );
  }

  return doc.id;
};

export const getServices = async (
  config: DocsSourceConfig,
  options: { depth?: number; limit?: number } = {},
): Promise<Service[]> => {
  const token = await resolveAuthToken(config);
  const response = await request<PayloadListResponse<Service>>(
    config,
    "/api/services",
    {
      params: {
        depth: String(options.depth ?? 1),
        limit: String(options.limit ?? 100),
        sort: "name",
      },
    },
    token,
  );

  return response.docs;
};

export const getVersions = async (
  config: DocsSourceConfig,
  serviceSlug: string,
  options: { limit?: number } = {},
): Promise<DocVersion[]> => {
  const token = await resolveAuthToken(config);
  const serviceId = await getServiceId(config, serviceSlug);
  const response = await request<PayloadListResponse<DocVersion>>(
    config,
    "/api/docVersions",
    {
      params: {
        depth: "0",
        limit: String(options.limit ?? 100),
        sort: "-versionKey",
        "where[service][equals]": String(serviceId),
        ...getStatusFilter(config),
      },
    },
    token,
  );

  return response.docs;
};

export const getVersion = async (
  config: DocsSourceConfig,
  params: { serviceSlug: string; version: string },
): Promise<DocVersion | null> => {
  const token = await resolveAuthToken(config);
  const serviceId = await getServiceId(config, params.serviceSlug);
  const response = await request<PayloadListResponse<DocVersion>>(
    config,
    "/api/docVersions",
    {
      params: {
        depth: "0",
        limit: "1",
        "where[service][equals]": String(serviceId),
        "where[version][equals]": params.version,
        ...getStatusFilter(config),
      },
    },
    token,
  );

  return response.docs[0] ?? null;
};

export const getLatestVersion = async (
  config: DocsSourceConfig,
  serviceSlug: string,
): Promise<DocVersion | null> => {
  const token = await resolveAuthToken(config);
  const service = await getServiceBySlug(config, serviceSlug, 1);
  if (!service) return null;

  if (!config.includeDrafts && service.latestVersion) {
    if (isPopulatedDocVersion(service.latestVersion)) {
      return service.latestVersion;
    }
    return getVersionById(config, service.latestVersion, 0);
  }

  const response = await request<PayloadListResponse<DocVersion>>(
    config,
    "/api/docVersions",
    {
      params: {
        depth: "0",
        limit: "1",
        sort: "-versionKey",
        "where[service][equals]": String(service.id),
        ...getStatusFilter(config),
      },
    },
    token,
  );

  return response.docs[0] ?? null;
};

export const getDocsSettings = async (
  config: DocsSourceConfig,
  options: { depth?: number } = {},
): Promise<DocsSettings> => {
  const token = await resolveAuthToken(config);
  return request<DocsSettings>(
    config,
    "/api/globals/docsSettings",
    {
      params: {
        depth: String(options.depth ?? 0),
      },
    },
    token,
  );
};

export const getPage = async (
  config: DocsSourceConfig,
  params: {
    serviceSlug: string;
    version: string;
    slug: string;
  },
): Promise<DocPage | null> => {
  const token = await resolveAuthToken(config);
  const serviceId = await getServiceId(config, params.serviceSlug);
  const versionId = await getVersionId(config, serviceId, params.version);

  const response = await request<PayloadListResponse<DocPage>>(
    config,
    "/api/docPages",
    {
      params: {
        depth: "2",
        limit: "1",
        "where[service][equals]": String(serviceId),
        "where[version][equals]": String(versionId),
        "where[slug][equals]": params.slug,
        ...getStatusFilter(config),
      },
    },
    token,
  );

  return response.docs[0] ?? null;
};

const isPopulatedDocPageGroup = (
  value: DocPage["group"],
): value is DocPageGroup =>
  typeof value === "object" &&
  value !== null &&
  "id" in value &&
  "name" in value;

type OrderedNavNode = NavNode & {
  order: number;
  children?: OrderedNavNode[];
};

const resolveOrder = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const compareOrderedNodes = (
  a: Pick<OrderedNavNode, "order" | "slug" | "title">,
  b: Pick<OrderedNavNode, "order" | "slug" | "title">,
) =>
  a.order - b.order ||
  a.slug.localeCompare(b.slug) ||
  a.title.localeCompare(b.title);

const stripOrder = (nodes: OrderedNavNode[]): NavNode[] =>
  nodes.map(({ order: _, children, ...node }) =>
    children && children.length > 0
      ? { ...node, children: stripOrder(children) }
      : node,
  );

const buildSlugTree = (pages: DocPage[]): OrderedNavNode[] => {
  type MutableNode = {
    title: string;
    slug: string;
    kind: "page";
    order: number;
    children: Map<string, MutableNode>;
  };

  const root: MutableNode = {
    title: "",
    slug: "",
    kind: "page",
    order: 0,
    children: new Map(),
  };

  const orderedPages = [...pages].sort(
    (a, b) =>
      resolveOrder(a.order) - resolveOrder(b.order) ||
      a.slug.localeCompare(b.slug),
  );

  orderedPages.forEach((page) => {
    const segments = page.slug.split("/").filter(Boolean);
    const pageOrder = resolveOrder(page.order);
    let node = root;
    let currentSlug = "";

    segments.forEach((segment, index) => {
      currentSlug = currentSlug ? `${currentSlug}/${segment}` : segment;
      const existing = node.children.get(segment);
      if (existing) {
        if (pageOrder < existing.order) {
          existing.order = pageOrder;
        }
        node = existing;
      } else {
        const created: MutableNode = {
          title: toTitle(segment),
          slug: currentSlug,
          kind: "page",
          order: pageOrder,
          children: new Map(),
        };
        node.children.set(segment, created);
        node = created;
      }

      if (index === segments.length - 1) {
        node.title = page.title;
        node.slug = page.slug;
        if (pageOrder < node.order) {
          node.order = pageOrder;
        }
      }
    });
  });

  const toNavNode = (node: MutableNode): OrderedNavNode => {
    const children = Array.from(node.children.values())
      .map(toNavNode)
      .sort(compareOrderedNodes);
    return children.length
      ? {
          kind: node.kind,
          title: node.title,
          slug: node.slug,
          order: node.order,
          children,
        }
      : {
          kind: node.kind,
          title: node.title,
          slug: node.slug,
          order: node.order,
        };
  };

  return Array.from(root.children.values())
    .map(toNavNode)
    .sort(compareOrderedNodes);
};

const buildNavTree = (pages: DocPage[]): NavNode[] => {
  const grouped = new Map<
    string,
    { title: string; order: number; slug: string; pages: DocPage[] }
  >();
  const ungrouped: DocPage[] = [];

  pages.forEach((page) => {
    if (!isPopulatedDocPageGroup(page.group)) {
      ungrouped.push(page);
      return;
    }

    const groupTitle = page.group.name.trim();
    if (!groupTitle.length) {
      ungrouped.push(page);
      return;
    }

    const groupKey = String(page.group.id);
    const existing = grouped.get(groupKey);
    if (existing) {
      existing.pages.push(page);
      return;
    }

    const groupSlug =
      typeof page.group.slug === "string" && page.group.slug.length > 0
        ? page.group.slug
        : groupKey;
    grouped.set(groupKey, {
      title: groupTitle,
      order: resolveOrder(page.group.order),
      slug: `__group__/${groupSlug}`,
      pages: [page],
    });
  });

  const nav: OrderedNavNode[] = buildSlugTree(ungrouped);

  const groupNodes = Array.from(grouped.values())
    .map(
      (group): OrderedNavNode => ({
        kind: "group",
        title: group.title,
        slug: group.slug,
        order: resolveOrder(group.order),
        children: buildSlugTree(group.pages),
      }),
    )
    .filter((group) => (group.children?.length ?? 0) > 0);

  nav.push(...groupNodes);
  nav.sort(compareOrderedNodes);

  return stripOrder(nav);
};

export const getNav = async (
  config: DocsSourceConfig,
  params: {
    serviceSlug: string;
    version: string;
  },
): Promise<NavNode[]> => {
  const serviceId = await getServiceId(config, params.serviceSlug);
  const versionId = await getVersionId(config, serviceId, params.version);

  const pages = await fetchAll<DocPage>(config, "/api/docPages", {
    depth: "1",
    limit: "100",
    sort: "slug",
    "where[service][equals]": String(serviceId),
    "where[version][equals]": String(versionId),
    ...getStatusFilter(config),
  });

  return buildNavTree(pages);
};
