import type { SerializedLexicalNode } from "lexical";
import { Fragment, createElement, type ReactNode } from "react";

const TEXT_FORMAT_BOLD = 1;
const TEXT_FORMAT_ITALIC = 1 << 1;
const TEXT_FORMAT_STRIKETHROUGH = 1 << 2;
const TEXT_FORMAT_UNDERLINE = 1 << 3;
const TEXT_FORMAT_CODE = 1 << 4;
const TEXT_FORMAT_SUBSCRIPT = 1 << 5;
const TEXT_FORMAT_SUPERSCRIPT = 1 << 6;

const INLINE_CODE_MERGEABLE_MASK =
  TEXT_FORMAT_BOLD |
  TEXT_FORMAT_ITALIC |
  TEXT_FORMAT_STRIKETHROUGH |
  TEXT_FORMAT_UNDERLINE |
  TEXT_FORMAT_CODE;

type SerializedTextNode = SerializedLexicalNode & {
  type: "text";
  format?: unknown;
  text?: unknown;
};

const isTextNode = (node: SerializedLexicalNode): node is SerializedTextNode =>
  node.type === "text";

const getTextFormat = (node: SerializedTextNode) =>
  Number(node.format ?? 0) || 0;

const hasFormat = (node: SerializedTextNode, flag: number) =>
  (getTextFormat(node) & flag) !== 0;

const readText = (node: SerializedTextNode) =>
  typeof node.text === "string" ? node.text : "";

const renderTextNode = (
  node: SerializedTextNode,
  options: { includeCode: boolean },
): ReactNode => {
  let value: ReactNode = readText(node);

  if (hasFormat(node, TEXT_FORMAT_BOLD)) {
    value = createElement("strong", {}, value);
  }
  if (hasFormat(node, TEXT_FORMAT_ITALIC)) {
    value = createElement("em", {}, value);
  }
  if (hasFormat(node, TEXT_FORMAT_STRIKETHROUGH)) {
    value = createElement(
      "span",
      { style: { textDecoration: "line-through" } },
      value,
    );
  }
  if (hasFormat(node, TEXT_FORMAT_UNDERLINE)) {
    value = createElement(
      "span",
      { style: { textDecoration: "underline" } },
      value,
    );
  }
  if (options.includeCode && hasFormat(node, TEXT_FORMAT_CODE)) {
    value = createElement("code", {}, value);
  }
  if (hasFormat(node, TEXT_FORMAT_SUBSCRIPT)) {
    value = createElement("sub", {}, value);
  }
  if (hasFormat(node, TEXT_FORMAT_SUPERSCRIPT)) {
    value = createElement("sup", {}, value);
  }

  return value;
};

const isMergeableInlineCodeNode = (
  node: SerializedLexicalNode | undefined,
): node is SerializedTextNode => {
  if (!node || !isTextNode(node)) return false;

  const format = getTextFormat(node);
  if ((format & TEXT_FORMAT_CODE) === 0) return false;

  return (format & ~INLINE_CODE_MERGEABLE_MASK) === 0;
};

export const renderInlineTextNode = ({
  childIndex,
  node,
  siblings,
}: {
  childIndex: number;
  node: SerializedLexicalNode;
  siblings: SerializedLexicalNode[];
}): ReactNode | null => {
  if (!isTextNode(node)) return null;

  if (!isMergeableInlineCodeNode(node)) {
    return renderTextNode(node, { includeCode: true });
  }

  const previousSibling = siblings[childIndex - 1];
  if (isMergeableInlineCodeNode(previousSibling)) {
    return null;
  }

  const mergedChildren: ReactNode[] = [];

  for (let index = childIndex; index < siblings.length; index += 1) {
    const candidate = siblings[index];
    if (!isMergeableInlineCodeNode(candidate)) break;

    mergedChildren.push(
      createElement(
        Fragment,
        { key: `inline-code-${index}` },
        renderTextNode(candidate, { includeCode: false }),
      ),
    );
  }

  return createElement("code", {}, ...mergedChildren);
};
