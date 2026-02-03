import type { TOCItemType } from "fumadocs-core/toc";
import {
  RichText,
  defaultJSXConverters,
  type JSXConverters,
} from "@payloadcms/richtext-lexical/react";
import type { SerializedEditorState, SerializedLexicalNode } from "lexical";
import type { ComponentProps, ElementType, ReactNode } from "react";
import { createElement } from "react";

export type RichTextComponentMap = Record<string, ElementType | undefined>;

const isSerializedEditorState = (
  value: unknown,
): value is SerializedEditorState => {
  if (!value || typeof value !== "object") return false;
  return "root" in value;
};

const getChildren = (node: SerializedLexicalNode): SerializedLexicalNode[] => {
  const children = (node as { children?: SerializedLexicalNode[] }).children;
  return Array.isArray(children) ? children : [];
};

const collectText = (node: SerializedLexicalNode): string => {
  if (node.type === "text") {
    const text = (node as { text?: string }).text;
    return typeof text === "string" ? text : "";
  }

  return getChildren(node).map(collectText).join("");
};

const getHeadingDepth = (node: SerializedLexicalNode): number | null => {
  if (node.type !== "heading") return null;

  const level = (node as { level?: number }).level;
  if (typeof level === "number") return level;

  const tag = (node as { tag?: string }).tag;
  if (typeof tag === "string") {
    const match = tag.match(/^h([1-6])$/i);
    if (match) return Number(match[1]);
  }

  return null;
};

const getHeadingTag = (node: SerializedLexicalNode, depth: number | null) => {
  const tag = (node as { tag?: string }).tag;
  if (typeof tag === "string") return tag;
  if (depth) return `h${depth}`;
  return "h2";
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const createSlugger = () => {
  const counts = new Map<string, number>();
  return (value: string) => {
    const base = slugify(value) || "section";
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    if (count === 0) return base;
    return `${base}-${count + 1}`;
  };
};

const resolveLinkHref = (node: SerializedLexicalNode) => {
  const fields = (node as { fields?: Record<string, unknown> }).fields;
  if (!fields || typeof fields !== "object") return "";

  if (fields.linkType === "internal") {
    const doc = (fields as { doc?: unknown }).doc;
    if (doc && typeof doc === "object") {
      const value =
        "value" in doc && typeof (doc as { value?: unknown }).value === "object"
          ? (doc as { value?: Record<string, unknown> }).value
          : (doc as Record<string, unknown>);
      if (value) {
        const url = value.url;
        if (typeof url === "string") return url;
        const slug = value.slug;
        if (typeof slug === "string") return `/${slug}`;
      }
    }
  }

  const url = fields.url;
  if (typeof url === "string") return url;

  return "";
};

const resolveLinkNewTab = (node: SerializedLexicalNode) => {
  const fields = (node as { fields?: Record<string, unknown> }).fields;
  return Boolean(fields && (fields as { newTab?: boolean }).newTab);
};

const buildConverters = (options: {
  components?: RichTextComponentMap;
  slugger: (value: string) => string;
}): JSXConverters => {
  const { components, slugger } = options;
  const linkComponent = components?.a ?? "a";

  return {
    ...defaultJSXConverters,
    heading: ({ node, nodesToJSX }) => {
      const depth = getHeadingDepth(node);
      const tag = getHeadingTag(node, depth);
      const children = nodesToJSX({ nodes: node.children });
      const title = collectText(node).trim();
      const shouldAnchor =
        depth !== null && depth >= 2 && depth <= 6 && title.length > 0;
      const id = shouldAnchor ? slugger(title) : undefined;
      const HeadingComponent = components?.[tag] ?? tag;
      return createElement(HeadingComponent, id ? { id } : {}, children);
    },
    link: ({ node, nodesToJSX }) => {
      const children = nodesToJSX({ nodes: node.children });
      const href = resolveLinkHref(node);
      const newTab = resolveLinkNewTab(node);
      const props: ComponentProps<"a"> = {
        href: href || undefined,
      };
      if (newTab) {
        props.target = "_blank";
        props.rel = "noreferrer noopener";
      }
      return createElement(linkComponent, props, children);
    },
    autolink: ({ node, nodesToJSX }) => {
      const children = nodesToJSX({ nodes: node.children });
      const href = resolveLinkHref(node);
      const newTab = resolveLinkNewTab(node);
      const props: ComponentProps<"a"> = {
        href: href || undefined,
      };
      if (newTab) {
        props.target = "_blank";
        props.rel = "noreferrer noopener";
      }
      return createElement(linkComponent, props, children);
    },
  };
};

export const renderRichText = (
  content: unknown,
  components?: RichTextComponentMap,
): ReactNode => {
  if (!isSerializedEditorState(content)) return null;
  const slugger = createSlugger();
  const converters = buildConverters({ components, slugger });
  return <RichText data={content} converters={converters} disableContainer />;
};

export const extractTocFromRichText = (content: unknown): TOCItemType[] => {
  if (!isSerializedEditorState(content)) return [];

  const toc: TOCItemType[] = [];
  const slugger = createSlugger();
  const root = (content as SerializedEditorState).root;
  const nodes = Array.isArray(root?.children) ? root.children : [];

  const walk = (node: SerializedLexicalNode) => {
    const depth = getHeadingDepth(node);
    if (depth && depth >= 2 && depth <= 6) {
      const title = collectText(node).trim();
      if (title) {
        toc.push({
          title,
          url: `#${slugger(title)}`,
          depth,
        });
      }
    }
    getChildren(node).forEach(walk);
  };

  nodes.forEach(walk);
  return toc;
};
