import { describe, expect, it } from "vitest";

import { richTextToMarkdown } from "@/lib/richtext-markdown";

const createParagraphContent = (children: Record<string, unknown>[]) => ({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    children: [
      {
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        children,
      },
    ],
  },
});

describe("rich text markdown paragraph rendering", () => {
  it("preserves intentional empty lines in paragraph output", () => {
    const markdown = richTextToMarkdown(
      createParagraphContent([
        {
          type: "text",
          detail: 0,
          format: 0,
          mode: "normal",
          style: "",
          text: "Line one",
          version: 1,
        },
        {
          type: "linebreak",
          version: 1,
        },
        {
          type: "linebreak",
          version: 1,
        },
        {
          type: "text",
          detail: 0,
          format: 0,
          mode: "normal",
          style: "",
          text: "Line three",
          version: 1,
        },
      ]),
    );

    expect(markdown).toBe("Line one\n\nLine three");
  });
});
