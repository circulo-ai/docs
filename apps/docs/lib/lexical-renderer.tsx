import type { ElementType, ReactNode } from "react";
import { Fragment, createElement } from "react";
import type { TOCItemType } from "fumadocs-core/toc";

import {
  collectText,
  createSlugger,
  getChildren,
  getHeadingDepth,
  isNode,
  isObject,
  type LexicalDocument,
  type LexicalNode,
} from "@/lib/lexical-utils";

export type ComponentMap = Record<string, ElementType | undefined>; // Maybe move it to anther file?

type RenderOptions = {
  components?: ComponentMap;
};

type RenderResult = {
  content: ReactNode;
  toc: TOCItemType[];
};

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_UNDERLINE = 4;
const FORMAT_STRIKETHROUGH = 8;
const FORMAT_CODE = 16;
const FORMAT_SUBSCRIPT = 32;
const FORMAT_SUPERSCRIPT = 64;

const renderElement = (
  tag: string,
  props: Record<string, unknown>,
  children: ReactNode,
  components?: ComponentMap,
  key?: string,
) => {
  const Component = components?.[tag] ?? tag;
  if (children === undefined) {
    return createElement(Component, { ...props, key });
  }
  return createElement(Component, { ...props, key }, children);
};

const wrapKey = (node: ReactNode, key?: string) =>
  key ? createElement(Fragment, { key }, node) : node;

const normalizeHeadingTag = (depth: number) =>
  `h${Math.min(Math.max(depth, 1), 6)}`;

const getLinkFields = (node: LexicalNode) =>
  isObject(node.fields) ? node.fields : undefined;

const resolveLinkHref = (node: LexicalNode) => {
  if (typeof node.url === "string") return node.url;
  const fields = getLinkFields(node);
  if (!fields) return undefined;
  if (typeof fields.url === "string") return fields.url;
  if (typeof fields.href === "string") return fields.href;
  const doc = fields.doc;
  if (isObject(doc)) {
    const value = isObject(doc.value) ? doc.value : doc;
    if (typeof value.url === "string") return value.url;
    if (typeof value.slug === "string") return `/${value.slug}`;
  }
  return undefined;
};

const resolveLinkNewTab = (node: LexicalNode) => {
  if (typeof node.newTab === "boolean") return node.newTab;
  const fields = getLinkFields(node);
  if (typeof fields?.newTab === "boolean") return fields.newTab;
  return false;
};

const resolveUploadValue = (node: LexicalNode) => {
  if (isObject(node.value)) return node.value;
  const fields = isObject(node.fields) ? node.fields : undefined;
  if (isObject(fields?.value)) return fields?.value;
  return undefined;
};

const renderTextNode = (
  node: LexicalNode,
  components?: ComponentMap,
  key?: string,
) => {
  if (typeof node.text !== "string") return null;
  const format = typeof node.format === "number" ? node.format : 0;
  let content: ReactNode = node.text;

  if (format & FORMAT_CODE) {
    content = renderElement("code", {}, content, components);
  }
  if (format & FORMAT_BOLD) {
    content = renderElement("strong", {}, content, components);
  }
  if (format & FORMAT_ITALIC) {
    content = renderElement("em", {}, content, components);
  }
  if (format & FORMAT_UNDERLINE) {
    content = renderElement("u", {}, content, components);
  }
  if (format & FORMAT_STRIKETHROUGH) {
    content = renderElement("s", {}, content, components);
  }
  if (format & FORMAT_SUBSCRIPT) {
    content = renderElement("sub", {}, content, components);
  }
  if (format & FORMAT_SUPERSCRIPT) {
    content = renderElement("sup", {}, content, components);
  }

  return wrapKey(content, key);
};

const renderCodeBlock = (
  code: string,
  language: string | undefined,
  components?: ComponentMap,
  key?: string,
) => {
  const codeProps = language ? { className: `language-${language}` } : {};
  const codeNode = renderElement("code", codeProps, code, components);
  return renderElement("pre", {}, codeNode, components, key);
};

const renderBlockNode = (
  node: LexicalNode,
  components?: ComponentMap,
  key?: string,
  slugger?: ReturnType<typeof createSlugger>,
  toc?: TOCItemType[],
) => {
  const fields = isObject(node.fields) ? node.fields : undefined;
  const blockType =
    typeof fields?.blockType === "string" ? fields.blockType : undefined;
  if (blockType && blockType.toLowerCase().includes("code")) {
    const code = typeof fields?.code === "string" ? fields?.code : "";
    const language =
      typeof fields?.language === "string" ? fields?.language : undefined;
    return renderCodeBlock(code, language, components, key);
  }
  const children = getChildren(node);
  if (children.length === 0) return null;
  return renderElement(
    "div",
    { "data-block-type": blockType },
    children.map((child, index) =>
      renderLexicalNode(
        child,
        components,
        `${key ?? "block"}-${index}`,
        slugger,
        toc,
      ),
    ),
    components,
    key,
  );
};

const renderUploadNode = (
  node: LexicalNode,
  components?: ComponentMap,
  key?: string,
) => {
  const value = resolveUploadValue(node);
  if (!value) return null;
  const url = typeof value.url === "string" ? value.url : undefined;
  if (!url) return null;
  const alt =
    typeof value.alt === "string"
      ? value.alt
      : typeof value.filename === "string"
        ? value.filename
        : "";
  const width = typeof value.width === "number" ? value.width : undefined;
  const height = typeof value.height === "number" ? value.height : undefined;

  return renderElement(
    "img",
    { src: url, alt, width, height, loading: "lazy" },
    undefined,
    components,
    key,
  );
};

const renderLexicalNode = (
  node: LexicalNode,
  components?: ComponentMap,
  key?: string,
  slugger?: ReturnType<typeof createSlugger>,
  toc?: TOCItemType[],
): ReactNode => {
  switch (node.type) {
    case "root": {
      const children = getChildren(node).map((child, index) =>
        renderLexicalNode(
          child,
          components,
          `${key ?? "root"}-${index}`,
          slugger,
          toc,
        ),
      );
      return wrapKey(createElement(Fragment, null, children), key);
    }
    case "paragraph": {
      const children = getChildren(node).map((child, index) =>
        renderLexicalNode(
          child,
          components,
          `${key ?? "p"}-${index}`,
          slugger,
          toc,
        ),
      );
      return renderElement("p", {}, children, components, key);
    }
    case "heading": {
      const depth = getHeadingDepth(node) ?? 2;
      const tag = normalizeHeadingTag(depth);
      const title = collectText(node).trim();
      const shouldAnchor = depth >= 2 && depth <= 6 && title;
      const id = shouldAnchor && slugger ? slugger(title) : undefined;
      if (shouldAnchor && toc) {
        toc.push({
          title,
          url: `#${id}`,
          depth,
        });
      }
      const children = getChildren(node).map((child, index) =>
        renderLexicalNode(
          child,
          components,
          `${key ?? "heading"}-${index}`,
          slugger,
          toc,
        ),
      );
      return renderElement(tag, id ? { id } : {}, children, components, key);
    }
    case "text":
      return renderTextNode(node, components, key);
    case "linebreak":
      return createElement("br", { key });
    case "tab":
      return wrapKey("\t", key);
    case "list": {
      const listType = typeof node.listType === "string" ? node.listType : "";
      const tag = node.tag === "ol" || listType === "number" ? "ol" : "ul";
      const children = getChildren(node).map((child, index) =>
        renderLexicalNode(
          child,
          components,
          `${key ?? "list"}-${index}`,
          slugger,
          toc,
        ),
      );
      return renderElement(tag, {}, children, components, key);
    }
    case "listitem":
    case "list-item": {
      const children = getChildren(node).map((child, index) =>
        renderLexicalNode(
          child,
          components,
          `${key ?? "li"}-${index}`,
          slugger,
          toc,
        ),
      );
      return renderElement("li", {}, children, components, key);
    }
    case "blockquote": {
      const children = getChildren(node).map((child, index) =>
        renderLexicalNode(
          child,
          components,
          `${key ?? "quote"}-${index}`,
          slugger,
          toc,
        ),
      );
      return renderElement("blockquote", {}, children, components, key);
    }
    case "horizontalrule":
    case "hr":
      return createElement("hr", { key });
    case "link":
    case "autolink": {
      const href = resolveLinkHref(node);
      const newTab = resolveLinkNewTab(node);
      const children = getChildren(node).map((child, index) =>
        renderLexicalNode(
          child,
          components,
          `${key ?? "link"}-${index}`,
          slugger,
          toc,
        ),
      );
      if (!href) {
        return wrapKey(createElement(Fragment, null, children), key);
      }
      const props: Record<string, unknown> = {};
      props.href = href;
      if (newTab) {
        props.target = "_blank";
        props.rel = "noreferrer noopener";
      }
      return renderElement("a", props, children, components, key);
    }
    case "upload":
      return renderUploadNode(node, components, key);
    case "code": {
      const codeText =
        typeof node.text === "string" ? node.text : collectText(node);
      const language =
        typeof node.language === "string" ? node.language : undefined;
      return renderCodeBlock(codeText, language, components, key);
    }
    case "block":
      return renderBlockNode(node, components, key, slugger, toc);
    default: {
      const children = getChildren(node);
      if (children.length === 0) return null;
      const rendered = children.map((child, index) =>
        renderLexicalNode(
          child,
          components,
          `${key ?? "node"}-${index}`,
          slugger,
          toc,
        ),
      );
      return wrapKey(createElement(Fragment, null, rendered), key);
    }
  }
};

export const renderLexicalContent = (
  content: unknown,
  options: RenderOptions = {},
): RenderResult => {
  if (!isObject(content)) return { content: null, toc: [] };
  const rootValue = (content as LexicalDocument).root;
  if (!isNode(rootValue)) return { content: null, toc: [] };

  const toc: TOCItemType[] = [];
  const slugger = createSlugger();

  const rendered = renderLexicalNode(
    rootValue,
    options.components,
    "root",
    slugger,
    toc,
  );

  return { content: rendered, toc };
};
