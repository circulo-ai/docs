import { afterEach, describe, expect, it, vi } from "vitest";

import { getDocsSettings, getNav, type DocPage } from "./index.js";

type TestDocPage = DocPage & {
  order?: number;
  orderMode?: "manual" | "auto";
  createdAt?: string;
};

const baseConfig = {
  baseUrl: "https://cms.example.test",
} as const;

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

const payloadList = <T>(docs: T[]) => ({
  docs,
  totalDocs: docs.length,
  limit: docs.length || 1,
  totalPages: 1,
  page: 1,
  pagingCounter: 1,
  hasPrevPage: false,
  hasNextPage: false,
  prevPage: null,
  nextPage: null,
});

const mockNavRequests = (pages: TestDocPage[]) => {
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const rawUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const url = new URL(rawUrl);

    if (url.pathname === "/api/services") {
      return jsonResponse(
        payloadList([{ id: 1, slug: "billing", name: "Billing" }]),
      );
    }

    if (url.pathname === "/api/docVersions") {
      return jsonResponse(
        payloadList([{ id: 10, service: 1, version: "1.0.0" }]),
      );
    }

    if (url.pathname === "/api/docPages") {
      return jsonResponse(payloadList(pages as DocPage[]));
    }

    throw new Error(`Unexpected request: ${url.toString()}`);
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const createPage = (overrides: Partial<TestDocPage>): TestDocPage => ({
  id: overrides.id ?? 1,
  service: 1,
  version: 10,
  slug: overrides.slug ?? "index",
  title: overrides.title ?? "Index",
  content: {},
  status: "published",
  orderMode: "manual",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("getNav ordering", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("orders ungrouped pages using explicit page order", async () => {
    mockNavRequests([
      createPage({
        id: 1,
        slug: "a-later",
        title: "A Later",
        order: 2,
      }),
      createPage({
        id: 2,
        slug: "z-priority",
        title: "Z Priority",
        order: 1,
      }),
    ]);

    const nav = await getNav(baseConfig, {
      serviceSlug: "billing",
      version: "1.0.0",
    });

    expect(nav.map((node) => node.slug)).toEqual(["z-priority", "a-later"]);
  });

  it("orders pages inside a group using explicit page order", async () => {
    const group = {
      id: 77,
      service: 1,
      version: 10,
      name: "Getting Started",
      slug: "getting-started",
      order: 1,
    };

    mockNavRequests([
      createPage({
        id: 1,
        slug: "a-later",
        title: "A Later",
        order: 2,
        group,
      }),
      createPage({
        id: 2,
        slug: "z-priority",
        title: "Z Priority",
        order: 1,
        group,
      }),
    ]);

    const nav = await getNav(baseConfig, {
      serviceSlug: "billing",
      version: "1.0.0",
    });

    expect(nav).toHaveLength(1);
    expect(nav[0]?.kind).toBe("group");
    expect(nav[0]?.children?.map((node) => node.slug)).toEqual([
      "z-priority",
      "a-later",
    ]);
  });

  it("orders groups and ungrouped pages together by order", async () => {
    mockNavRequests([
      createPage({
        id: 1,
        slug: "ungrouped-middle",
        title: "Ungrouped Middle",
        order: 2,
      }),
      createPage({
        id: 2,
        slug: "group-first-page",
        title: "Group First Page",
        order: 1,
        group: {
          id: 11,
          service: 1,
          version: 10,
          name: "Group First",
          slug: "group-first",
          order: 1,
        },
      }),
      createPage({
        id: 3,
        slug: "group-last-page",
        title: "Group Last Page",
        order: 1,
        group: {
          id: 22,
          service: 1,
          version: 10,
          name: "Group Last",
          slug: "group-last",
          order: 3,
        },
      }),
    ]);

    const nav = await getNav(baseConfig, {
      serviceSlug: "billing",
      version: "1.0.0",
    });

    expect(nav.map((node) => node.title)).toEqual([
      "Group First",
      "Ungrouped Middle",
      "Group Last",
    ]);
  });

  it("orders ungrouped auto pages by createdAt oldest first", async () => {
    mockNavRequests([
      createPage({
        id: 1,
        slug: "a-newest",
        title: "A Newest",
        orderMode: "auto",
        createdAt: "2026-01-05T09:00:00.000Z",
      }),
      createPage({
        id: 2,
        slug: "z-oldest",
        title: "Z Oldest",
        orderMode: "auto",
        createdAt: "2026-01-03T09:00:00.000Z",
      }),
    ]);

    const nav = await getNav(baseConfig, {
      serviceSlug: "billing",
      version: "1.0.0",
    });

    expect(nav.map((node) => node.slug)).toEqual(["z-oldest", "a-newest"]);
  });

  it("orders auto pages inside a group by createdAt oldest first", async () => {
    const group = {
      id: 77,
      service: 1,
      version: 10,
      name: "Getting Started",
      slug: "getting-started",
      order: 1,
    };

    mockNavRequests([
      createPage({
        id: 1,
        slug: "a-newest",
        title: "A Newest",
        orderMode: "auto",
        createdAt: "2026-01-05T09:00:00.000Z",
        group,
      }),
      createPage({
        id: 2,
        slug: "z-oldest",
        title: "Z Oldest",
        orderMode: "auto",
        createdAt: "2026-01-03T09:00:00.000Z",
        group,
      }),
    ]);

    const nav = await getNav(baseConfig, {
      serviceSlug: "billing",
      version: "1.0.0",
    });

    expect(nav).toHaveLength(1);
    expect(nav[0]?.kind).toBe("group");
    expect(nav[0]?.children?.map((node) => node.slug)).toEqual([
      "z-oldest",
      "a-newest",
    ]);
  });

  it("orders auto groups by createdAt oldest first", async () => {
    mockNavRequests([
      createPage({
        id: 1,
        slug: "alpha-page",
        title: "Alpha Page",
        group: {
          id: 11,
          service: 1,
          version: 10,
          name: "Alpha Group",
          slug: "alpha-group",
          orderMode: "auto",
          createdAt: "2026-01-05T09:00:00.000Z",
        },
      }),
      createPage({
        id: 2,
        slug: "zeta-page",
        title: "Zeta Page",
        group: {
          id: 22,
          service: 1,
          version: 10,
          name: "Zeta Group",
          slug: "zeta-group",
          orderMode: "auto",
          createdAt: "2026-01-03T09:00:00.000Z",
        },
      }),
    ]);

    const nav = await getNav(baseConfig, {
      serviceSlug: "billing",
      version: "1.0.0",
    });

    expect(nav.map((node) => node.title)).toEqual([
      "Zeta Group",
      "Alpha Group",
    ]);
  });

  it("inserts a manual page into auto pages using 1-based order position", async () => {
    mockNavRequests([
      createPage({
        id: 1,
        slug: "auto-1",
        title: "Auto 1",
        orderMode: "auto",
        createdAt: "2026-01-01T09:00:00.000Z",
      }),
      createPage({
        id: 2,
        slug: "auto-2",
        title: "Auto 2",
        orderMode: "auto",
        createdAt: "2026-01-02T09:00:00.000Z",
      }),
      createPage({
        id: 3,
        slug: "auto-3",
        title: "Auto 3",
        orderMode: "auto",
        createdAt: "2026-01-03T09:00:00.000Z",
      }),
      createPage({
        id: 4,
        slug: "auto-4",
        title: "Auto 4",
        orderMode: "auto",
        createdAt: "2026-01-04T09:00:00.000Z",
      }),
      createPage({
        id: 5,
        slug: "auto-5",
        title: "Auto 5",
        orderMode: "auto",
        createdAt: "2026-01-05T09:00:00.000Z",
      }),
      createPage({
        id: 6,
        slug: "manual-3",
        title: "Manual 3",
        orderMode: "manual",
        order: 3,
      }),
    ]);

    const nav = await getNav(baseConfig, {
      serviceSlug: "billing",
      version: "1.0.0",
    });

    expect(nav.map((node) => node.slug)).toEqual([
      "auto-1",
      "auto-2",
      "manual-3",
      "auto-3",
      "auto-4",
      "auto-5",
    ]);
  });

  it("inserts a manual group into auto groups using 1-based order position", async () => {
    mockNavRequests([
      createPage({
        id: 1,
        slug: "auto-group-page-1",
        title: "Auto Group Page 1",
        group: {
          id: 11,
          service: 1,
          version: 10,
          name: "Auto Group 1",
          slug: "auto-group-1",
          orderMode: "auto",
          createdAt: "2026-01-01T09:00:00.000Z",
        },
      }),
      createPage({
        id: 2,
        slug: "auto-group-page-2",
        title: "Auto Group Page 2",
        group: {
          id: 22,
          service: 1,
          version: 10,
          name: "Auto Group 2",
          slug: "auto-group-2",
          orderMode: "auto",
          createdAt: "2026-01-02T09:00:00.000Z",
        },
      }),
      createPage({
        id: 3,
        slug: "auto-group-page-3",
        title: "Auto Group Page 3",
        group: {
          id: 33,
          service: 1,
          version: 10,
          name: "Auto Group 3",
          slug: "auto-group-3",
          orderMode: "auto",
          createdAt: "2026-01-03T09:00:00.000Z",
        },
      }),
      createPage({
        id: 4,
        slug: "manual-group-page",
        title: "Manual Group Page",
        group: {
          id: 44,
          service: 1,
          version: 10,
          name: "Manual Group",
          slug: "manual-group",
          orderMode: "manual",
          order: 2,
        },
      }),
    ]);

    const nav = await getNav(baseConfig, {
      serviceSlug: "billing",
      version: "1.0.0",
    });

    expect(nav.map((node) => node.title)).toEqual([
      "Auto Group 1",
      "Manual Group",
      "Auto Group 2",
      "Auto Group 3",
    ]);
  });
});

describe("getDocsSettings", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns an empty extraNavLinks array when the global omits it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const rawUrl =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;
        const url = new URL(rawUrl);

        if (url.pathname === "/api/globals/docsSettings") {
          return jsonResponse({
            homeTitle: "Home",
            homeDescription: "Description",
            homeContent: { root: { type: "root", children: [] } },
          });
        }

        throw new Error(`Unexpected request: ${url.toString()}`);
      }),
    );

    const settings = await getDocsSettings(baseConfig, { depth: 2 });

    expect(settings.extraNavLinks).toEqual([]);
  });

  it("keeps configured extraNavLinks from docsSettings", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const rawUrl =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;
        const url = new URL(rawUrl);

        if (url.pathname === "/api/globals/docsSettings") {
          return jsonResponse({
            extraNavLinks: [
              {
                label: "Status",
                href: "https://status.example.com",
                icon: "Activity",
                variant: "outline",
                target: "_blank",
              },
            ],
          });
        }

        throw new Error(`Unexpected request: ${url.toString()}`);
      }),
    );

    const settings = await getDocsSettings(baseConfig);

    expect(settings.extraNavLinks).toEqual([
      {
        label: "Status",
        href: "https://status.example.com",
        icon: "Activity",
        variant: "outline",
        target: "_blank",
      },
    ]);
  });
});
