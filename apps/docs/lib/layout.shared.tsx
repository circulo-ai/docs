import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import type { ReactNode } from "react";

type BaseOptionsOverrides = {
  navChildren?: ReactNode;
};

export function baseOptions(
  overrides: BaseOptionsOverrides = {},
): BaseLayoutProps {
  return {
    nav: {
      title: "My App",
    },
    links: [{ type: "custom", children: overrides.navChildren }],
  };
}
