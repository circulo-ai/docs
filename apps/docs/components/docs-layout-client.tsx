"use client";

import type { Folder, Node, Root } from "fumadocs-core/page-tree";
import type { DocsLayoutProps } from "fumadocs-ui/layouts/docs";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

type DocsLayoutClientProps = Omit<DocsLayoutProps, "tree"> & {
  tree: Root;
  aliasTree: Root;
};

const VERSIONED_PATH_REGEX =
  /^\/[^/]+\/v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?(?:\/|$)/;
const VERSION_SEGMENT_REGEX =
  /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

type ParsedPath = {
  service?: string;
  version?: string;
};

const parseDocsPath = (pathname: string): ParsedPath => {
  const segments = pathname.split("/").filter(Boolean);
  const service = segments[0];
  if (!service) return {};

  const versionSegment = segments[1];
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
    const match = url.match(/^\/([^/]+)/);
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
    ? new RegExp(`^/${service}/v${version}(?:/|$)`)
    : new RegExp(`^/${service}/(?!v\\d)`);

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

  return (
    <DocsLayout
      themeSwitch={{ mode: "light-dark-system" }}
      sidebar={{
        className:
          "[&_[data-radix-scroll-area-viewport]>div:first-child]:block!",
      }}
      tree={filteredTree}
      {...props}
    />
  );
}
