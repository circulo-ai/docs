import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { renderInlineTextNode } from "@/lib/richtext-inline-code";

const createTextNode = (text: string, format = 0) => ({
  detail: 0,
  format,
  mode: "normal",
  style: "",
  text,
  type: "text",
  version: 1,
});

describe("renderInlineTextNode", () => {
  it("merges adjacent inline code nodes when nested styles change", () => {
    const siblings = [
      createTextNode("console.", 16),
      createTextNode("log()", 16 | 1),
    ];

    const nodes = siblings
      .map((node, childIndex) =>
        renderInlineTextNode({
          childIndex,
          node,
          siblings,
        }),
      )
      .filter((node) => node !== null);

    const html = renderToStaticMarkup(createElement("p", {}, ...nodes));

    expect(html).toContain("<code>console.<strong>log()</strong></code>");
    expect(html.match(/<code>/g)).toHaveLength(1);
  });
});
