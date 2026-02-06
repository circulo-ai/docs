import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import type { ElementType } from "react";

import type { RichTextComponentMap } from "@/lib/richtext";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...components,
  };
}

const isElementType = (value: unknown): value is ElementType =>
  typeof value === "string" || typeof value === "function";

export function getRichTextComponents(
  components?: MDXComponents,
): RichTextComponentMap {
  const merged = getMDXComponents(components);
  const richTextComponents: RichTextComponentMap = {};

  for (const [key, value] of Object.entries(merged)) {
    if (isElementType(value)) {
      richTextComponents[key] = value;
    }
  }

  return richTextComponents;
}
