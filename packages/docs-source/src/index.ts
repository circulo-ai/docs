export type DocsSourceConfig = {
  baseUrl: string;
  includeDrafts?: boolean;
  auth?: {
    email: string;
    password: string;
  };
};

export type Service = {
  id: number | string;
  name: string;
  slug: string;
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

export type DocPage = {
  id: number | string;
  service: number | string | Service;
  version: number | string | DocVersion;
  slug: string;
  title: string;
  content: unknown;
  status?: "draft" | "published";
};

export type NavNode = {
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
        depth: "0",
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

const buildNavTree = (pages: DocPage[]): NavNode[] => {
  type MutableNode = {
    title: string;
    slug: string;
    children: Map<string, MutableNode>;
  };

  const root: MutableNode = {
    title: "",
    slug: "",
    children: new Map(),
  };

  pages.forEach((page) => {
    const segments = page.slug.split("/").filter(Boolean);
    let node = root;
    let currentSlug = "";

    segments.forEach((segment, index) => {
      currentSlug = currentSlug ? `${currentSlug}/${segment}` : segment;
      const existing = node.children.get(segment);
      if (existing) {
        node = existing;
      } else {
        const created: MutableNode = {
          title: toTitle(segment),
          slug: currentSlug,
          children: new Map(),
        };
        node.children.set(segment, created);
        node = created;
      }

      if (index === segments.length - 1) {
        node.title = page.title;
        node.slug = page.slug;
      }
    });
  });

  const toNavNode = (node: MutableNode): NavNode => {
    const children = Array.from(node.children.values())
      .map(toNavNode)
      .sort((a, b) => a.slug.localeCompare(b.slug));
    return children.length
      ? { title: node.title, slug: node.slug, children }
      : { title: node.title, slug: node.slug };
  };

  return Array.from(root.children.values())
    .map(toNavNode)
    .sort((a, b) => a.slug.localeCompare(b.slug));
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
    depth: "0",
    limit: "100",
    sort: "slug",
    "where[service][equals]": String(serviceId),
    "where[version][equals]": String(versionId),
    ...getStatusFilter(config),
  });

  return buildNavTree(pages);
};
