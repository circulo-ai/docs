"use client";

import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { DocsLayoutProps } from "fumadocs-ui/layouts/docs";
import type { Root, Node, Folder } from "fumadocs-core/page-tree";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

type DocsLayoutClientProps = Omit<DocsLayoutProps, "tree"> & {
  tree: Root;
  aliasTree: Root;
};

const VERSIONED_PATH_REGEX =
  /^\/docs\/[^/]+\/v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?(?:\/|$)/;
const VERSION_SEGMENT_REGEX =
  /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

type ParsedPath = {
  service?: string;
  version?: string;
};

const parseDocsPath = (pathname: string): ParsedPath => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "docs") return {};

  const service = segments[1];
  if (!service) return {};

  const versionSegment = segments[2];
  if (versionSegment && VERSION_SEGMENT_REGEX.test(versionSegment)) {
    return {
      service,
      version: versionSegment.slice(1),
    };
  }

  return { service };
};

const isFolder = (node: Node): node is Folder => node.type === "folder";

const findFirstPageUrl = (node: Node): string | null => {
  if (node.type === "page") return node.url;
  if (node.type === "folder") {
    if (node.index) return node.index.url;
    for (const child of node.children) {
      const url = findFirstPageUrl(child);
      if (url) return url;
    }
  }
  return null;
};

const findServiceFolder = (tree: Root, service: string): Folder | null => {
  const children = tree.children.filter(isFolder);
  for (const folder of children) {
    const url = findFirstPageUrl(folder);
    if (!url) continue;
    const match = url.match(/^\/docs\/([^/]+)/);
    if (match?.[1] === service) return folder;
  }

  return null;
};

const findVersionFolder = (
  serviceFolder: Folder,
  service: string,
  version?: string,
): Folder | null => {
  const versionFolders = serviceFolder.children.filter(isFolder);
  if (versionFolders.length === 0) return null;

  const matchPrefix = version
    ? new RegExp(`^/docs/${service}/v${version}(?:/|$)`)
    : new RegExp(`^/docs/${service}/(?!v\\d)`);

  for (const folder of versionFolders) {
    const url = findFirstPageUrl(folder);
    if (!url) continue;
    if (matchPrefix.test(url)) return folder;
  }

  return versionFolders[0] ?? null;
};

const filterTreeForRoute = (tree: Root, parsed: ParsedPath): Root => {
  if (!parsed.service) {
    return {
      ...tree,
      children: [],
    };
  }

  const serviceFolder = findServiceFolder(tree, parsed.service);
  if (!serviceFolder) {
    return {
      ...tree,
      children: [],
    };
  }

  const versionFolder = findVersionFolder(
    serviceFolder,
    parsed.service,
    parsed.version,
  );
  if (!versionFolder) {
    return {
      ...tree,
      children: [],
    };
  }

  return {
    ...tree,
    children: versionFolder.children,
  };
};

export function DocsLayoutClient({
  tree,
  aliasTree,
  ...props
}: DocsLayoutClientProps) {
  const pathname = usePathname() ?? "";
  const useAliasTree = !VERSIONED_PATH_REGEX.test(pathname);
  const parsed = useMemo(() => parseDocsPath(pathname), [pathname]);
  const baseTree = useAliasTree ? aliasTree : tree;
  const filteredTree = useMemo(
    () => filterTreeForRoute(baseTree, parsed),
    [baseTree, parsed],
  );

  return <DocsLayout tree={filteredTree} {...props} />;
}
