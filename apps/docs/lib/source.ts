import "server-only";

import { getNav, getPage, getServices, getVersions } from "@repo/docs-source";
import { loader, source as createSource } from "fumadocs-core/source";
import type { MetaData, PageData } from "fumadocs-core/source";
import type { TOCItemType } from "fumadocs-core/toc";
import { cache, createElement, JSX } from "react";

import { CmsContent } from "@/lib/cms-content";
import { getCmsConfig } from "@/lib/cms-config";

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
  body: (props: { components?: Record<string, unknown> }) => JSX.Element;
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

const buildSource = async () => {
  const config = getCmsConfig();
  const pages: VirtualPage<CmsPageData>[] = [];
  const metas: VirtualMeta<CmsMetaData>[] = [];

  const services = await getServices(config, { depth: 1, limit: 200 });

  for (const service of services) {
    const serviceSlug = service.slug;
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

      const slugSet = new Set<string>();
      const stack = [...nav];
      while (stack.length) {
        const current = stack.pop();
        if (!current) continue;
        slugSet.add(current.slug);
        if (current.children) {
          stack.push(...current.children);
        }
      }

      const slugs = Array.from(slugSet);

      const pageResults = await Promise.all(
        slugs.map((slug) =>
          getPage(config, {
            serviceSlug,
            version: version.version,
            slug,
          }),
        ),
      );

      pageResults
        .filter((page): page is NonNullable<typeof page> => Boolean(page))
        .forEach((page) => {
          const segments = normalizeSlug(page.slug);
          const slugsWithService = [serviceSlug, versionSlug, ...segments];
          const pathSegments = slugsWithService.length
            ? slugsWithService
            : [serviceSlug, versionSlug, "index"];

          const body = () =>
            createElement(CmsContent, { content: page.content });

          pages.push({
            type: "page",
            path: buildVirtualPath(pathSegments),
            slugs: slugsWithService,
            data: {
              title:
                page.title || toTitle(segments[segments.length - 1] ?? "Docs"),
              description: undefined,
              body,
              toc: [],
              full: true,
            },
          });
        });
    }
  }

  return loader({
    baseUrl: "/docs",
    source: createSource({
      pages,
      metas,
    }),
  });
};

export const getSource = cache(buildSource);
