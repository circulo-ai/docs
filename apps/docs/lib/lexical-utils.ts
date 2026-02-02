export type LexicalNode = {
  type?: string;
  children?: LexicalNode[];
  text?: string;
  tag?: string;
  level?: number;
  format?: number;
  [key: string]: unknown;
};

export type LexicalDocument = {
  root?: LexicalNode;
  [key: string]: unknown;
};

export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const isNode = (value: unknown): value is LexicalNode =>
  isObject(value) &&
  ("type" in value || "children" in value || "text" in value);

export const getChildren = (node: LexicalNode): LexicalNode[] =>
  Array.isArray(node.children) ? node.children.filter(isNode) : [];

export const getHeadingDepth = (node: LexicalNode): number | null => {
  if (node.type !== "heading") return null;
  if (typeof node.level === "number") return node.level;
  if (typeof node.tag === "string") {
    const match = node.tag.match(/^h([1-6])$/i);
    if (match) return Number(match[1]);
  }
  return null;
};

export const collectText = (node: LexicalNode): string => {
  if (node.type === "text" && typeof node.text === "string") {
    return node.text;
  }
  return getChildren(node).map(collectText).join("");
};

export const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const createSlugger = () => {
  const counts = new Map<string, number>();
  return (value: string) => {
    const base = slugify(value) || "section";
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    if (count === 0) return base;
    return `${base}-${count + 1}`;
  };
};
