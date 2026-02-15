import {
  RichText,
  defaultJSXConverters,
  type JSXConverters,
} from "@payloadcms/richtext-lexical/react";
import type { TOCItemType } from "fumadocs-core/toc";
import {
  createFileSystemGeneratorCache,
  createGenerator,
} from "fumadocs-typescript";
import { AutoTypeTable } from "fumadocs-typescript/ui";
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
import { existsSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import type { ComponentProps, ElementType, ReactNode } from "react";
import { createElement } from "react";

import { FeedbackBlock } from "@/components/feedback-github/client";
import type {
  BlockFeedback,
  FeedbackAction,
} from "@/components/feedback-github/schema";
import { ServiceIcon } from "@/components/service-icons";
import {
  createFeedbackBlockBody,
  createFeedbackBlockId,
} from "@/lib/feedback-block";
import { renderInlineTextNode } from "@/lib/richtext-inline-code";
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

const asJsonRecord = (value: unknown): JsonRecord | undefined =>
  asRecord(value) ?? undefined;

const assignIfDefined = (target: JsonRecord, key: string, value: unknown) => {
  if (value !== undefined) {
    target[key] = value;
  }
};

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

const parseStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(isDefined);
  }
  return parseLines(value);
};

const resolveDocsAppDir = () => {
  const cwd = process.cwd();
  const nestedDocsDir = resolve(cwd, "apps", "docs");
  if (existsSync(nestedDocsDir)) return nestedDocsDir;
  return cwd;
};

const DOCS_APP_DIR = resolveDocsAppDir();
const DOCS_TSCONFIG_PATH = resolve(DOCS_APP_DIR, "tsconfig.json");
const DOCS_SOURCE_BASE_PATH = existsSync(DOCS_TSCONFIG_PATH)
  ? dirname(DOCS_TSCONFIG_PATH)
  : DOCS_APP_DIR;
const DEFAULT_AUTO_TYPE_TABLE_CACHE_DIR = resolve(
  DOCS_APP_DIR,
  ".next",
  "fumadocs-typescript",
);
const autoTypeTableGenerators = new Map<
  string,
  ReturnType<typeof createGenerator>
>();

const resolveDocsPath = (pathValue: string, fallbackRoot: string) =>
  isAbsolute(pathValue) ? pathValue : resolve(fallbackRoot, pathValue);

const resolveOptionalDocsPath = (
  value: unknown,
  fallbackRoot: string,
): string | undefined => {
  const pathValue = asString(value)?.trim();
  if (!pathValue) return undefined;
  return resolveDocsPath(pathValue, fallbackRoot);
};

const getAutoTypeTableGenerator = (fields?: JsonRecord) => {
  const tsconfigPath =
    resolveOptionalDocsPath(
      fields?.generatorTsconfigPath,
      DOCS_SOURCE_BASE_PATH,
    ) ?? DOCS_TSCONFIG_PATH;
  const disableCache = asBoolean(fields?.disableGeneratorCache) ?? false;
  const cacheDir = disableCache
    ? undefined
    : (resolveOptionalDocsPath(
        fields?.generatorCacheDir,
        DOCS_SOURCE_BASE_PATH,
      ) ?? DEFAULT_AUTO_TYPE_TABLE_CACHE_DIR);
  const cacheKey = `${tsconfigPath}::${disableCache ? "no-cache" : cacheDir}`;
  const cached = autoTypeTableGenerators.get(cacheKey);
  if (cached) return cached;

  const generator = createGenerator({
    tsconfigPath,
    cache:
      disableCache || !cacheDir
        ? false
        : createFileSystemGeneratorCache(cacheDir),
  });
  autoTypeTableGenerators.set(cacheKey, generator);
  return generator;
};

const resolveAutoTypeTableOptions = (fields?: JsonRecord) => {
  const optionOverrides = asJsonRecord(fields?.options) ?? {};
  const rawBasePath = asString(fields?.basePath);
  const basePath =
    rawBasePath && rawBasePath.trim().length > 0
      ? isAbsolute(rawBasePath)
        ? rawBasePath
        : resolve(DOCS_SOURCE_BASE_PATH, rawBasePath)
      : DOCS_SOURCE_BASE_PATH;

  const options: JsonRecord = {
    ...optionOverrides,
    basePath,
  };
  const allowInternal = asBoolean(fields?.allowInternal);
  if (allowInternal !== undefined) {
    options.allowInternal = allowInternal;
  }
  return options;
};

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
const resolveIconNode = (
  value: unknown,
  baseUrl?: string,
): ReactNode | undefined => {
  const textIcon = asString(value);
  if (textIcon) return textIcon;

  const iconRecord = asRecord(value);
  if (!iconRecord) return undefined;

  const source = asString(iconRecord.source);
  const lucide = asString(iconRecord.lucide);

  if (source !== "custom" && lucide) {
    return createElement(ServiceIcon, {
      icon: { type: "lucide", name: lucide },
      size: 16,
    });
  }

  const customSvg =
    relationValueToObject(iconRecord.customSvg) ??
    asRecord(iconRecord.customSvg);
  const customUrl = asString(customSvg?.url);
  if (customUrl) {
    const icon: { type: "custom"; url: string; alt?: string } = {
      type: "custom",
      url: prefixAssetUrl(baseUrl, customUrl),
    };
    const alt = asString(customSvg?.alt);
    if (alt) {
      icon.alt = alt;
    }

    return createElement(ServiceIcon, {
      icon,
      size: 16,
    });
  }

  if (lucide) {
    return createElement(ServiceIcon, {
      icon: { type: "lucide", name: lucide },
      size: 16,
    });
  }

  return undefined;
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
  return text ?? null;
};

const renderCodeBlockFromFields = (fields?: JsonRecord) => {
  if (!fields) return null;
  const code = asString(fields.code);
  if (!code) return null;
  const language = asString(fields.language) ?? asString(fields.lang) ?? "text";
  const title = asString(fields.title);
  const codeblockProps = asJsonRecord(fields.codeblock) ?? {};
  const options = asJsonRecord(fields.options);
  const wrapInSuspense = asBoolean(fields.wrapInSuspense);

  if (title && asString(codeblockProps.title) === undefined) {
    codeblockProps.title = title;
  }

  const dynamicCodeProps: JsonRecord = {
    lang: language,
    code,
  };
  if (Object.keys(codeblockProps).length > 0) {
    dynamicCodeProps.codeblock = codeblockProps as ComponentProps<
      typeof DynamicCodeBlock
    >["codeblock"];
  }
  assignIfDefined(dynamicCodeProps, "options", options);
  assignIfDefined(dynamicCodeProps, "wrapInSuspense", wrapInSuspense);

  return createElement(
    DynamicCodeBlock,
    dynamicCodeProps as unknown as ComponentProps<typeof DynamicCodeBlock>,
  );
};

const renderCalloutFromFields = (
  fields?: JsonRecord,
  options?: BlockRenderOptions,
) => {
  if (!fields) return null;
  const calloutProps = asJsonRecord(fields.props) ?? {};
  const title = asString(fields.title) ?? asString(calloutProps.title);
  const type = asString(fields.type) ?? asString(calloutProps.type);
  const content = asString(fields.content) ?? asString(fields.body);
  const icon = resolveIconNode(fields.icon, options?.baseUrl);

  if (!title && !content) return null;

  const resolvedType =
    type === "warn" ||
    type === "warning" ||
    type === "error" ||
    type === "success" ||
    type === "idea"
      ? type
      : "info";

  const props: JsonRecord = { ...calloutProps };
  assignIfDefined(props, "title", title);
  props.type = resolvedType;
  if (icon) {
    props.icon = icon;
  }

  return createElement(
    Callout,
    props as unknown as ComponentProps<typeof Callout>,
    renderTextBlock(content),
  );
};

const renderCardsFromFields = (
  fields?: JsonRecord,
  options?: BlockRenderOptions,
) => {
  if (!fields) return null;
  const cardsProps = asJsonRecord(fields.props) ?? {};
  const cards = asArray(fields.cards)
    .map((value) => asRecord(value))
    .filter((value): value is JsonRecord => Boolean(value))
    .map((card, index) => {
      const cardProps = asJsonRecord(card.props) ?? {};
      const title = asString(card.title) ?? asString(cardProps.title);
      if (!title) return null;
      const description =
        asString(card.description) ?? asString(cardProps.description);
      const href = asString(card.href) ?? asString(cardProps.href);
      const external =
        asBoolean(card.external) ?? asBoolean(cardProps.external);
      const icon = resolveIconNode(card.icon, options?.baseUrl);

      const resolvedCardProps: JsonRecord = { ...cardProps };
      resolvedCardProps.key = `${title}-${index}`;
      resolvedCardProps.title = title;
      assignIfDefined(resolvedCardProps, "description", description);
      assignIfDefined(resolvedCardProps, "href", href);
      assignIfDefined(resolvedCardProps, "external", external?.toString());
      if (icon) {
        resolvedCardProps.icon = icon;
      }

      return createElement(
        Card,
        resolvedCardProps as unknown as ComponentProps<typeof Card>,
      );
    })
    .filter(isDefined);

  if (cards.length === 0) return null;
  return createElement(
    Cards,
    cardsProps as unknown as ComponentProps<typeof Cards>,
    cards,
  );
};

const renderTabsFromFields = (fields?: JsonRecord) => {
  if (!fields) return null;
  const tabsProps = asJsonRecord(fields.props) ?? {};

  const tabs = asArray(fields.tabs)
    .map((value) => asRecord(value))
    .filter((value): value is JsonRecord => Boolean(value))
    .map((tab, index) => {
      const content = asString(tab.content);
      if (!content) return null;
      const tabProps = asJsonRecord(tab.props) ?? {};

      return {
        key: `tab-${index + 1}`,
        title: asString(tab.title) ?? `Tab ${index + 1}`,
        value: asString(tab.value),
        content,
        props: tabProps,
      };
    })
    .filter(isDefined);

  if (tabs.length === 0) return null;

  const defaultIndex = Math.max(
    0,
    asNumber(fields.defaultIndex) ?? asNumber(tabsProps.defaultIndex) ?? 0,
  );
  const label = asString(fields.label) ?? asString(tabsProps.label);
  const resolvedTabsProps: JsonRecord = { ...tabsProps };
  resolvedTabsProps.items = tabs.map((tab) => tab.title);
  resolvedTabsProps.defaultIndex = defaultIndex;
  assignIfDefined(resolvedTabsProps, "label", label);

  return createElement(
    Tabs,
    resolvedTabsProps as unknown as ComponentProps<typeof Tabs>,
    tabs.map((tab) => {
      const resolvedTabProps: JsonRecord = { ...tab.props };
      resolvedTabProps.key = tab.key;
      assignIfDefined(resolvedTabProps, "value", tab.value);
      return createElement(
        Tab,
        resolvedTabProps as unknown as ComponentProps<typeof Tab>,
        renderTextBlock(tab.content),
      );
    }),
  );
};

const renderAccordionsFromFields = (fields?: JsonRecord) => {
  if (!fields) return null;
  const accordionsProps = asJsonRecord(fields.props) ?? {};

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
        id: asString(item.id),
        content,
        props: asJsonRecord(item.props) ?? {},
      };
    })
    .filter(isDefined);

  if (items.length === 0) return null;

  const accordionType =
    (asString(fields.type) ?? asString(accordionsProps.type)) === "multiple"
      ? "multiple"
      : "single";
  const defaultValues = parseCsv(fields.defaultOpenValues);
  const resolvedAccordionsProps: JsonRecord = { ...accordionsProps };

  if (accordionType === "multiple") {
    resolvedAccordionsProps.type = "multiple";
    if (defaultValues.length > 0) {
      resolvedAccordionsProps.defaultValue = defaultValues;
    }
  } else {
    resolvedAccordionsProps.type = "single";
    if (resolvedAccordionsProps.collapsible === undefined) {
      resolvedAccordionsProps.collapsible = true;
    }
    assignIfDefined(resolvedAccordionsProps, "defaultValue", defaultValues[0]);
  }

  return createElement(
    Accordions,
    resolvedAccordionsProps as unknown as ComponentProps<typeof Accordions>,
    items.map((item, index) => {
      const resolvedAccordionProps: JsonRecord = { ...item.props };
      resolvedAccordionProps.key = `${item.value}-${index}`;
      resolvedAccordionProps.title = item.title;
      resolvedAccordionProps.value = item.value;
      assignIfDefined(resolvedAccordionProps, "id", item.id);
      return createElement(
        Accordion,
        resolvedAccordionProps as unknown as ComponentProps<typeof Accordion>,
        renderTextBlock(item.content),
      );
    }),
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
          {step.title ? `${step.title}\n${step.content}` : step.content}
        </Step>
      ))}
    </Steps>
  );
};

const renderFilesFromFields = (
  fields?: JsonRecord,
  options?: BlockRenderOptions,
) => {
  if (!fields) return null;
  const filesProps = asJsonRecord(fields.props) ?? {};

  const entries = asArray(fields.entries)
    .map((value) => asRecord(value))
    .filter((value): value is JsonRecord => Boolean(value))
    .map((entry, index) => {
      const kind = asString(entry.kind) ?? "file";
      const name = asString(entry.name);
      if (!name) return null;
      const entryProps = asJsonRecord(entry.props) ?? {};

      if (kind === "folder") {
        const childEntries = asArray(entry.childrenEntries)
          .map((value) => asRecord(value))
          .filter((value): value is JsonRecord => Boolean(value))
          .map((child, childIndex) => {
            const childName = asString(child.name);
            if (!childName) return null;
            const childProps = asJsonRecord(child.props) ?? {};
            const childIcon = resolveIconNode(child.icon, options?.baseUrl);
            const resolvedChildProps: JsonRecord = { ...childProps };
            resolvedChildProps.key = `${childName}-${childIndex}`;
            resolvedChildProps.name = childName;
            if (childIcon) {
              resolvedChildProps.icon = childIcon;
            }
            return createElement(
              File,
              resolvedChildProps as unknown as ComponentProps<typeof File>,
            );
          })
          .filter(isDefined);
        const fallbackChildren = parseLines(entry.children).map(
          (child, childIndex) =>
            createElement(File, { key: `${child}-${childIndex}`, name: child }),
        );
        const childrenNodes =
          childEntries.length > 0 ? childEntries : fallbackChildren;
        const resolvedFolderProps: JsonRecord = { ...entryProps };
        resolvedFolderProps.key = `${name}-${index}`;
        resolvedFolderProps.name = name;
        assignIfDefined(
          resolvedFolderProps,
          "defaultOpen",
          asBoolean(entry.defaultOpen),
        );
        assignIfDefined(
          resolvedFolderProps,
          "disabled",
          asBoolean(entry.disabled),
        );

        return createElement(
          Folder,
          resolvedFolderProps as unknown as ComponentProps<typeof Folder>,
          childrenNodes,
        );
      }

      const icon = resolveIconNode(entry.icon, options?.baseUrl);
      const resolvedFileProps: JsonRecord = { ...entryProps };
      resolvedFileProps.key = `${name}-${index}`;
      resolvedFileProps.name = name;
      if (icon) {
        resolvedFileProps.icon = icon;
      }

      return createElement(
        File,
        resolvedFileProps as unknown as ComponentProps<typeof File>,
      );
    })
    .filter(isDefined);

  if (entries.length === 0) return null;

  return createElement(
    Files,
    filesProps as unknown as ComponentProps<typeof Files>,
    entries,
  );
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
  const codeTabsProps = asJsonRecord(fields.props) ?? {};
  const codeTabsListProps = asJsonRecord(fields.tabsListProps) ?? {};

  const tabs = asArray(fields.tabs)
    .map((value) => asRecord(value))
    .filter((value): value is JsonRecord => Boolean(value))
    .map((tab, index) => {
      const title = asString(tab.title) ?? `Tab ${index + 1}`;
      const language = asString(tab.language) ?? "text";
      const code = asString(tab.code);
      if (!code) return null;
      const value = asString(tab.value) ?? toCodeTabValue(title, index);
      const codeblock = asJsonRecord(tab.codeblock) ?? {};
      if (asString(codeblock.title) === undefined) {
        codeblock.title = title;
      }
      return {
        code,
        codeblock,
        language,
        options: asJsonRecord(tab.options),
        title,
        tabProps: asJsonRecord(tab.tabProps) ?? {},
        triggerProps: asJsonRecord(tab.triggerProps) ?? {},
        value,
        wrapInSuspense: asBoolean(tab.wrapInSuspense),
      };
    })
    .filter(isDefined);

  if (tabs.length === 0) return null;

  const defaultValue =
    asString(fields.defaultValue) ??
    asString(codeTabsProps.defaultValue) ??
    tabs[0]?.value;
  const resolvedCodeTabsProps: JsonRecord = { ...codeTabsProps };
  assignIfDefined(resolvedCodeTabsProps, "defaultValue", defaultValue);

  return createElement(
    CodeBlockTabs,
    resolvedCodeTabsProps as unknown as ComponentProps<typeof CodeBlockTabs>,
    [
      createElement(
        CodeBlockTabsList,
        {
          key: "list",
          ...(codeTabsListProps as unknown as ComponentProps<
            typeof CodeBlockTabsList
          >),
        },
        tabs.map((tab) =>
          createElement(
            CodeBlockTabsTrigger,
            {
              key: `trigger-${tab.value}`,
              ...(tab.triggerProps as unknown as ComponentProps<
                typeof CodeBlockTabsTrigger
              >),
              value: tab.value,
            },
            tab.title,
          ),
        ),
      ),
      ...tabs.map((tab) => {
        const dynamicCodeProps: JsonRecord = {
          lang: tab.language,
          code: tab.code,
          codeblock: tab.codeblock as ComponentProps<
            typeof DynamicCodeBlock
          >["codeblock"],
        };
        assignIfDefined(dynamicCodeProps, "options", tab.options);
        assignIfDefined(dynamicCodeProps, "wrapInSuspense", tab.wrapInSuspense);
        const resolvedTabProps: JsonRecord = { ...tab.tabProps };
        resolvedTabProps.key = `tab-${tab.value}`;
        resolvedTabProps.value = tab.value;

        return createElement(
          CodeBlockTab,
          resolvedTabProps as unknown as ComponentProps<typeof CodeBlockTab>,
          createElement(
            DynamicCodeBlock,
            dynamicCodeProps as unknown as ComponentProps<
              typeof DynamicCodeBlock
            >,
          ),
        );
      }),
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
      parameters?: Array<{
        description: ReactNode;
        name: string;
      }>;
      required?: boolean;
      returns?: ReactNode;
      type: ReactNode;
      typeDescription?: ReactNode;
      typeDescriptionLink?: string;
    }
  > = {};

  rows.forEach((row, index) => {
    const key = asString(row.name) ?? `field-${index + 1}`;
    const type = asString(row.type);
    if (!type) return;

    const dedupedKey = table[key] ? `${key}-${index + 1}` : key;
    const parameters = asArray(row.parameters)
      .map((value) => asRecord(value))
      .filter((value): value is JsonRecord => Boolean(value))
      .map((parameter) => {
        const name = asString(parameter.name);
        const description = asString(parameter.description);
        if (!name || !description) return null;
        return { name, description };
      })
      .filter(isDefined);
    table[dedupedKey] = {
      type,
      description: asString(row.description),
      typeDescription: asString(row.typeDescription),
      typeDescriptionLink: asString(row.typeDescriptionLink),
      default: asString(row.default),
      required: asBoolean(row.required),
      deprecated: asBoolean(row.deprecated),
      parameters: parameters.length > 0 ? parameters : undefined,
      returns: asString(row.returns),
    };
  });

  if (Object.keys(table).length === 0) return null;

  return createElement(TypeTable, { type: table });
};

const renderAutoTypeTableFromFields = (fields?: JsonRecord) => {
  if (!fields) return null;

  const path = asString(fields.path);
  const name = asString(fields.name);
  const type = asString(fields.type);

  if (!path && !type) return null;

  const props: JsonRecord = {
    ...(asJsonRecord(fields.props) ?? {}),
    generator: getAutoTypeTableGenerator(fields),
    options: resolveAutoTypeTableOptions(fields),
  };
  if (path) {
    props.path = path;
  }
  if (name) {
    props.name = name;
  }
  if (type) {
    props.type = type;
  }
  const shiki = asJsonRecord(fields.shiki);
  if (shiki) {
    props.shiki = shiki;
  }

  const AutoTypeTableComponent = AutoTypeTable as unknown as ElementType;
  return createElement(
    AutoTypeTableComponent,
    props as unknown as ComponentProps<typeof AutoTypeTable>,
  );
};

const renderInlineTocFromFields = (
  fields: JsonRecord | undefined,
  options: BlockRenderOptions,
) => {
  const items = options.tocItems ?? [];
  if (items.length === 0) return null;
  const tocProps = asJsonRecord(fields?.props) ?? {};
  const label = asString(fields?.label);
  return createElement(
    InlineTOC,
    {
      ...(tocProps as unknown as ComponentProps<typeof InlineTOC>),
      items,
    },
    label,
  );
};

const renderBannerFromFields = (fields?: JsonRecord) => {
  if (!fields) return null;

  const content = asString(fields.content);
  if (!content) return null;

  const bannerProps = asJsonRecord(fields.props) ?? {};
  const variant =
    (asString(fields.variant) ?? asString(bannerProps.variant)) === "rainbow"
      ? "rainbow"
      : "normal";
  const height = asString(fields.height) ?? asString(bannerProps.height);
  const changeLayout =
    asBoolean(fields.changeLayout) ?? asBoolean(bannerProps.changeLayout);
  const id = asString(fields.id) ?? asString(bannerProps.id);
  const rainbowColors = parseStringArray(
    fields.rainbowColors ?? bannerProps.rainbowColors,
  );
  const resolvedBannerProps: JsonRecord = { ...bannerProps };
  resolvedBannerProps.variant = variant;
  assignIfDefined(resolvedBannerProps, "height", height + "px");
  assignIfDefined(resolvedBannerProps, "changeLayout", changeLayout);
  assignIfDefined(resolvedBannerProps, "id", id);
  if (rainbowColors.length > 0) {
    resolvedBannerProps.rainbowColors = rainbowColors;
  }

  return createElement(
    Banner,
    resolvedBannerProps as unknown as ComponentProps<typeof Banner>,
    content,
  );
};

const renderGithubInfoFromFields = (fields?: JsonRecord) => {
  if (!fields) return null;

  const githubProps = asJsonRecord(fields.props) ?? {};
  const owner = asString(fields.owner) ?? asString(githubProps.owner);
  const repo = asString(fields.repo) ?? asString(githubProps.repo);
  if (!owner || !repo) return null;

  const label = asString(fields.label) ?? `${owner}/${repo}`;
  const token = asString(fields.token) ?? asString(githubProps.token);
  const baseUrl = asString(fields.baseUrl) ?? asString(githubProps.baseUrl);
  const resolvedGithubProps: JsonRecord = { ...githubProps, owner, repo };
  assignIfDefined(resolvedGithubProps, "token", token);
  assignIfDefined(resolvedGithubProps, "baseUrl", baseUrl);
  const GithubInfoComponent = GithubInfo as unknown as ElementType;

  return createElement(GithubInfoComponent, resolvedGithubProps, label);
};

const renderImageZoomFromFields = (
  fields: JsonRecord | undefined,
  options: BlockRenderOptions,
) => {
  if (!fields) return null;
  const imageZoomProps = asJsonRecord(fields.props) ?? {};

  const rawImage = asRecord(fields.image);
  const image = relationValueToObject(rawImage) ?? rawImage;
  if (!image && asString(imageZoomProps.src) === undefined) return null;

  const rawUrl = asString(image?.url) ?? asString(imageZoomProps.src);
  if (!rawUrl) return null;

  const src = prefixAssetUrl(options.baseUrl, rawUrl);
  const alt =
    asString(fields.alt) ??
    asString(imageZoomProps.alt) ??
    asString(image?.alt) ??
    "";
  const resolvedDimensions = resolveUploadRenderDimensions({
    fieldHeight: fields.height,
    fieldWidth: fields.width,
    mediaHeight: image?.height,
    mediaWidth: image?.width,
  });
  const width = asNumber(imageZoomProps.width) ?? resolvedDimensions.width;
  const height = asNumber(imageZoomProps.height) ?? resolvedDimensions.height;
  const sizes = asString(fields.sizes) ?? asString(imageZoomProps.sizes);
  const priority =
    asBoolean(fields.priority) ?? asBoolean(imageZoomProps.priority);
  const zoomInProps = asJsonRecord(fields.zoomInProps);
  const rmiz = asJsonRecord(fields.rmiz);
  const resolvedImageZoomProps: JsonRecord = { ...imageZoomProps };
  resolvedImageZoomProps.src = src;
  resolvedImageZoomProps.alt = alt;
  assignIfDefined(resolvedImageZoomProps, "width", width);
  assignIfDefined(resolvedImageZoomProps, "height", height);
  assignIfDefined(resolvedImageZoomProps, "sizes", sizes);
  assignIfDefined(resolvedImageZoomProps, "priority", priority);
  assignIfDefined(resolvedImageZoomProps, "zoomInProps", zoomInProps);
  assignIfDefined(resolvedImageZoomProps, "rmiz", rmiz);

  const imageNode = createElement(ImageZoom, {
    ...(resolvedImageZoomProps as unknown as ComponentProps<typeof ImageZoom>),
  });
  return imageNode;
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
    return renderCalloutFromFields(fields, options);
  }
  if (normalized === "fumacards") return renderCardsFromFields(fields, options);
  if (normalized === "fumaaccordions")
    return renderAccordionsFromFields(fields);
  if (normalized === "fumatabs") return renderTabsFromFields(fields);
  if (normalized === "fumasteps") return renderStepsFromFields(fields);
  if (normalized === "fumafiles") return renderFilesFromFields(fields, options);
  if (normalized === "fumacodetabs") return renderCodeTabsFromFields(fields);
  if (normalized === "fumatypetable") return renderTypeTableFromFields(fields);
  if (normalized === "fumaautotypetable")
    return renderAutoTypeTableFromFields(fields);
  if (normalized === "fumainlinetoc")
    return renderInlineTocFromFields(fields, options);
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
  onBlockFeedbackAction?: FeedbackAction<BlockFeedback>;
}): JSXConverters => {
  const { baseUrl, components, slugger, tocItems, onBlockFeedbackAction } =
    options;
  const linkComponent = components?.a ?? "a";
  const tableComponent = components?.table ?? "table";
  const paragraphComponent = components?.p ?? "p";
  const blockOptions: BlockRenderOptions = { baseUrl, tocItems };
  let feedbackBlockOrder = 0;

  return {
    ...defaultJSXConverters,
    text: ({ childIndex, node, parent }) =>
      renderInlineTextNode({
        childIndex,
        node,
        siblings: getChildren(parent),
      }),
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
      fumaAutoTypeTable: ({ node }) =>
        renderBlockByType(
          "fumaAutoTypeTable",
          getBlockFields(node),
          blockOptions,
        ),
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
    paragraph: ({ node, nodesToJSX }) => {
      const children = nodesToJSX({ nodes: node.children });
      const paragraphNode = createElement(paragraphComponent, {}, children);

      if (!onBlockFeedbackAction) {
        return paragraphNode;
      }

      const blockBody = createFeedbackBlockBody(collectText(node));
      if (!blockBody) {
        return paragraphNode;
      }

      feedbackBlockOrder += 1;
      const blockId = createFeedbackBlockId(blockBody, feedbackBlockOrder);

      return createElement(
        FeedbackBlock,
        {
          id: blockId,
          body: blockBody,
          onSendAction: onBlockFeedbackAction,
        },
        paragraphNode,
      );
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

        const callout = renderCalloutFromFields(
          fields ?? undefined,
          blockOptions,
        );
        if (callout) return callout;
      }

      if ("children" in node && Array.isArray(node.children)) {
        return nodesToJSX({ nodes: node.children });
      }

      return null;
    },
  };
};

export const renderRichText = (
  content: unknown,
  components?: RichTextComponentMap,
  options?: {
    baseUrl?: string;
    tocItems?: TOCItemType[];
    onBlockFeedbackAction?: FeedbackAction<BlockFeedback>;
  },
): ReactNode => {
  if (!isSerializedEditorState(content)) return null;
  const slugger = createSlugger();
  const converters = buildConverters({
    baseUrl: options?.baseUrl,
    components,
    slugger,
    tocItems: options?.tocItems,
    onBlockFeedbackAction: options?.onBlockFeedbackAction,
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
