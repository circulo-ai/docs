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

export const extractToc = (content: unknown): TOCItemType[] => {
  if (!isObject(content)) return [];
  const rootValue = (content as LexicalDocument).root;
  if (!isNode(rootValue)) return [];

  const toc: TOCItemType[] = [];
  const slugger = createSlugger();

  const walk = (node: LexicalNode) => {
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

  walk(rootValue);
  return toc;
};
