"use client";

import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { DocsLayoutProps } from "fumadocs-ui/layouts/docs";
import type { Root } from "fumadocs-core/page-tree";
import { usePathname } from "next/navigation";

type DocsLayoutClientProps = Omit<DocsLayoutProps, "tree"> & {
  tree: Root;
  aliasTree: Root;
};

const VERSIONED_PATH_REGEX =
  /^\/docs\/[^/]+\/v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?(?:\/|$)/;

export function DocsLayoutClient({
  tree,
  aliasTree,
  ...props
}: DocsLayoutClientProps) {
  const pathname = usePathname() ?? "";
  const useAliasTree = !VERSIONED_PATH_REGEX.test(pathname);

  return <DocsLayout tree={useAliasTree ? aliasTree : tree} {...props} />;
}
