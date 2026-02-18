import type { SerializedEditorState, SerializedLexicalNode } from "lexical";

type JsonRecord = Record<string, unknown>;

type MarkdownOptions = {
  baseUrl?: string;
  currentServiceSlug?: string;
  currentVersion?: string;
};

const TEXT_FORMAT_BOLD = 1;
const TEXT_FORMAT_ITALIC = 1 << 1;
const TEXT_FORMAT_STRIKETHROUGH = 1 << 2;
const TEXT_FORMAT_UNDERLINE = 1 << 3;
const TEXT_FORMAT_CODE = 1 << 4;

const asRecord = (value: unknown): JsonRecord | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as JsonRecord;
};

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" ? value : undefined;

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const ensureString = (value: unknown) =>
  typeof value === "string" ? value : "";

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

const prefixAssetUrl = (baseUrl: string | undefined, url: string) => {
  if (!baseUrl) return url;
  if (!url.startsWith("/")) return url;
  return `${normalizeBaseUrl(baseUrl)}${url}`;
};

const normalizeSlugSegments = (value: string) =>
  value
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

const encodeSlugPath = (value: string) =>
  normalizeSlugSegments(value).map(encodeURIComponent).join("/");

const relationValueToObject = (value: unknown): JsonRecord | null => {
  const record = asRecord(value);
  if (!record) return null;
  const nested = asRecord(record.value);
  return nested ?? record;
};

const getChildren = (node: SerializedLexicalNode): SerializedLexicalNode[] => {
  const children = (node as { children?: SerializedLexicalNode[] }).children;
  return Array.isArray(children) ? children : [];
};

const isSerializedEditorState = (
  value: unknown,
): value is SerializedEditorState => {
  if (!value || typeof value !== "object") return false;
  return "root" in value;
};

const readFieldText = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(readFieldText).filter(Boolean).join("\n");
  }

  const record = asRecord(value);
  if (!record) return "";

  return Object.values(record).map(readFieldText).filter(Boolean).join("\n");
};

const INLINE_ESCAPE_CHARS = new Set(["\\", "`", "*", "_", "~", "[", "]"]);

const escapeInlineMarkdown = (value: string) =>
  Array.from(value)
    .map((char) => (INLINE_ESCAPE_CHARS.has(char) ? `\\${char}` : char))
    .join("");

const collectText = (node: SerializedLexicalNode): string => {
  if (node.type === "text") {
    const value = (node as { text?: unknown }).text;
    return typeof value === "string" ? value : "";
  }

  return getChildren(node).map(collectText).join("");
};

const resolveInternalLinkHref = (
  fields: JsonRecord,
  options: MarkdownOptions,
) => {
  const docField = asRecord(fields.doc);
  const relationTo = asString(docField?.relationTo) ?? "";
  const value = relationValueToObject(docField?.value ?? docField);

  if (relationTo === "docPages" && value) {
    const pageSlug = asString(value.slug);
    const service = relationValueToObject(value.service);
    const version = relationValueToObject(value.version);
    const serviceSlug = asString(service?.slug) ?? options.currentServiceSlug;
    const versionSemver =
      options.currentVersion ?? asString(version?.version) ?? undefined;

    if (serviceSlug && versionSemver && pageSlug) {
      return {
        href: `/${encodeURIComponent(serviceSlug)}/v${versionSemver}/${encodeSlugPath(pageSlug)}`,
        isAsset: false,
      };
    }

    if (serviceSlug && pageSlug) {
      return {
        href: `/${encodeURIComponent(serviceSlug)}/${encodeSlugPath(pageSlug)}`,
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

const resolveLinkHref = (
  node: SerializedLexicalNode,
  options: MarkdownOptions,
): string => {
  const fields = asRecord((node as { fields?: unknown }).fields);
  if (!fields) return "";

  const resolved =
    fields.linkType === "internal"
      ? resolveInternalLinkHref(fields, options)
      : {
          href: asString(fields.url) ?? "",
          isAsset: false,
        };

  if (resolved.isAsset) {
    return prefixAssetUrl(options.baseUrl, resolved.href);
  }

  return resolved.href;
};

const applyTextFormatting = (
  rawText: string,
  node: SerializedLexicalNode,
): string => {
  const text = rawText.replace(/\r/g, "");
  if (text.length === 0) return "";

  const format = Number((node as { format?: unknown }).format ?? 0);
  const escaped = escapeInlineMarkdown(text);
  const asCode = (format & TEXT_FORMAT_CODE) !== 0;

  let result = asCode ? `\`${escaped}\`` : escaped;

  if ((format & TEXT_FORMAT_BOLD) !== 0) {
    result = `**${result}**`;
  }
  if ((format & TEXT_FORMAT_ITALIC) !== 0) {
    result = `_${result}_`;
  }
  if ((format & TEXT_FORMAT_STRIKETHROUGH) !== 0) {
    result = `~~${result}~~`;
  }
  if ((format & TEXT_FORMAT_UNDERLINE) !== 0) {
    result = `<u>${result}</u>`;
  }

  return result;
};

const renderInlineNode = (
  node: SerializedLexicalNode,
  options: MarkdownOptions,
): string => {
  if (node.type === "text") {
    const value = (node as { text?: unknown }).text;
    return applyTextFormatting(ensureString(value), node);
  }

  if (node.type === "linebreak") {
    return "  \n";
  }

  if (node.type === "tab") {
    return "\t";
  }

  if (node.type === "link" || node.type === "autolink") {
    const label = renderInlineNodes(getChildren(node), options).trim();
    const href = resolveLinkHref(node, options);
    if (!href) return label;
    const escapedHref = href.replace(/\)/g, "\\)");
    return `[${label || escapedHref}](${escapedHref})`;
  }

  return renderInlineNodes(getChildren(node), options);
};

const renderInlineNodes = (
  nodes: SerializedLexicalNode[],
  options: MarkdownOptions,
): string => nodes.map((node) => renderInlineNode(node, options)).join("");

const renderTable = (
  node: SerializedLexicalNode,
  options: MarkdownOptions,
): string => {
  const rows = getChildren(node)
    .filter((row) => row.type === "tablerow")
    .map((row) =>
      getChildren(row)
        .filter((cell) => cell.type === "tablecell")
        .map((cell) =>
          renderInlineNodes(getChildren(cell), options)
            .replace(/\|/g, "\\|")
            .replace(/\n+/g, " ")
            .trim(),
        ),
    )
    .filter((row) => row.length > 0);

  if (rows.length === 0) return "";

  const width = Math.max(...rows.map((row) => row.length));
  const normalizeRow = (row: string[]) => {
    const result = [...row];
    while (result.length < width) {
      result.push("");
    }
    return result;
  };

  const header = normalizeRow(rows[0] ?? []);
  const separator = Array.from({ length: width }, () => "---");
  const body = rows.slice(1).map(normalizeRow);

  return [
    `| ${header.join(" | ")} |`,
    `| ${separator.join(" | ")} |`,
    ...body.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
};

const renderUploadNode = (
  node: SerializedLexicalNode,
  options: MarkdownOptions,
): string => {
  const uploadNode = node as {
    value?: unknown;
    fields?: {
      alt?: unknown;
    };
  };

  const value = asRecord(uploadNode.value);
  if (!value) return "";

  const rawUrl = asString(value.url);
  if (!rawUrl) return "";

  const url = prefixAssetUrl(options.baseUrl, rawUrl);
  const alt =
    asString(uploadNode.fields?.alt) ??
    asString(value.alt) ??
    "Documentation Image";
  const mimeType = asString(value.mimeType) ?? "";
  const filename = asString(value.filename) ?? alt;

  if (mimeType.startsWith("image")) {
    return `![${escapeInlineMarkdown(alt)}](${url})`;
  }

  return `[${escapeInlineMarkdown(filename)}](${url})`;
};

const renderCodeFence = (language: string, code: string, title?: string) => {
  const cleanLanguage = language.trim() || "text";
  const cleanCode = code.replace(/\r\n/g, "\n").trimEnd();
  const lines: string[] = [];

  if (title && title.trim().length > 0) {
    lines.push(`<!-- ${title.trim()} -->`);
  }

  lines.push("```" + cleanLanguage);
  lines.push(cleanCode);
  lines.push("```");

  return lines.join("\n");
};

const renderCustomBlock = (
  node: SerializedLexicalNode,
  options: MarkdownOptions,
): string => {
  const fields = asRecord((node as { fields?: unknown }).fields);
  if (!fields) return "";

  const blockType = (asString(fields.blockType) ?? "").toLowerCase();

  if (blockType === "code") {
    const code = asString(fields.code);
    if (!code) return "";
    const language =
      asString(fields.language) ?? asString(fields.lang) ?? "text";
    const title = asString(fields.title);
    return renderCodeFence(language, code, title);
  }

  if (
    blockType === "fumacallout" ||
    blockType === "callout" ||
    blockType === "alert"
  ) {
    const title = asString(fields.title);
    const content = asString(fields.content) ?? asString(fields.body);
    const type = (asString(fields.type) ?? "info").toUpperCase();
    const lines: string[] = [];

    if (title) {
      lines.push(`> [!${type}] ${title}`);
    }

    if (content) {
      for (const line of content.split(/\r?\n/g)) {
        lines.push(`> ${line}`);
      }
    }

    return lines.join("\n");
  }

  if (blockType === "fumabanner") {
    const content = asString(fields.content);
    return content ? `> ${content}` : "";
  }

  if (blockType === "fumatabs") {
    const tabs = asArray(fields.tabs)
      .map((value) => asRecord(value))
      .filter((value): value is JsonRecord => Boolean(value));

    const sections = tabs
      .map((tab, index) => {
        const title = asString(tab.title) ?? `Tab ${index + 1}`;
        const content = asString(tab.content) ?? readFieldText(tab);
        if (!content.trim()) return "";
        return `#### ${title}\n\n${content.trim()}`;
      })
      .filter(Boolean);

    return sections.join("\n\n");
  }

  if (blockType === "fumacodetabs") {
    const tabs = asArray(fields.tabs)
      .map((value) => asRecord(value))
      .filter((value): value is JsonRecord => Boolean(value));

    const sections = tabs
      .map((tab, index) => {
        const title = asString(tab.title) ?? `Tab ${index + 1}`;
        const code = asString(tab.code);
        if (!code) return "";
        const language = asString(tab.language) ?? "text";
        return `#### ${title}\n\n${renderCodeFence(language, code)}`;
      })
      .filter(Boolean);

    return sections.join("\n\n");
  }

  if (blockType === "fumasteps") {
    const steps = asArray(fields.steps)
      .map((value) => asRecord(value))
      .filter((value): value is JsonRecord => Boolean(value));

    const lines = steps
      .map((step, index) => {
        const title = asString(step.title);
        const content = asString(step.content) ?? readFieldText(step);
        if (!content.trim()) return "";
        return `${index + 1}. ${title ? `${title}: ` : ""}${content.trim()}`;
      })
      .filter(Boolean);

    return lines.join("\n");
  }

  if (blockType === "fumacards") {
    const cards = asArray(fields.cards)
      .map((value) => asRecord(value))
      .filter((value): value is JsonRecord => Boolean(value));

    const lines = cards
      .map((card) => {
        const title = asString(card.title);
        if (!title) return "";
        const description = asString(card.description);
        const href = asString(card.href);
        if (href) {
          return `- [${title}](${href})${description ? ` - ${description}` : ""}`;
        }

        return `- ${title}${description ? ` - ${description}` : ""}`;
      })
      .filter(Boolean);

    return lines.join("\n");
  }

  if (blockType === "fumatypetable") {
    const rows = asArray(fields.rows)
      .map((value) => asRecord(value))
      .filter((value): value is JsonRecord => Boolean(value));

    if (rows.length === 0) return "";

    const lines: string[] = [
      "| Name | Type | Description |",
      "| --- | --- | --- |",
    ];

    rows.forEach((row, index) => {
      const name = asString(row.name) ?? `Field ${index + 1}`;
      const type = asString(row.type) ?? "-";
      const description = asString(row.description) ?? "";
      lines.push(
        `| ${name} | ${type} | ${description.replace(/\|/g, "\\|")} |`,
      );
    });

    return lines.join("\n");
  }

  if (blockType === "fumaimagezoom") {
    const image = relationValueToObject(fields.image) ?? asRecord(fields.image);
    const rawUrl = asString(image?.url);
    if (!rawUrl) return "";

    const url = prefixAssetUrl(options.baseUrl, rawUrl);
    const alt =
      asString(fields.alt) ?? asString(image?.alt) ?? "Documentation Image";

    return `![${escapeInlineMarkdown(alt)}](${url})`;
  }

  if (blockType === "fumagithubinfo") {
    const owner = asString(fields.owner);
    const repo = asString(fields.repo);
    if (!owner || !repo) return "";
    const label = asString(fields.label) ?? `${owner}/${repo}`;
    return `[${label}](https://github.com/${owner}/${repo})`;
  }

  if (blockType === "fumainlinetoc") {
    return "[Table of contents is available in the rendered documentation view.]";
  }

  if (blockType === "fumafiles" || blockType === "fumaaccordions") {
    const fallback = readFieldText(fields).trim();
    return fallback;
  }

  return readFieldText(fields).trim();
};

const getHeadingDepth = (node: SerializedLexicalNode): number => {
  const level = asNumber((node as { level?: unknown }).level);
  if (typeof level === "number" && level >= 1 && level <= 6) return level;

  const tag = asString((node as { tag?: unknown }).tag);
  if (tag) {
    const match = tag.match(/^h([1-6])$/i);
    if (match) return Number(match[1]);
  }

  return 2;
};

const normalizeParagraph = (value: string): string =>
  value.replace(/\n{3,}/g, "\n\n").trim();

const renderListItem = (
  node: SerializedLexicalNode,
  options: MarkdownOptions,
  depth: number,
  ordered: boolean,
  index: number,
): string => {
  const indent = "  ".repeat(depth);
  const bullet = ordered ? `${index + 1}.` : "-";
  const children = getChildren(node);

  const childContent: string[] = [];
  const nestedLists: string[] = [];

  children.forEach((child) => {
    if (child.type === "list") {
      const renderedNested = renderBlockNode(child, options, depth + 1);
      if (renderedNested) nestedLists.push(renderedNested);
      return;
    }

    const rendered = renderBlockNode(child, options, depth + 1);
    if (rendered) {
      childContent.push(rendered);
    }
  });

  const flattened = childContent.join("\n").replace(/\n+/g, " ").trim();

  const fallback = collectText(node).replace(/\s+/g, " ").trim();
  const line = `${indent}${bullet} ${flattened || fallback}`.trimEnd();

  return [line, ...nestedLists].filter(Boolean).join("\n");
};

const renderBlockNode = (
  node: SerializedLexicalNode,
  options: MarkdownOptions,
  depth = 0,
): string => {
  if (node.type === "heading") {
    const heading = renderInlineNodes(getChildren(node), options).trim();
    if (!heading) return "";
    return `${"#".repeat(getHeadingDepth(node))} ${heading}`;
  }

  if (node.type === "paragraph") {
    const paragraph = normalizeParagraph(
      renderInlineNodes(getChildren(node), options),
    );
    return paragraph;
  }

  if (node.type === "quote") {
    const quoteBody = renderBlockNodes(getChildren(node), options, depth)
      .split("\n")
      .map((line) => (line.trim().length > 0 ? `> ${line}` : ">"))
      .join("\n");

    return quoteBody;
  }

  if (node.type === "list") {
    const ordered =
      (asString((node as { listType?: unknown }).listType) ?? "") === "number";

    const lines = getChildren(node)
      .filter((child) => child.type === "listitem")
      .map((child, index) =>
        renderListItem(child, options, depth, ordered, index),
      )
      .filter(Boolean);

    return lines.join("\n");
  }

  if (node.type === "listitem") {
    return renderListItem(node, options, depth, false, 0);
  }

  if (node.type === "code") {
    const language =
      asString((node as { language?: unknown }).language) ?? "text";
    const text = collectText(node);
    if (!text.trim()) return "";
    return renderCodeFence(language, text);
  }

  if (node.type === "horizontalrule") {
    return "---";
  }

  if (node.type === "upload") {
    return renderUploadNode(node, options);
  }

  if (node.type === "table") {
    return renderTable(node, options);
  }

  if (node.type === "block") {
    return renderCustomBlock(node, options);
  }

  if (node.type === "linebreak") {
    return "";
  }

  const children = getChildren(node);
  if (children.length === 0) {
    const asText = collectText(node).trim();
    return asText;
  }

  const blockChildren = renderBlockNodes(children, options, depth).trim();
  if (blockChildren.length > 0) return blockChildren;

  return normalizeParagraph(renderInlineNodes(children, options));
};

const renderBlockNodes = (
  nodes: SerializedLexicalNode[],
  options: MarkdownOptions,
  depth = 0,
): string =>
  nodes
    .map((node) => renderBlockNode(node, options, depth))
    .map((block) => block.trim())
    .filter(Boolean)
    .join("\n\n");

export const richTextToMarkdown = (
  content: unknown,
  options: MarkdownOptions = {},
): string => {
  if (!isSerializedEditorState(content)) return "";

  const root = (content as SerializedEditorState).root;
  const nodes = Array.isArray(root?.children) ? root.children : [];
  return renderBlockNodes(nodes, options).trim();
};

export const richTextHasContent = (content: unknown): boolean => {
  if (!isSerializedEditorState(content)) return false;

  const root = (content as SerializedEditorState).root;
  const nodes = Array.isArray(root?.children) ? root.children : [];
  return nodes.some((node) => {
    if (node.type === "paragraph") {
      return collectText(node).trim().length > 0;
    }

    if (node.type === "block") {
      const fields = asRecord((node as { fields?: unknown }).fields);
      return Boolean(fields && readFieldText(fields).trim().length > 0);
    }

    if (node.type === "upload") {
      const value = asRecord((node as { value?: unknown }).value);
      return Boolean(asString(value?.url));
    }

    if (node.type === "linebreak") return false;
    return true;
  });
};
