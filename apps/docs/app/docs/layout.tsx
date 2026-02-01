import { getSource } from "@/lib/source";
import { baseOptions } from "@/lib/layout.shared";
import { buildAliasTree } from "@/lib/page-tree";
import { DocsLayoutClient } from "@/lib/docs-layout-client";

export default async function Layout({ children }: LayoutProps<"/docs">) {
  const source = await getSource();
  const tree = source.getPageTree();
  const aliasTree = await buildAliasTree(tree);
  return (
    <DocsLayoutClient tree={tree} aliasTree={aliasTree} {...baseOptions()}>
      {children}
    </DocsLayoutClient>
  );
}
