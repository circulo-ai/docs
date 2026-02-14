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
  orderMode?: "manual" | "auto";
  order?: number;
  createdAt?: string;
  description?: string;
};

export type DocPage = {
  id: number | string;
  service: number | string | Service;
  version: number | string | DocVersion;
  group?: number | string | DocPageGroup | null;
  orderMode?: "manual" | "auto";
  order?: number;
  slug: string;
  title: string;
  content: unknown;
  status?: "draft" | "published";
  createdAt?: string;
};

export type ExtraNavLinkVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link";

export type ExtraNavLinkTarget = "_blank" | "_self" | "_parent" | "_top";

export type ExtraNavLink = {
  label: string;
  href: string;
  icon?: string;
  variant?: ExtraNavLinkVariant;
  target?: ExtraNavLinkTarget;
};

export type DocsSettings = {
  homeTitle?: string | null;
  homeDescription?: string | null;
  homeContent?: unknown | null;
  extraNavLinks: ExtraNavLink[];
};

type DocsSettingsResponse = Omit<DocsSettings, "extraNavLinks"> & {
  extraNavLinks?: unknown;
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

const EXTRA_NAV_LINK_VARIANTS = new Set<ExtraNavLinkVariant>([
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
]);

const EXTRA_NAV_LINK_TARGETS = new Set<ExtraNavLinkTarget>([
  "_blank",
  "_self",
  "_parent",
  "_top",
]);

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const asString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const toExtraNavLink = (value: unknown): ExtraNavLink | null => {
  const record = asRecord(value);
  if (!record) return null;

  const label = asString(record.label);
  const href = asString(record.href);
  if (!label || !href) return null;

  const link: ExtraNavLink = {
    label,
    href,
  };

  const icon = asString(record.icon);
  if (icon) {
    link.icon = icon;
  }

  const rawVariant = asString(record.variant);
  if (
    rawVariant &&
    EXTRA_NAV_LINK_VARIANTS.has(rawVariant as ExtraNavLinkVariant)
  ) {
    link.variant = rawVariant as ExtraNavLinkVariant;
  }

  const rawTarget = asString(record.target);
  if (
    rawTarget &&
    EXTRA_NAV_LINK_TARGETS.has(rawTarget as ExtraNavLinkTarget)
  ) {
    link.target = rawTarget as ExtraNavLinkTarget;
  }

  return link;
};

const normalizeDocsSettings = (
  settings: DocsSettingsResponse,
): DocsSettings => {
  const extraNavLinks = Array.isArray(settings.extraNavLinks)
    ? settings.extraNavLinks
        .map((link): ExtraNavLink | null => toExtraNavLink(link))
        .filter((link): link is ExtraNavLink => Boolean(link))
    : [];

  return {
    ...settings,
    extraNavLinks,
  };
};

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
  const settings = await request<DocsSettingsResponse>(
    config,
    "/api/globals/docsSettings",
    {
      params: {
        depth: String(options.depth ?? 0),
      },
    },
    token,
  );

  return normalizeDocsSettings(settings);
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
  position: number;
  children?: OrderedNavNode[];
};

type OrderMode = "manual" | "auto";

type Orderable = {
  id: number | string;
  orderMode?: "manual" | "auto";
  order?: number;
  createdAt?: string;
  slug?: string;
  title?: string;
};

const resolveOrderMode = (value: unknown): OrderMode =>
  value === "auto" ? "auto" : "manual";

const resolveManualPosition = (value: number | null | undefined) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return 1;
  const normalized = Math.floor(value);
  return normalized < 1 ? 1 : normalized;
};

const resolveCreatedAtOrder = (value: string | null | undefined) => {
  const parsed = Date.parse(value ?? "");
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
};

const compareOrderableFallback = (
  a: Pick<Orderable, "id" | "slug" | "title">,
  b: Pick<Orderable, "id" | "slug" | "title">,
) =>
  (a.slug ?? "").localeCompare(b.slug ?? "") ||
  (a.title ?? "").localeCompare(b.title ?? "") ||
  String(a.id).localeCompare(String(b.id));

const arrangeOrderables = <T extends Orderable>(items: T[]): T[] => {
  const manual = items
    .filter((item) => resolveOrderMode(item.orderMode) === "manual")
    .sort(
      (a, b) =>
        resolveManualPosition(a.order) - resolveManualPosition(b.order) ||
        compareOrderableFallback(a, b),
    );

  const auto = items
    .filter((item) => resolveOrderMode(item.orderMode) === "auto")
    .sort(
      (a, b) =>
        resolveCreatedAtOrder(a.createdAt) -
          resolveCreatedAtOrder(b.createdAt) || compareOrderableFallback(a, b),
    );

  const manualSlots = new Map<number, T>();
  const overflowManual: Array<{ slot: number; item: T }> = [];

  for (const item of manual) {
    let slot = resolveManualPosition(item.order);
    while (manualSlots.has(slot)) {
      slot += 1;
    }

    if (slot <= items.length) {
      manualSlots.set(slot, item);
      continue;
    }

    overflowManual.push({ slot, item });
  }

  const arranged: T[] = [];
  let autoIndex = 0;
  for (let slot = 1; slot <= items.length; slot += 1) {
    const manualAtSlot = manualSlots.get(slot);
    if (manualAtSlot) {
      arranged.push(manualAtSlot);
      continue;
    }

    const autoAtSlot = auto[autoIndex];
    if (autoAtSlot) {
      arranged.push(autoAtSlot);
      autoIndex += 1;
    }
  }

  overflowManual
    .sort((a, b) => a.slot - b.slot || compareOrderableFallback(a.item, b.item))
    .forEach(({ item }) => arranged.push(item));

  while (autoIndex < auto.length) {
    const remainingAuto = auto[autoIndex];
    if (!remainingAuto) break;
    arranged.push(remainingAuto);
    autoIndex += 1;
  }

  return arranged;
};

const compareOrderedNodes = (
  a: Pick<OrderedNavNode, "position" | "slug" | "title">,
  b: Pick<OrderedNavNode, "position" | "slug" | "title">,
) =>
  a.position - b.position ||
  a.slug.localeCompare(b.slug) ||
  a.title.localeCompare(b.title);

const stripOrder = (nodes: OrderedNavNode[]): NavNode[] =>
  nodes.map(({ position: _, children, ...node }) =>
    children && children.length > 0
      ? { ...node, children: stripOrder(children) }
      : node,
  );

const buildSlugTree = (
  pages: DocPage[],
  options?: {
    pagePositions?: Map<string, number>;
  },
): OrderedNavNode[] => {
  type MutableNode = {
    title: string;
    slug: string;
    kind: "page";
    position: number;
    children: Map<string, MutableNode>;
  };

  const root: MutableNode = {
    title: "",
    slug: "",
    kind: "page",
    position: Number.MAX_SAFE_INTEGER,
    children: new Map(),
  };

  const orderedPages = options?.pagePositions
    ? [...pages].sort(
        (a, b) =>
          (options.pagePositions?.get(String(a.id)) ??
            Number.MAX_SAFE_INTEGER) -
            (options.pagePositions?.get(String(b.id)) ??
              Number.MAX_SAFE_INTEGER) || a.slug.localeCompare(b.slug),
      )
    : arrangeOrderables([...pages]);

  orderedPages.forEach((page, index) => {
    const segments = page.slug.split("/").filter(Boolean);
    const pagePosition = options?.pagePositions?.get(String(page.id)) ?? index;
    let node = root;
    let currentSlug = "";

    segments.forEach((segment, index) => {
      currentSlug = currentSlug ? `${currentSlug}/${segment}` : segment;
      const existing = node.children.get(segment);
      if (existing) {
        if (pagePosition < existing.position) {
          existing.position = pagePosition;
        }
        node = existing;
      } else {
        const created: MutableNode = {
          title: toTitle(segment),
          slug: currentSlug,
          kind: "page",
          position: pagePosition,
          children: new Map(),
        };
        node.children.set(segment, created);
        node = created;
      }

      if (index === segments.length - 1) {
        node.title = page.title;
        node.slug = page.slug;
        if (pagePosition < node.position) {
          node.position = pagePosition;
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
          position: node.position,
          children,
        }
      : {
          kind: node.kind,
          title: node.title,
          slug: node.slug,
          position: node.position,
        };
  };

  return Array.from(root.children.values())
    .map(toNavNode)
    .sort(compareOrderedNodes);
};

const buildNavTree = (pages: DocPage[]): NavNode[] => {
  const grouped = new Map<
    string,
    {
      id: string;
      title: string;
      slug: string;
      pages: DocPage[];
      orderMode?: "manual" | "auto";
      order?: number;
      createdAt?: string;
    }
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
      id: groupKey,
      title: groupTitle,
      slug: `__group__/${groupSlug}`,
      pages: [page],
      orderMode: page.group.orderMode,
      order: page.group.order,
      createdAt: page.group.createdAt,
    });
  });

  const rootOrderables: Array<
    | (Orderable & { kind: "page"; pageId: string })
    | (Orderable & { kind: "group"; groupId: string })
  > = [
    ...ungrouped.map((page) => ({
      kind: "page" as const,
      id: `page:${String(page.id)}`,
      pageId: String(page.id),
      slug: page.slug,
      title: page.title,
      orderMode: page.orderMode,
      order: page.order,
      createdAt: page.createdAt,
    })),
    ...Array.from(grouped.values()).map((group) => ({
      kind: "group" as const,
      id: `group:${group.id}`,
      groupId: group.id,
      slug: group.slug,
      title: group.title,
      orderMode: group.orderMode,
      order: group.order,
      createdAt: group.createdAt,
    })),
  ];

  const orderedRoot = arrangeOrderables(rootOrderables);
  const ungroupedPositions = new Map<string, number>();
  const groupPositions = new Map<string, number>();

  orderedRoot.forEach((item, index) => {
    if (item.kind === "page") {
      ungroupedPositions.set(item.pageId, index);
      return;
    }

    groupPositions.set(item.groupId, index);
  });

  const nav: OrderedNavNode[] = buildSlugTree(ungrouped, {
    pagePositions: ungroupedPositions,
  });

  const groupNodes = Array.from(grouped.values())
    .map(
      (group): OrderedNavNode => ({
        kind: "group",
        title: group.title,
        slug: group.slug,
        position: groupPositions.get(group.id) ?? Number.MAX_SAFE_INTEGER,
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
