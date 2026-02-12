import {
  RichText,
  defaultJSXConverters,
  type JSXConverters,
} from "@payloadcms/richtext-lexical/react";
import type { TOCItemType } from "fumadocs-core/toc";
import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Banner } from "fumadocs-ui/components/banner";
import { Callout } from "fumadocs-ui/components/callout";
import { Card, Cards } from "fumadocs-ui/components/card";
import {
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
} from "fumadocs-ui/components/codeblock";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { File, Files, Folder } from "fumadocs-ui/components/files";
import { GithubInfo } from "fumadocs-ui/components/github-info";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { InlineTOC } from "fumadocs-ui/components/inline-toc";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { TypeTable } from "fumadocs-ui/components/type-table";
import type { SerializedEditorState, SerializedLexicalNode } from "lexical";
import type { ComponentProps, ElementType, ReactNode } from "react";
import { createElement } from "react";

import { resolveUploadRenderDimensions } from "@/lib/upload-dimensions";

export type RichTextComponentMap = Record<string, ElementType | undefined>;

type JsonRecord = Record<string, unknown>;

type BlockRenderOptions = {
  baseUrl?: string;
  tocItems?: TOCItemType[];
};

const isDefined = <T,>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

const asRecord = (value: unknown): JsonRecord | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as JsonRecord;
};

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" ? value : undefined;

const asBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

const ensureString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const parseLines = (value: unknown): string[] =>
  ensureString(value)
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean);

const parseCsv = (value: unknown): string[] =>
  ensureString(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeSlugSegments = (value: string) =>
  value
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

const encodeSlugPath = (value: string) =>
  normalizeSlugSegments(value).map(encodeURIComponent).join("/");

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

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

const prefixAssetUrl = (baseUrl: string | undefined, url: string) => {
  if (!baseUrl) return url;
  if (!url.startsWith("/")) return url;
  return `${normalizeBaseUrl(baseUrl)}${url}`;
};

const relationValueToObject = (value: unknown): JsonRecord | null => {
  const record = asRecord(value);
  if (!record) return null;
  const nested = asRecord(record.value);
  return nested ?? record;
};

const resolveInternalLinkHref = (fields: JsonRecord) => {
  const docField = asRecord(fields.doc);
  const relationTo = asString(docField?.relationTo) ?? "";
  const value = relationValueToObject(docField?.value ?? docField);

  if (relationTo === "docPages" && value) {
    const pageSlug = asString(value.slug);
    const service = relationValueToObject(value.service);
    const version = relationValueToObject(value.version);
    const serviceSlug = asString(service?.slug);
    const versionSemver = asString(version?.version);

    if (serviceSlug && versionSemver && pageSlug) {
      return {
        href: `/${encodeURIComponent(serviceSlug)}/v${versionSemver}/${encodeSlugPath(pageSlug)}`,
        isAsset: false,
      };
    }

    if (pageSlug) {
      return {
        href: `/${encodeSlugPath(pageSlug)}`,
        isAsset: false,
      };
    }
  }

  if (relationTo === "media" && value) {
    const mediaUrl = asString(value.url);
    if (mediaUrl) return { href: mediaUrl, isAsset: true };
  }

  const relationUrl = asString(value?.url);
  if (relationUrl) return { href: relationUrl, isAsset: false };

  const relationSlug = asString(value?.slug);
  if (relationSlug) {
    return {
      href: `/${encodeSlugPath(relationSlug)}`,
      isAsset: false,
    };
  }

  const fallbackUrl = asString(fields.url);
  return {
    href: fallbackUrl ?? "",
    isAsset: false,
  };
};

const resolveLinkHref = (node: SerializedLexicalNode) => {
  const fields = asRecord((node as { fields?: unknown }).fields);
  if (!fields) return { href: "", isAsset: false };

  if (fields.linkType === "internal") {
    return resolveInternalLinkHref(fields);
  }

  const url = asString(fields.url);
  return {
    href: url ?? "",
    isAsset: false,
  };
};

const resolveLinkNewTab = (node: SerializedLexicalNode) => {
  const fields = asRecord((node as { fields?: unknown }).fields);
  return Boolean(fields && asBoolean(fields.newTab));
};

const renderTextBlock = (value: unknown) => {
  const text = asString(value);
  if (!text) return null;
  return createElement("div", { className: "whitespace-pre-wrap" }, text);
};

const renderCodeBlockFromFields = (fields?: JsonRecord) => {
  if (!fields) return null;
  const code = asString(fields.code);
  if (!code) return null;
  const language = asString(fields.language) ?? "text";
  const title = asString(fields.title);

  return createElement(DynamicCodeBlock, {
    lang: language,
    code,
    codeblock: title ? { title } : undefined,
  });
};

const renderCalloutFromFields = (fields?: JsonRecord) => {
  if (!fields) return null;
  const title = asString(fields.title);
  const type = asString(fields.type);
  const content = asString(fields.content) ?? asString(fields.body);

  if (!title && !content) return null;

  return createElement(
    Callout,
    {
      title,
      type:
        type === "warn" ||
        type === "warning" ||
        type === "error" ||
        type === "success" ||
        type === "idea"
          ? type
          : "info",
    },
    renderTextBlock(content),
  );
};

const renderCardsFromFields = (fields?: JsonRecord) => {
  if (!fields) return null;
  const cards = asArray(fields.cards)
    .map((value) => asRecord(value))
    .filter((value): value is JsonRecord => Boolean(value))
    .map((card, index) => {
      const title = asString(card.title);
      if (!title) return null;
      return createElement(Card, {
        key: `${title}-${index}`,
        title,
        description: asString(card.description),
        href: asString(card.href),
        external: asBoolean(card.external)?.toString() as unknown as boolean,
      });
    })
    .filter(isDefined);

  if (cards.length === 0) return null;
  return createElement(Cards, {}, cards);
};

const renderTabsFromFields = (fields?: JsonRecord) => {
  if (!fields) return null;

  const tabs = asArray(fields.tabs)
    .map((value) => asRecord(value))
    .filter((value): value is JsonRecord => Boolean(value))
    .map((tab, index) => {
      const content = asString(tab.content);
      if (!content) return null;

      return {
        key: `tab-${index + 1}`,
        title: asString(tab.title) ?? `Tab ${index + 1}`,
        content,
      };
    })
    .filter(isDefined);

  if (tabs.length === 0) return null;

  const defaultIndex = Math.max(0, asNumber(fields.defaultIndex) ?? 0);
  const label = asString(fields.label);

  return createElement(
    Tabs,
    {
      items: tabs.map((tab) => tab.title),
      defaultIndex,
      label,
    },
    tabs.map((tab) =>
      createElement(Tab, { key: tab.key }, renderTextBlock(tab.content)),
    ),
  );
};

const renderAccordionsFromFields = (fields?: JsonRecord) => {
  if (!fields) return null;

  const items = asArray(fields.items)
    .map((value) => asRecord(value))
    .filter((value): value is JsonRecord => Boolean(value))
    .map((item, index) => {
      const title = asString(item.title);
      const content = asString(item.content);
      if (!title || !content) return null;
      const value = asString(item.value) ?? `item-${index + 1}`;
      return {
        title,
        value,
        content,
      };
    })
    .filter(isDefined);

  if (items.length === 0) return null;

  const accordionType =
    asString(fields.type) === "multiple" ? "multiple" : "single";
  const defaultValues = parseCsv(fields.defaultOpenValues);
  const accordionProps =
    accordionType === "multiple"
      ? {
          type: "multiple" as const,
          defaultValue: defaultValues.length > 0 ? defaultValues : undefined,
        }
      : {
          type: "single" as const,
          collapsible: true,
          defaultValue: defaultValues[0],
        };

  return createElement(
    Accordions,
    accordionProps,
    items.map((item, index) =>
      createElement(
        Accordion,
        {
          key: `${item.value}-${index}`,
          title: item.title,
          value: item.value,
        },
        renderTextBlock(item.content),
      ),
    ),
  );
};

const renderStepsFromFields = (fields?: JsonRecord) => {
  if (!fields) return null;

  const steps = asArray(fields.steps)
    .map((value) => asRecord(value))
    .filter((value): value is JsonRecord => Boolean(value))
    .map((step, index) => {
      const content = asString(step.content);
      if (!content) return null;
      const title = asString(step.title);
      return {
        key: `${title ?? "step"}-${index}`,
        title,
        content,
      };
    })
    .filter(isDefined);

  if (steps.length === 0) return null;

  return (
    <Steps>
      {steps.map((step) => (
        <Step key={step.key}>
          <div className="space-y-2">
            {step.title ? <p className="font-medium">{step.title}</p> : null}
            {renderTextBlock(step.content)}
          </div>
        </Step>
      ))}
    </Steps>
  );
};

const renderFilesFromFields = (fields?: JsonRecord) => {
  if (!fields) return null;

  const entries = asArray(fields.entries)
    .map((value) => asRecord(value))
    .filter((value): value is JsonRecord => Boolean(value))
    .map((entry, index) => {
      const kind = asString(entry.kind) ?? "file";
      const name = asString(entry.name);
      if (!name) return null;

      if (kind === "folder") {
        const children = parseLines(entry.children);
        return createElement(
          Folder,
          {
            key: `${name}-${index}`,
            name,
            defaultOpen: asBoolean(entry.defaultOpen),
          },
          children.map((child, childIndex) =>
            createElement(File, { key: `${child}-${childIndex}`, name: child }),
          ),
        );
      }

      return createElement(File, { key: `${name}-${index}`, name });
    })
    .filter(isDefined);

  if (entries.length === 0) return null;

  return createElement(Files, {}, entries);
};

const toCodeTabValue = (title: string, index: number) => {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || `tab-${index + 1}`;
};

const renderCodeTabsFromFields = (fields?: JsonRecord) => {
  if (!fields) return null;

  const tabs = asArray(fields.tabs)
    .map((value) => asRecord(value))
    .filter((value): value is JsonRecord => Boolean(value))
    .map((tab, index) => {
      const title = asString(tab.title) ?? `Tab ${index + 1}`;
      const language = asString(tab.language) ?? "text";
      const code = asString(tab.code);
      if (!code) return null;
      const value = toCodeTabValue(title, index);
      return {
        code,
        language,
        title,
        value,
      };
    })
    .filter(isDefined);

  if (tabs.length === 0) return null;

  return createElement(
    CodeBlockTabs,
    {
      defaultValue: tabs[0]?.value,
    },
    [
      createElement(
        CodeBlockTabsList,
        { key: "list" },
        tabs.map((tab) =>
          createElement(
            CodeBlockTabsTrigger,
            {
              key: tab.value,
              value: tab.value,
            },
            tab.title,
          ),
        ),
      ),
      ...tabs.map((tab) =>
        createElement(
          CodeBlockTab,
          {
            key: tab.value,
            value: tab.value,
          },
          createElement(DynamicCodeBlock, {
            lang: tab.language,
            code: tab.code,
          }),
        ),
      ),
    ],
  );
};

const renderTypeTableFromFields = (fields?: JsonRecord) => {
  if (!fields) return null;

  const rows = asArray(fields.rows)
    .map((value) => asRecord(value))
    .filter((value): value is JsonRecord => Boolean(value));

  if (rows.length === 0) return null;

  const table: Record<
    string,
    {
      default?: ReactNode;
      deprecated?: boolean;
      description?: ReactNode;
      required?: boolean;
      type: ReactNode;
    }
  > = {};

  rows.forEach((row, index) => {
    const key = asString(row.name) ?? `field-${index + 1}`;
    const type = asString(row.type);
    if (!type) return;

    const dedupedKey = table[key] ? `${key}-${index + 1}` : key;
    table[dedupedKey] = {
      type,
      description: asString(row.description),
      default: asString(row.default),
      required: asBoolean(row.required),
      deprecated: asBoolean(row.deprecated),
    };
  });

  if (Object.keys(table).length === 0) return null;

  return createElement(TypeTable, { type: table });
};

const renderInlineTocFromOptions = (options: BlockRenderOptions) => {
  const items = options.tocItems ?? [];
  if (items.length === 0) return null;
  return createElement(InlineTOC, { items });
};

const renderBannerFromFields = (fields?: JsonRecord) => {
  if (!fields) return null;

  const content = asString(fields.content);
  if (!content) return null;

  const variant = asString(fields.variant) === "rainbow" ? "rainbow" : "normal";
  const height = asString(fields.height);

  return createElement(
    Banner,
    {
      variant,
      height,
      changeLayout: asBoolean(fields.changeLayout),
    },
    content,
  );
};

const renderGithubInfoFromFields = (fields?: JsonRecord) => {
  if (!fields) return null;

  const owner = asString(fields.owner);
  const repo = asString(fields.repo);
  if (!owner || !repo) return null;

  const label = asString(fields.label) ?? `${owner}/${repo}`;
  const GithubInfoComponent = GithubInfo as unknown as ElementType;

  return createElement(GithubInfoComponent, { owner, repo }, label);
};

const renderImageZoomFromFields = (
  fields: JsonRecord | undefined,
  options: BlockRenderOptions,
) => {
  if (!fields) return null;

  const rawImage = asRecord(fields.image);
  const image = relationValueToObject(rawImage) ?? rawImage;
  if (!image) return null;

  const rawUrl = asString(image.url);
  if (!rawUrl) return null;

  const src = prefixAssetUrl(options.baseUrl, rawUrl);
  const alt = asString(fields.alt) ?? asString(image.alt) ?? "";
  const { width, height } = resolveUploadRenderDimensions({
    fieldHeight: fields.height,
    fieldWidth: fields.width,
    mediaHeight: image.height,
    mediaWidth: image.width,
  });
  const caption = asString(fields.caption);

  const imageNode = createElement(ImageZoom, {
    src,
    alt,
    width,
    height,
  });

  if (!caption) return imageNode;

  return createElement(
    "figure",
    { className: "space-y-2" },
    imageNode,
    createElement(
      "figcaption",
      { className: "text-sm text-muted-foreground" },
      caption,
    ),
  );
};

const getBlockFields = (node: SerializedLexicalNode): JsonRecord | undefined =>
  asRecord((node as { fields?: unknown }).fields) ?? undefined;

const renderBlockByType = (
  blockType: string,
  fields: JsonRecord | undefined,
  options: BlockRenderOptions,
) => {
  const normalized = blockType.trim().toLowerCase();

  if (normalized === "code") return renderCodeBlockFromFields(fields);
  if (normalized === "fumabanner") return renderBannerFromFields(fields);
  if (
    normalized === "fumacallout" ||
    normalized === "callout" ||
    normalized === "alert"
  ) {
    return renderCalloutFromFields(fields);
  }
  if (normalized === "fumacards") return renderCardsFromFields(fields);
  if (normalized === "fumaaccordions")
    return renderAccordionsFromFields(fields);
  if (normalized === "fumatabs") return renderTabsFromFields(fields);
  if (normalized === "fumasteps") return renderStepsFromFields(fields);
  if (normalized === "fumafiles") return renderFilesFromFields(fields);
  if (normalized === "fumacodetabs") return renderCodeTabsFromFields(fields);
  if (normalized === "fumatypetable") return renderTypeTableFromFields(fields);
  if (normalized === "fumainlinetoc")
    return renderInlineTocFromOptions(options);
  if (normalized === "fumagithubinfo")
    return renderGithubInfoFromFields(fields);
  if (normalized === "fumaimagezoom")
    return renderImageZoomFromFields(fields, options);

  return null;
};

const buildConverters = (options: {
  baseUrl?: string;
  components?: RichTextComponentMap;
  slugger: (value: string) => string;
  tocItems?: TOCItemType[];
}): JSXConverters => {
  const { baseUrl, components, slugger, tocItems } = options;
  const linkComponent = components?.a ?? "a";
  const tableComponent = components?.table ?? "table";
  const blockOptions: BlockRenderOptions = { baseUrl, tocItems };

  return {
    ...defaultJSXConverters,
    upload: ({ node }) => {
      const uploadNode = node as {
        fields?: {
          alt?: string;
          height?: unknown;
          width?: unknown;
        };
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
        const { width, height } = resolveUploadRenderDimensions({
          fieldHeight: uploadNode.fields?.height,
          fieldWidth: uploadNode.fields?.width,
          mediaHeight: uploadDoc.height,
          mediaWidth: uploadDoc.width,
        });
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

      const { width: fallbackWidth, height: fallbackHeight } =
        resolveUploadRenderDimensions({
          fieldHeight: uploadNode.fields?.height,
          fieldWidth: uploadNode.fields?.width,
          mediaHeight: uploadDoc.height,
          mediaWidth: uploadDoc.width,
        });
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
      Code: ({ node }) =>
        renderBlockByType("Code", getBlockFields(node), blockOptions),
      code: ({ node }) =>
        renderBlockByType("code", getBlockFields(node), blockOptions),
      fumaBanner: ({ node }) =>
        renderBlockByType("fumaBanner", getBlockFields(node), blockOptions),
      fumaCallout: ({ node }) =>
        renderBlockByType("fumaCallout", getBlockFields(node), blockOptions),
      fumaCards: ({ node }) =>
        renderBlockByType("fumaCards", getBlockFields(node), blockOptions),
      fumaAccordions: ({ node }) =>
        renderBlockByType("fumaAccordions", getBlockFields(node), blockOptions),
      fumaTabs: ({ node }) =>
        renderBlockByType("fumaTabs", getBlockFields(node), blockOptions),
      fumaSteps: ({ node }) =>
        renderBlockByType("fumaSteps", getBlockFields(node), blockOptions),
      fumaFiles: ({ node }) =>
        renderBlockByType("fumaFiles", getBlockFields(node), blockOptions),
      fumaCodeTabs: ({ node }) =>
        renderBlockByType("fumaCodeTabs", getBlockFields(node), blockOptions),
      fumaTypeTable: ({ node }) =>
        renderBlockByType("fumaTypeTable", getBlockFields(node), blockOptions),
      fumaInlineToc: ({ node }) =>
        renderBlockByType("fumaInlineToc", getBlockFields(node), blockOptions),
      fumaGithubInfo: ({ node }) =>
        renderBlockByType("fumaGithubInfo", getBlockFields(node), blockOptions),
      fumaImageZoom: ({ node }) =>
        renderBlockByType("fumaImageZoom", getBlockFields(node), blockOptions),
      Callout: ({ node }) =>
        renderBlockByType("callout", getBlockFields(node), blockOptions),
      callout: ({ node }) =>
        renderBlockByType("callout", getBlockFields(node), blockOptions),
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
    table: ({ node, nodesToJSX }) => {
      const rows = nodesToJSX({ nodes: node.children });
      return createElement(
        tableComponent,
        {},
        createElement("tbody", {}, rows),
      );
    },
    tablerow: ({ node, nodesToJSX }) =>
      createElement("tr", {}, nodesToJSX({ nodes: node.children })),
    tablecell: ({ node, nodesToJSX }) => {
      const headerState = Number(
        (node as { headerState?: number }).headerState ?? 0,
      );
      const tag = headerState > 0 ? "th" : "td";
      const colSpan = Number((node as { colSpan?: number }).colSpan ?? 1);
      const rowSpan = Number((node as { rowSpan?: number }).rowSpan ?? 1);
      const props: ComponentProps<"td"> = {};
      if (colSpan > 1) props.colSpan = colSpan;
      if (rowSpan > 1) props.rowSpan = rowSpan;

      return createElement(tag, props, nodesToJSX({ nodes: node.children }));
    },
    link: ({ node, nodesToJSX }) => {
      const children = nodesToJSX({ nodes: node.children });
      const { href: rawHref, isAsset } = resolveLinkHref(node);
      const href = isAsset ? prefixAssetUrl(baseUrl, rawHref) : rawHref;
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
      const { href: rawHref, isAsset } = resolveLinkHref(node);
      const href = isAsset ? prefixAssetUrl(baseUrl, rawHref) : rawHref;
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
        const fields = getBlockFields(node);
        const blockType = asString(fields?.blockType);

        if (blockType) {
          const rendered = renderBlockByType(blockType, fields, blockOptions);
          if (rendered) return rendered;
        }

        const code = renderCodeBlockFromFields(fields ?? undefined);
        if (code) return code;

        const callout = renderCalloutFromFields(fields ?? undefined);
        if (callout) return callout;
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
  options?: { baseUrl?: string; tocItems?: TOCItemType[] },
): ReactNode => {
  if (!isSerializedEditorState(content)) return null;
  const slugger = createSlugger();
  const converters = buildConverters({
    baseUrl: options?.baseUrl,
    components,
    slugger,
    tocItems: options?.tocItems,
  });
  return <RichText data={content} converters={converters} />;
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
