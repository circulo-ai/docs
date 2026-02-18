import type { SerializedLexicalNode } from "lexical";

const getChildren = (node: SerializedLexicalNode): SerializedLexicalNode[] => {
  const children = (node as { children?: SerializedLexicalNode[] }).children;
  return Array.isArray(children) ? children : [];
};

const isBlankTextNode = (node: SerializedLexicalNode) => {
  if (node.type !== "text") return false;
  const text = (node as { text?: unknown }).text;
  return typeof text !== "string" || text.trim().length === 0;
};

const isEmptyInlineNode = (node: SerializedLexicalNode): boolean => {
  if (node.type === "linebreak") return true;
  if (isBlankTextNode(node)) return true;

  const children = getChildren(node);
  if (children.length === 0) return false;
  return children.every(isEmptyInlineNode);
};

export const isParagraphVisuallyEmpty = (children: SerializedLexicalNode[]) => {
  if (children.length === 0) return true;
  return children.every(isEmptyInlineNode);
};
