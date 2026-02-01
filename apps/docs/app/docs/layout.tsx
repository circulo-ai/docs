import { getSource } from "@/lib/source";
import { baseOptions } from "@/lib/layout.shared";
import { buildAliasTree } from "@/lib/page-tree";
import { DocsLayoutClient } from "@/lib/docs-layout-client";
import { getServiceVersionOptions } from "@/lib/service-version-options";
import { ServiceVersionSwitcher } from "@/lib/service-version-switcher";

export default async function Layout({ children }: LayoutProps<"/docs">) {
  const [source, serviceVersionOptions] = await Promise.all([
    getSource(),
    getServiceVersionOptions(),
  ]);
  const tree = source.getPageTree();
  const aliasTree = await buildAliasTree(tree);
  const navChildren = (
    <ServiceVersionSwitcher
      services={serviceVersionOptions.services}
      versionsByService={serviceVersionOptions.versionsByService}
    />
  );

  return (
    <DocsLayoutClient
      tree={tree}
      aliasTree={aliasTree}
      {...baseOptions({ navChildren })}
    >
      {children}
    </DocsLayoutClient>
  );
}
