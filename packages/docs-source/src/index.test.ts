import { afterEach, describe, expect, it, vi } from "vitest";

import { getNav, type DocPage } from "./index.js";

type TestDocPage = DocPage & { order?: number };

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
});
