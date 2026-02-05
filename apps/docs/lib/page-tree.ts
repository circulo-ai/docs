import { getLatestVersion, getServices } from "@repo/docs-source";
import type { Folder, Item, Node, Root } from "fumadocs-core/page-tree";
import { cache } from "react";

import { getCmsConfig } from "@/lib/cms-config";

const VERSION_SEGMENT_REGEX =
  /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

const getLatestVersionMap = cache(async () => {
  const config = getCmsConfig();
  const services = await getServices(config, { depth: 0, limit: 200 });
  const entries = await Promise.all(
    services.map(async (service) => {
      const latest = await getLatestVersion(config, service.slug);
      return latest ? ([service.slug, `v${latest.version}`] as const) : null;
    }),
  );

  return new Map(entries.filter(Boolean) as Array<readonly [string, string]>);
});

const rewriteUrl = (url: string, latestMap: Map<string, string>) => {
  const match = url.match(/^\/docs\/([^/]+)\/([^/]+)(\/.*)?$/);
  if (!match) return url;

  const [, service, versionSegment, rest = ""] = match;
  if (versionSegment && !VERSION_SEGMENT_REGEX.test(versionSegment)) return url;

  const latest = service ? latestMap.get(service) : undefined;
  if (!latest || latest !== versionSegment) return url;

  return `/docs/${service}${rest}`;
};

const rewriteItem = (item: Item, latestMap: Map<string, string>): Item => ({
  ...item,
  url: rewriteUrl(item.url, latestMap),
});

const rewriteNode = (node: Node, latestMap: Map<string, string>): Node => {
  switch (node.type) {
    case "page":
      return rewriteItem(node, latestMap);
    case "folder": {
      const folder = node as Folder;
      return {
        ...folder,
        index: folder.index
          ? rewriteItem(folder.index, latestMap)
          : folder.index,
        children: folder.children.map((child) => rewriteNode(child, latestMap)),
      };
    }
    case "separator":
      return node;
  }
};

export const buildAliasTree = async (tree: Root): Promise<Root> => {
  const latestMap = await getLatestVersionMap();
  return {
    ...tree,
    children: tree.children.map((child) => rewriteNode(child, latestMap)),
  };
};
