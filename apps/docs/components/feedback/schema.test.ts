import { describe, expect, it } from "vitest";

import {
  actionResponse,
  blockFeedback,
  pageFeedback,
} from "@/components/feedback/schema";

describe("feedback schema", () => {
  it("accepts path and absolute urls for page feedback", () => {
    expect(
      pageFeedback.parse({
        url: "/docs/getting-started?tab=api#install",
        opinion: "helpful",
        message: "Great guide.",
      }),
    ).toEqual({
      url: "/docs/getting-started?tab=api#install",
      opinion: "helpful",
      message: "Great guide.",
    });

    expect(
      pageFeedback.parse({
        url: "https://docs.example.com/getting-started",
        opinion: "not_helpful",
        message: "Missing examples.",
      }),
    ).toEqual({
      url: "https://docs.example.com/getting-started",
      opinion: "not_helpful",
      message: "Missing examples.",
    });
  });

  it("rejects invalid page feedback url and invalid opinion", () => {
    expect(() =>
      pageFeedback.parse({
        url: "docs/getting-started",
        opinion: "helpful",
        message: "",
      }),
    ).toThrow();

    expect(() =>
      pageFeedback.parse({
        url: "/docs/getting-started",
        opinion: "good",
        message: "",
      }),
    ).toThrow();
  });

  it("enforces message and size constraints", () => {
    expect(() =>
      pageFeedback.parse({
        url: "/docs/getting-started",
        opinion: "helpful",
        message: "x".repeat(4001),
      }),
    ).toThrow();

    expect(() =>
      blockFeedback.parse({
        url: "/docs/getting-started",
        blockId: "fb-1",
        message: " ",
      }),
    ).toThrow();

    expect(() =>
      blockFeedback.parse({
        url: "/docs/getting-started",
        blockId: "fb-1",
        blockBody: "x".repeat(513),
        message: "Needs edits",
      }),
    ).toThrow();
  });

  it("accepts optional github url in action response", () => {
    expect(actionResponse.parse({})).toEqual({});
    expect(
      actionResponse.parse({
        githubUrl: "https://github.com/acme/docs/discussions/1",
      }),
    ).toEqual({
      githubUrl: "https://github.com/acme/docs/discussions/1",
    });
  });
});
