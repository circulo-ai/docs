import {
  RichText,
  defaultJSXConverters,
  type JSXConverters,
} from "@payloadcms/richtext-lexical/react";
import type { TOCItemType } from "fumadocs-core/toc";
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

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

const prefixAssetUrl = (baseUrl: string | undefined, url: string) => {
  if (!baseUrl) return url;
  if (!url.startsWith("/")) return url;
  return `${normalizeBaseUrl(baseUrl)}${url}`;
};

const buildConverters = (options: {
  baseUrl?: string;
  components?: RichTextComponentMap;
  slugger: (value: string) => string;
}): JSXConverters => {
  const { baseUrl, components, slugger } = options;
  const linkComponent = components?.a ?? "a";
  const calloutComponent = components?.Callout ?? "div";
  const codeBlockComponent = components?.CodeBlock ?? components?.pre ?? "pre";

  const renderCodeBlockFromFields = (fields?: Record<string, unknown>) => {
    if (!fields) return null;
    const code = typeof fields.code === "string" ? (fields.code as string) : "";
    if (!code) return null;
    const language =
      typeof fields.language === "string"
        ? (fields.language as string)
        : undefined;
    const codeProps: ComponentProps<"code"> = language
      ? { className: `language-${language}` }
      : {};
    const codeNode = createElement("code", codeProps, code);
    return createElement(
      codeBlockComponent,
      {
        className: "code-block",
        "data-language": language,
      },
      codeNode,
    );
  };

  const renderCalloutFromFields = (fields?: Record<string, unknown>) => {
    if (!fields) return null;
    const title = typeof fields.title === "string" ? fields.title : "";
    const variant =
      typeof fields.variant === "string"
        ? fields.variant
        : typeof fields.type === "string"
          ? fields.type
          : undefined;
    const body =
      typeof fields.body === "string"
        ? fields.body
        : typeof fields.content === "string"
          ? fields.content
          : "";
    const nested =
      fields.content &&
      typeof fields.content === "object" &&
      isSerializedEditorState(fields.content)
        ? renderRichText(fields.content, components, { baseUrl })
        : null;
    if (!title && !body && !nested) return null;
    return createElement(
      calloutComponent,
      {
        className: "callout",
        "data-variant": variant,
      },
      [
        title ? createElement("strong", {}, title) : null,
        nested ?? (body ? createElement("p", {}, body) : null),
      ],
    );
  };

  return {
    ...defaultJSXConverters,
    upload: ({ node }) => {
      const uploadNode = node as {
        fields?: { alt?: string };
        value?: Record<string, unknown>;
      };
      if (!uploadNode.value || typeof uploadNode.value !== "object") {
        return null;
      }

      const uploadDoc = uploadNode.value as Record<string, unknown>;
      const alt =
        uploadNode.fields?.alt ||
        (typeof uploadDoc.alt === "string" ? uploadDoc.alt : "") ||
        "";
      const urlValue =
        typeof uploadDoc.url === "string" ? (uploadDoc.url as string) : "";
      const url = prefixAssetUrl(baseUrl, urlValue);
      const mimeType =
        typeof uploadDoc.mimeType === "string"
          ? (uploadDoc.mimeType as string)
          : "";

      if (!mimeType.startsWith("image")) {
        const filename =
          typeof uploadDoc.filename === "string"
            ? (uploadDoc.filename as string)
            : "Download";
        return createElement(
          linkComponent,
          { href: url, rel: "noopener noreferrer" },
          filename,
        );
      }

      const sizes =
        typeof uploadDoc.sizes === "object" && uploadDoc.sizes !== null
          ? (uploadDoc.sizes as Record<string, unknown>)
          : null;

      if (!sizes || Object.keys(sizes).length === 0) {
        const width =
          typeof uploadDoc.width === "number"
            ? (uploadDoc.width as number)
            : undefined;
        const height =
          typeof uploadDoc.height === "number"
            ? (uploadDoc.height as number)
            : undefined;
        const ImageComponent = components?.img ?? "img";
        return createElement(ImageComponent, { alt, height, src: url, width });
      }

      const pictureNodes: ReactNode[] = [];
      for (const [sizeKey, sizeValue] of Object.entries(sizes)) {
        if (!sizeValue || typeof sizeValue !== "object") continue;
        const size = sizeValue as Record<string, unknown>;
        const sizeUrl =
          typeof size.url === "string" ? (size.url as string) : "";
        if (!sizeUrl) continue;
        const sizeWidth =
          typeof size.width === "number" ? (size.width as number) : undefined;
        const sizeHeight =
          typeof size.height === "number" ? (size.height as number) : undefined;
        const sizeMimeType =
          typeof size.mimeType === "string" ? (size.mimeType as string) : "";
        if (!sizeWidth || !sizeHeight || !sizeMimeType) continue;
        const srcSet = prefixAssetUrl(baseUrl, sizeUrl);
        pictureNodes.push(
          createElement("source", {
            key: sizeKey,
            media: `(max-width: ${sizeWidth}px)`,
            srcSet,
            type: sizeMimeType,
          }),
        );
      }

      const fallbackWidth =
        typeof uploadDoc.width === "number"
          ? (uploadDoc.width as number)
          : undefined;
      const fallbackHeight =
        typeof uploadDoc.height === "number"
          ? (uploadDoc.height as number)
          : undefined;
      const ImageComponent = components?.img ?? "img";
      pictureNodes.push(
        createElement(ImageComponent, {
          key: "image",
          alt,
          height: fallbackHeight,
          src: url,
          width: fallbackWidth,
        }),
      );

      return createElement("picture", {}, pictureNodes);
    },
    blocks: {
      Code: ({ node }) => {
        const fields = (node as { fields?: Record<string, unknown> }).fields;
        return renderCodeBlockFromFields(fields);
      },
      code: ({ node }) => {
        const fields = (node as { fields?: Record<string, unknown> }).fields;
        return renderCodeBlockFromFields(fields);
      },
      Callout: ({ node }) => {
        const fields = (node as { fields?: Record<string, unknown> }).fields;
        return renderCalloutFromFields(fields);
      },
      callout: ({ node }) => {
        const fields = (node as { fields?: Record<string, unknown> }).fields;
        return renderCalloutFromFields(fields);
      },
    },
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
    code: ({ node, nodesToJSX }) => {
      const children =
        "children" in node && Array.isArray(node.children)
          ? nodesToJSX({ nodes: node.children })
          : collectText(node);
      const language =
        typeof (node as { language?: string }).language === "string"
          ? ((node as { language?: string }).language as string)
          : undefined;
      const codeProps: ComponentProps<"code"> = language
        ? { className: `language-${language}` }
        : {};
      const codeNode = createElement("code", codeProps, children);
      return createElement(
        codeBlockComponent,
        {
          className: "code-block",
          "data-language": language,
        },
        codeNode,
      );
    },
    link: ({ node, nodesToJSX }) => {
      const children = nodesToJSX({ nodes: node.children });
      const href = prefixAssetUrl(baseUrl, resolveLinkHref(node));
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
      const href = prefixAssetUrl(baseUrl, resolveLinkHref(node));
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
    unknown: ({ node, nodesToJSX }) => {
      if (node.type === "block") {
        const fields = (node as { fields?: Record<string, unknown> }).fields;
        const blockType =
          typeof fields?.blockType === "string"
            ? fields.blockType.toLowerCase()
            : "";
        if (fields?.code && typeof fields.code === "string") {
          return renderCodeBlockFromFields(fields);
        }
        if (blockType.includes("code")) {
          const rendered = renderCodeBlockFromFields(fields);
          if (rendered) return rendered;
        }
        if (
          fields?.title ||
          fields?.body ||
          (fields?.content && typeof fields.content === "string")
        ) {
          const rendered = renderCalloutFromFields(fields);
          if (rendered) return rendered;
        }
        if (blockType.includes("callout") || blockType.includes("alert")) {
          const rendered = renderCalloutFromFields(fields);
          if (rendered) return rendered;
        }
      }

      if ("children" in node && Array.isArray(node.children)) {
        return createElement("span", {}, nodesToJSX({ nodes: node.children }));
      }

      return null;
    },
  };
};

export const renderRichText = (
  content: unknown,
  components?: RichTextComponentMap,
  options?: { baseUrl?: string },
): ReactNode => {
  if (!isSerializedEditorState(content)) return null;
  const slugger = createSlugger();
  const converters = buildConverters({
    baseUrl: options?.baseUrl,
    components,
    slugger,
  });
  return (
    <RichText
      data={content}
      converters={converters}
      className="payload-richtext prose"
    />
  );
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
