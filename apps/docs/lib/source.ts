import "server-only";

import {
  getNav,
  getPage,
  getServices,
  getVersions,
  type DocPage,
  type NavNode,
} from "@repo/docs-source";
import type { Folder, Item, Node, Root } from "fumadocs-core/page-tree";
import type { MetaData, PageData } from "fumadocs-core/source";
import { source as createSource, loader } from "fumadocs-core/source";
import type { TOCItemType } from "fumadocs-core/toc";
import { cache, createElement, JSX } from "react";

import { getCmsConfig } from "@/lib/cms-config";
import { CmsContent } from "@/lib/cms-content";
import {
  extractTocFromRichText,
  type RichTextComponentMap,
} from "@/lib/richtext";

type VirtualPage<PageData> = {
  type: "page";
  slugs?: string[] | undefined;
  data: PageData;
  path: string;
  absolutePath?: string;
};

type VirtualMeta<MetaData> = {
  type: "meta";
  data: MetaData;
  path: string;
  absolutePath?: string;
};

type CmsPageData = PageData & {
  body: (props: { components?: RichTextComponentMap }) => JSX.Element;
  toc?: TOCItemType[];
  full?: boolean;
};

type CmsMetaData = MetaData;

const normalizeSlug = (slug: string) =>
  slug
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

const buildVirtualPath = (segments: string[]) =>
  ["docs", ...segments].join("/") + ".mdx";

const buildMetaPath = (segments: string[]) =>
  ["docs", ...segments].join("/") + ".json";

const toTitle = (segment: string) =>
  segment.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const buildPageUrl = (
  serviceSlug: string,
  versionSlug: string,
  slug: string,
) => {
  const segments = normalizeSlug(slug);
  return `/${["docs", serviceSlug, versionSlug, ...segments].join("/")}`;
};

const collectNavSlugs = (nav: NavNode[]): string[] => {
  const ordered: string[] = [];
  const seen = new Set<string>();

  const walk = (node: NavNode) => {
    if (!seen.has(node.slug)) {
      ordered.push(node.slug);
      seen.add(node.slug);
    }
    node.children?.forEach(walk);
  };

  nav.forEach(walk);
  return ordered;
};

const buildNavNodes = (
  nav: NavNode[],
  options: {
    serviceSlug: string;
    versionSlug: string;
    pageBySlug: Map<string, DocPage>;
  },
): Node[] => {
  const { serviceSlug, versionSlug, pageBySlug } = options;

  const toPageItem = (slug: string, page: DocPage): Item => ({
    type: "page",
    name: page.title || toTitle(normalizeSlug(slug).slice(-1)[0] ?? "Docs"),
    url: buildPageUrl(serviceSlug, versionSlug, slug),
  });

  const walk = (nodes: NavNode[]): Node[] =>
    nodes.flatMap((node): Node[] => {
      const page = pageBySlug.get(node.slug);
      const children = node.children ? walk(node.children) : [];
      const label =
        node.title || toTitle(normalizeSlug(node.slug).slice(-1)[0] ?? "Docs");

      if (node.children && node.children.length > 0) {
        const folder: Folder = {
          type: "folder",
          name: label,
          children,
        };
        if (page) {
          folder.index = toPageItem(node.slug, page);
        }
        return [folder];
      }

      if (page) {
        return [toPageItem(node.slug, page)];
      }

      return [];
    });

  return walk(nav);
};

const buildSource = async () => {
  const config = getCmsConfig();
  const pages: VirtualPage<CmsPageData>[] = [];
  const metas: VirtualMeta<CmsMetaData>[] = [];
  const treeRoot: Root = { name: "Docs", children: [] };

  const services = await getServices(config, { depth: 1, limit: 200 });

  for (const service of services) {
    const serviceSlug = service.slug;
    const serviceFolder: Folder = {
      type: "folder",
      name: service.name,
      children: [],
    };
    metas.push({
      type: "meta",
      path: buildMetaPath([serviceSlug, "meta"]),
      data: {
        title: service.name,
      },
    });

    const versions = await getVersions(config, serviceSlug, { limit: 200 });

    for (const version of versions) {
      const versionSlug = `v${version.version}`;
      const versionFolder: Folder = {
        type: "folder",
        name: versionSlug,
        children: [],
      };
      metas.push({
        type: "meta",
        path: buildMetaPath([serviceSlug, versionSlug, "meta"]),
        data: {
          title: versionSlug,
        },
      });

      const nav = await getNav(config, {
        serviceSlug,
        version: version.version,
      });

      const slugs = collectNavSlugs(nav);

      const pageResults = await Promise.all(
        slugs.map((slug) =>
          getPage(config, {
            serviceSlug,
            version: version.version,
            slug,
          }),
        ),
      );

      const pageBySlug = new Map<string, DocPage>();
      pageResults.forEach((page, index) => {
        if (!page) return;
        const slug = slugs[index];
        if (!slug) return;
        pageBySlug.set(slug, page);

        const segments = normalizeSlug(page.slug);
        const slugsWithService = [serviceSlug, versionSlug, ...segments];
        const pathSegments = slugsWithService.length
          ? slugsWithService
          : [serviceSlug, versionSlug, "index"];

        const body = (props: { components?: RichTextComponentMap }) =>
          createElement(CmsContent, {
            content: page.content,
            components: props.components,
          });
        const toc = extractTocFromRichText(page.content);

        pages.push({
          type: "page",
          path: buildVirtualPath(pathSegments),
          slugs: slugsWithService,
          data: {
            title:
              page.title || toTitle(segments[segments.length - 1] ?? "Docs"),
            description: undefined,
            body,
            toc,
            full: true,
          },
        });
      });

      const versionNodes = buildNavNodes(nav, {
        serviceSlug,
        versionSlug,
        pageBySlug,
      });

      if (versionNodes.length > 0) {
        versionFolder.children = versionNodes;
        serviceFolder.children.push(versionFolder);
      }
    }

    if (serviceFolder.children.length > 0) {
      treeRoot.children.push(serviceFolder);
    }
  }

  const source = loader({
    baseUrl: "/docs",
    source: createSource({
      pages,
      metas,
    }),
  });

  source.pageTree = treeRoot;
  return source;
};

export const getSource = cache(buildSource);
