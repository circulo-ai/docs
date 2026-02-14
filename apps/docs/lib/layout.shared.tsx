import { LargeSearchToggle } from "@/components/search-toggle";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { BookOpen } from "lucide-react";
import type { ReactNode } from "react";

type BaseOptionsOverrides = {
  navChildren?: ReactNode;
};

export function baseOptions(
  overrides: BaseOptionsOverrides = {},
): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <BookOpen /> Circulo AI Docs
        </>
      ),
    },
    searchToggle: { components: { lg: <LargeSearchToggle /> } },
    links: [{ type: "custom", children: overrides.navChildren }],
  };
}
