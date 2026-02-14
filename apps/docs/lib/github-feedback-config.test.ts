import { describe, expect, it } from "vitest";

import {
  normalizeMultilineSecret,
  readGithubFeedbackConfig,
} from "@/lib/github-feedback-config";

describe("github feedback config", () => {
  it("normalizes escaped newlines in private keys", () => {
    const raw = "line-1\\nline-2\\nline-3";
    expect(normalizeMultilineSecret(raw)).toBe("line-1\nline-2\nline-3");
  });

  it("returns null when required vars are missing", () => {
    const config = readGithubFeedbackConfig({
      DOCS_FEEDBACK_GITHUB_OWNER: "acme",
      DOCS_FEEDBACK_GITHUB_REPO: "docs",
    });
    expect(config).toBeNull();
  });

  it("reads and trims a full config", () => {
    const config = readGithubFeedbackConfig({
      DOCS_FEEDBACK_GITHUB_OWNER: " acme ",
      DOCS_FEEDBACK_GITHUB_REPO: " docs ",
      DOCS_FEEDBACK_GITHUB_CATEGORY: " Docs Feedback ",
      GITHUB_APP_ID: "123",
      GITHUB_APP_PRIVATE_KEY:
        "-----BEGIN PRIVATE KEY-----\\nkey\\n-----END PRIVATE KEY-----",
    });

    expect(config).toEqual({
      owner: "acme",
      repo: "docs",
      category: "Docs Feedback",
      appId: "123",
      privateKey: "-----BEGIN PRIVATE KEY-----\nkey\n-----END PRIVATE KEY-----",
    });
  });
});
