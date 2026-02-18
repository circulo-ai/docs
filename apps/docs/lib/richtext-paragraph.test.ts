import { describe, expect, it } from "vitest";

import { isParagraphVisuallyEmpty } from "@/lib/richtext-paragraph";

type Node = Record<string, unknown>;

const textNode = (text: string): Node => ({
  type: "text",
  detail: 0,
  format: 0,
  mode: "normal",
  style: "",
  text,
  version: 1,
});

const linebreakNode = (): Node => ({
  type: "linebreak",
  version: 1,
});

describe("isParagraphVisuallyEmpty", () => {
  it("treats empty paragraphs as visually empty", () => {
    expect(isParagraphVisuallyEmpty([] as never)).toBe(true);
    expect(isParagraphVisuallyEmpty([linebreakNode()] as never)).toBe(true);
    expect(isParagraphVisuallyEmpty([textNode("")] as never)).toBe(true);
    expect(isParagraphVisuallyEmpty([textNode("   ")] as never)).toBe(true);
  });

  it("treats real text paragraphs as non-empty", () => {
    expect(isParagraphVisuallyEmpty([textNode("Hello")] as never)).toBe(false);
  });
});
