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

export type ServiceThemeMode = {
  background?: string;
  foreground?: string;
  card?: string;
  cardForeground?: string;
  popover?: string;
  popoverForeground?: string;
  primary?: string;
  primaryForeground?: string;
  secondary?: string;
  secondaryForeground?: string;
  muted?: string;
  mutedForeground?: string;
  accent?: string;
  accentForeground?: string;
  destructive?: string;
  border?: string;
  input?: string;
  ring?: string;
  chart1?: string;
  chart2?: string;
  chart3?: string;
  chart4?: string;
  chart5?: string;
  radius?: string;
  sidebar?: string;
  sidebarForeground?: string;
  sidebarPrimary?: string;
  sidebarPrimaryForeground?: string;
  sidebarAccent?: string;
  sidebarAccentForeground?: string;
  sidebarBorder?: string;
  sidebarRing?: string;
};

export type ServiceTheme = {
  id: number | string;
  name: string;
  light?: ServiceThemeMode;
  dark?: ServiceThemeMode;
  createdAt?: string;
  updatedAt?: string;
};

export type Service = {
  id: number | string;
  name: string;
  slug: string;
  description?: string;
  icon?: ServiceIcon | string;
  theme?: number | string | ServiceTheme | null;
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
  navItems?: DocVersionNavItem[];
  versionKey?: string;
  isPrerelease?: boolean;
  status?: "draft" | "published";
};

export type DocPageGroup = {
  id: number | string;
  service: number | string | Service;
  name: string;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
};

export type DocPage = {
  id: number | string;
  service: number | string | Service;
  slug: string;
  title: string;
  content: unknown;
  createdAt?: string;
  updatedAt?: string;
};

export type DocVersionNavPageRow = {
  page: number | string | DocPage;
  published?: boolean;
};

export type DocVersionNavItem =
  | {
      kind?: "page";
      blockType?: "pageItem";
      page: number | string | DocPage;
      published?: boolean;
    }
  | {
      kind?: "group";
      blockType?: "groupItem";
      group: number | string | DocPageGroup;
      pages?: DocVersionNavPageRow[];
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
let cachedAnonymousAuthUntil = 0;
const AUTH_RETRY_DELAY_MS = 60 * 1000;

const canFallbackToAnonymous = (config: DocsSourceConfig) =>
  !config.includeDrafts;

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
  if (canFallbackToAnonymous(config) && cachedAnonymousAuthUntil > now) {
    return undefined;
  }

  try {
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
      if (canFallbackToAnonymous(config)) {
        cachedAnonymousAuthUntil = now + AUTH_RETRY_DELAY_MS;
        return undefined;
      }
      throw new Error(
        `Docs source login failed (${response.status}): ${message}`,
      );
    }

    const data = (await response.json()) as { token?: string };
    if (!data.token) {
      if (canFallbackToAnonymous(config)) {
        cachedAnonymousAuthUntil = now + AUTH_RETRY_DELAY_MS;
        return undefined;
      }
      throw new Error("Docs source login did not return a token.");
    }
    cachedToken = data.token;
    cachedTokenExpiresAt = now + DEFAULT_TOKEN_TTL_MS;
    cachedAnonymousAuthUntil = 0;
    return data.token;
  } catch (error) {
    if (canFallbackToAnonymous(config)) {
      cachedAnonymousAuthUntil = now + AUTH_RETRY_DELAY_MS;
      return undefined;
    }
    throw error;
  }
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
  const serviceId = await getServiceId(config, params.serviceSlug);
  const version = await getVersion(config, {
    serviceSlug: params.serviceSlug,
    version: params.version,
  });
  if (!version) return null;

  const pages = await getPagesForService(config, serviceId);
  const pageById = new Map<string, DocPage>();
  pages.forEach((page) => pageById.set(String(page.id), page));

  const targetSlug = normalizeDocSlug(params.slug);
  const rows = flattenVisibleNavRows(version.navItems, config.includeDrafts);
  for (const row of rows) {
    const page = pageById.get(String(row.pageId));
    if (!page) continue;
    if (normalizeDocSlug(page.slug) !== targetSlug) continue;
    return page;
  }

  return null;
};

type NormalizedNavRow = {
  pageId: number | string;
  published: boolean;
  groupId: number | string | null;
  rootIndex: number;
  groupPageIndex: number | null;
};

type NormalizedNavItem =
  | {
      kind: "page";
      pageId: number | string;
      published: boolean;
    }
  | {
      kind: "group";
      groupId: number | string;
      pages: Array<{
        pageId: number | string;
        published: boolean;
      }>;
    };

const asArray = (value: unknown) => (Array.isArray(value) ? value : []);
const asBoolean = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const relationValueToId = (value: unknown): number | string | null => {
  if (!value) return null;
  if (typeof value === "number" || typeof value === "string") return value;
  const record = asRecord(value);
  if (!record) return null;
  const nestedValue = asRecord(record.value);
  if (
    nestedValue &&
    (typeof nestedValue.id === "number" || typeof nestedValue.id === "string")
  ) {
    return nestedValue.id;
  }
  if (typeof record.id === "number" || typeof record.id === "string")
    return record.id;
  return null;
};

const normalizeNavItems = (value: unknown): NormalizedNavItem[] => {
  const items: NormalizedNavItem[] = [];

  for (const candidate of asArray(value)) {
    const record = asRecord(candidate);
    if (!record) continue;

    const rawKind = asString(
      record.kind || record.type || record.blockType,
    ).toLowerCase();
    if (rawKind === "page" || rawKind === "pageitem") {
      const pageId = relationValueToId(record.page);
      if (pageId === null) continue;
      items.push({
        kind: "page",
        pageId,
        published: asBoolean(record.published, true),
      });
      continue;
    }

    if (rawKind === "group" || rawKind === "groupitem") {
      const groupId = relationValueToId(record.group);
      if (groupId === null) continue;

      const pages = asArray(record.pages)
        .map((entry) => asRecord(entry))
        .filter((entry): entry is Record<string, unknown> => Boolean(entry))
        .map((entry) => {
          const pageId = relationValueToId(entry.page);
          if (pageId === null) return null;
          return {
            pageId,
            published: asBoolean(entry.published, true),
          };
        })
        .filter(
          (
            entry,
          ): entry is {
            pageId: number | string;
            published: boolean;
          } => Boolean(entry),
        );

      items.push({
        kind: "group",
        groupId,
        pages,
      });
    }
  }

  return items;
};

const flattenVisibleNavRows = (
  navItems: unknown,
  includeDrafts = false,
): NormalizedNavRow[] => {
  const rows: NormalizedNavRow[] = [];

  normalizeNavItems(navItems).forEach((item, rootIndex) => {
    if (item.kind === "page") {
      if (!includeDrafts && !item.published) return;
      rows.push({
        pageId: item.pageId,
        published: item.published,
        groupId: null,
        rootIndex,
        groupPageIndex: null,
      });
      return;
    }

    item.pages.forEach((row, groupPageIndex) => {
      if (!includeDrafts && !row.published) return;
      rows.push({
        pageId: row.pageId,
        published: row.published,
        groupId: item.groupId,
        rootIndex,
        groupPageIndex,
      });
    });
  });

  return rows;
};

const getPagesForService = async (
  config: DocsSourceConfig,
  serviceId: number | string,
): Promise<DocPage[]> =>
  fetchAll<DocPage>(config, "/api/docPages", {
    depth: "0",
    limit: "100",
    sort: "slug",
    "where[service][equals]": String(serviceId),
  });

const getPageGroupsForService = async (
  config: DocsSourceConfig,
  serviceId: number | string,
): Promise<DocPageGroup[]> =>
  fetchAll<DocPageGroup>(config, "/api/docPageGroups", {
    depth: "0",
    limit: "100",
    sort: "slug",
    "where[service][equals]": String(serviceId),
  });

const normalizeDocSlug = (value: string) =>
  value.trim().replace(/^\/+/, "").replace(/\/+$/, "").toLowerCase();

type OrderedNavNode = NavNode & {
  position: number;
  children?: OrderedNavNode[];
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
    : [...pages].sort(
        (a, b) =>
          a.slug.localeCompare(b.slug) ||
          String(a.id).localeCompare(String(b.id)),
      );

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

export const getNav = async (
  config: DocsSourceConfig,
  params: {
    serviceSlug: string;
    version: string;
  },
): Promise<NavNode[]> => {
  const serviceId = await getServiceId(config, params.serviceSlug);
  const version = await getVersion(config, {
    serviceSlug: params.serviceSlug,
    version: params.version,
  });
  if (!version) return [];

  const [allPages, allGroups] = await Promise.all([
    getPagesForService(config, serviceId),
    getPageGroupsForService(config, serviceId),
  ]);
  const pageById = new Map<string, DocPage>();
  allPages.forEach((page) => pageById.set(String(page.id), page));

  const groupById = new Map<string, DocPageGroup>();
  allGroups.forEach((group) => groupById.set(String(group.id), group));

  const navItems = normalizeNavItems(version.navItems);
  const includeDrafts = Boolean(config.includeDrafts);

  const ungrouped: DocPage[] = [];
  const ungroupedPositions = new Map<string, number>();
  const groupNodes: OrderedNavNode[] = [];

  navItems.forEach((item, rootIndex) => {
    if (item.kind === "page") {
      if (!includeDrafts && !item.published) return;
      const page = pageById.get(String(item.pageId));
      if (!page) return;
      ungrouped.push(page);
      ungroupedPositions.set(String(page.id), rootIndex);
      return;
    }

    const group = groupById.get(String(item.groupId));
    if (!group) return;

    const pages: DocPage[] = [];
    const pagePositions = new Map<string, number>();
    item.pages.forEach((row, rowIndex) => {
      if (!includeDrafts && !row.published) return;
      const page = pageById.get(String(row.pageId));
      if (!page) return;
      pages.push(page);
      pagePositions.set(String(page.id), rowIndex);
    });

    const children = buildSlugTree(pages, {
      pagePositions,
    });
    if (children.length === 0) return;

    groupNodes.push({
      kind: "group",
      title: group.name,
      slug:
        typeof group.slug === "string" && group.slug.length > 0
          ? group.slug
          : String(group.id),
      position: rootIndex,
      children,
    });
  });

  const nav: OrderedNavNode[] = [
    ...buildSlugTree(ungrouped, { pagePositions: ungroupedPositions }),
    ...groupNodes,
  ].sort(compareOrderedNodes);

  return stripOrder(nav);
};
