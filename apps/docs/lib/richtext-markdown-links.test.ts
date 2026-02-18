import { describe, expect, it } from "vitest";

import { richTextToMarkdown } from "@/lib/richtext-markdown";

const createLinkContent = (docValue: Record<string, unknown>) => ({
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
        children: [
          {
            type: "link",
            format: "",
            indent: 0,
            version: 1,
            children: [
              {
                type: "text",
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: "Read more",
                version: 1,
              },
            ],
            fields: {
              linkType: "internal",
              doc: {
                relationTo: "docPages",
                value: docValue,
              },
            },
          },
        ],
      },
    ],
  },
});

describe("rich text markdown link resolution", () => {
  it("prefers current version for doc page links", () => {
    const markdown = richTextToMarkdown(
      createLinkContent({
        slug: "guides/intro",
        service: {
          slug: "billing",
        },
      }),
      {
        currentServiceSlug: "billing",
        currentVersion: "1.2.3",
      },
    );

    expect(markdown).toContain("[Read more](/billing/v1.2.3/guides/intro)");
  });

  it("keeps current versioned path even when target might not exist there", () => {
    const markdown = richTextToMarkdown(
      createLinkContent({
        slug: "guides/removed-in-v1",
        service: {
          slug: "billing",
        },
        version: {
          version: "9.9.9",
        },
      }),
      {
        currentServiceSlug: "billing",
        currentVersion: "1.2.3",
      },
    );

    expect(markdown).toContain(
      "[Read more](/billing/v1.2.3/guides/removed-in-v1)",
    );
    expect(markdown).not.toContain(
      "[Read more](/billing/guides/removed-in-v1)",
    );
    expect(markdown).not.toContain(
      "[Read more](/billing/v9.9.9/guides/removed-in-v1)",
    );
  });

  it("falls back to service alias route when current version is missing", () => {
    const markdown = richTextToMarkdown(
      createLinkContent({
        slug: "guides/intro",
        service: {
          slug: "billing",
        },
      }),
      {
        currentServiceSlug: "billing",
      },
    );

    expect(markdown).toContain("[Read more](/billing/guides/intro)");
  });
});
