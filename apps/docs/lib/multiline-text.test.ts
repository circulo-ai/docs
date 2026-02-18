import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { renderMultilineText } from "@/lib/multiline-text";

describe("renderMultilineText", () => {
  it("preserves empty lines", () => {
    const html = renderToStaticMarkup(
      createElement("div", {}, renderMultilineText("Line one\n\nLine three")),
    );

    expect(html).toBe("<div>Line one<br/><br/>Line three</div>");
  });

  it("normalizes CRLF newlines", () => {
    const html = renderToStaticMarkup(
      createElement("div", {}, renderMultilineText("A\r\n\r\nB")),
    );

    expect(html).toBe("<div>A<br/><br/>B</div>");
  });
});
