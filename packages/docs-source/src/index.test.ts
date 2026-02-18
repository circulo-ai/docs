import { afterEach, describe, expect, it, vi } from "vitest";

import { getNav, getPage, getServices, type DocPage } from "./index.js";

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

type NavRow =
  | {
      blockType: "pageItem";
      page: number;
      published?: boolean;
    }
  | {
      blockType: "groupItem";
      group: number;
      pages: Array<{ page: number; published?: boolean }>;
    };

const mockCmsRequests = (options: {
  navItems: NavRow[];
  pages: Array<DocPage>;
  groups?: Array<{ id: number; service: number; name: string; slug: string }>;
}) => {
  const groups = options.groups ?? [];

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
        payloadList([
          {
            id: 10,
            service: 1,
            version: "1.0.0",
            defaultPageSlug: "intro",
            navItems: options.navItems,
            status: "published",
          },
        ]),
      );
    }

    if (url.pathname === "/api/docPages") {
      return jsonResponse(payloadList(options.pages));
    }

    if (url.pathname === "/api/docPageGroups") {
      return jsonResponse(payloadList(groups));
    }

    throw new Error(`Unexpected request: ${url.toString()}`);
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const createPage = (id: number, slug: string, title: string): DocPage => ({
  id,
  service: 1,
  slug,
  title,
  content: { root: { type: "root", children: [] } },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("version-owned nav resolution", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("falls back to anonymous requests when login fails for published content", async () => {
    const fetchMock = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        const rawUrl =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;
        const url = new URL(rawUrl);

        if (url.pathname === "/api/users/login") {
          return new Response(
            JSON.stringify({ errors: [{ message: "Something went wrong." }] }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (url.pathname === "/api/services") {
          return jsonResponse(
            payloadList([{ id: 1, slug: "billing", name: "Billing" }]),
          );
        }

        throw new Error(`Unexpected request: ${url.toString()}`);
      },
    );

    vi.stubGlobal("fetch", fetchMock);

    const services = await getServices(
      {
        ...baseConfig,
        auth: {
          email: "docs@example.test",
          password: "secret",
        },
      },
      { depth: 0, limit: 10 },
    );

    expect(services).toEqual([{ id: 1, slug: "billing", name: "Billing" }]);

    const servicesCall = fetchMock.mock.calls.find((call) => {
      const input = call[0];
      const rawUrl =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      return new URL(rawUrl).pathname === "/api/services";
    });

    const headers = new Headers((servicesCall?.[1] as RequestInit)?.headers);
    expect(headers.get("authorization")).toBeNull();
  });

  it("keeps throwing login failures when drafts are enabled", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const rawUrl =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      const url = new URL(rawUrl);

      if (url.pathname === "/api/users/login") {
        return new Response(
          JSON.stringify({ errors: [{ message: "Something went wrong." }] }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      throw new Error(`Unexpected request: ${url.toString()}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getServices(
        {
          ...baseConfig,
          includeDrafts: true,
          auth: {
            email: "docs@example.test",
            password: "secret",
          },
        },
        { depth: 0, limit: 10 },
      ),
    ).rejects.toThrow("Docs source login failed (500)");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps root ordering between pages and groups", async () => {
    mockCmsRequests({
      navItems: [
        { blockType: "groupItem", group: 11, pages: [{ page: 3 }] },
        { blockType: "pageItem", page: 1 },
        { blockType: "pageItem", page: 2 },
      ],
      groups: [{ id: 11, service: 1, name: "Guides", slug: "guides" }],
      pages: [
        createPage(1, "root-a", "Root A"),
        createPage(2, "root-b", "Root B"),
        createPage(3, "guide-a", "Guide A"),
      ],
    });

    const nav = await getNav(baseConfig, {
      serviceSlug: "billing",
      version: "1.0.0",
    });

    expect(nav.map((node) => node.kind ?? "page")).toEqual([
      "group",
      "page",
      "page",
    ]);
    expect(nav.map((node) => node.title)).toEqual([
      "Guides",
      "Root A",
      "Root B",
    ]);
  });

  it("keeps nested group page ordering from navItems", async () => {
    mockCmsRequests({
      navItems: [
        {
          blockType: "groupItem",
          group: 11,
          pages: [{ page: 2 }, { page: 1 }],
        },
      ],
      groups: [{ id: 11, service: 1, name: "Guides", slug: "guides" }],
      pages: [createPage(1, "alpha", "Alpha"), createPage(2, "beta", "Beta")],
    });

    const nav = await getNav(baseConfig, {
      serviceSlug: "billing",
      version: "1.0.0",
    });

    expect(nav).toHaveLength(1);
    expect(nav[0]?.kind).toBe("group");
    expect(nav[0]?.children?.map((node) => node.slug)).toEqual([
      "beta",
      "alpha",
    ]);
  });

  it("excludes draft rows when includeDrafts is false", async () => {
    mockCmsRequests({
      navItems: [
        { blockType: "pageItem", page: 1, published: true },
        { blockType: "pageItem", page: 2, published: false },
      ],
      pages: [
        createPage(1, "published-page", "Published"),
        createPage(2, "draft-page", "Draft"),
      ],
    });

    const nav = await getNav(baseConfig, {
      serviceSlug: "billing",
      version: "1.0.0",
    });

    expect(nav.map((node) => node.slug)).toEqual(["published-page"]);
  });

  it("includes draft rows when includeDrafts is true", async () => {
    mockCmsRequests({
      navItems: [
        { blockType: "pageItem", page: 1, published: true },
        { blockType: "pageItem", page: 2, published: false },
      ],
      pages: [
        createPage(1, "published-page", "Published"),
        createPage(2, "draft-page", "Draft"),
      ],
    });

    const nav = await getNav(
      {
        ...baseConfig,
        includeDrafts: true,
      },
      {
        serviceSlug: "billing",
        version: "1.0.0",
      },
    );

    expect(nav.map((node) => node.slug)).toEqual([
      "published-page",
      "draft-page",
    ]);
  });

  it("resolves pages through version nav membership", async () => {
    mockCmsRequests({
      navItems: [{ blockType: "pageItem", page: 2 }],
      pages: [createPage(1, "intro", "Intro"), createPage(2, "usage", "Usage")],
    });

    await expect(
      getPage(baseConfig, {
        serviceSlug: "billing",
        version: "1.0.0",
        slug: "intro",
      }),
    ).resolves.toBeNull();

    await expect(
      getPage(baseConfig, {
        serviceSlug: "billing",
        version: "1.0.0",
        slug: "usage",
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 2, slug: "usage" }));
  });
});
