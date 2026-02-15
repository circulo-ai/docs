import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requiredEnv = {
  DOCS_FEEDBACK_GITHUB_OWNER: "acme",
  DOCS_FEEDBACK_GITHUB_REPO: "docs",
  GITHUB_APP_ID: "123",
  GITHUB_APP_PRIVATE_KEY:
    "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----",
};

const requiredKeys = Object.keys(requiredEnv) as Array<
  keyof typeof requiredEnv
>;
const originalEnv = new Map<string, string | undefined>(
  requiredKeys.map((key) => [key, process.env[key]]),
);

const restoreRequiredEnv = () => {
  for (const key of requiredKeys) {
    const original = originalEnv.get(key);
    if (typeof original === "string") {
      process.env[key] = original;
    } else {
      delete process.env[key];
    }
  }
};

describe("github feedback env loading", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.assign(process.env, requiredEnv);
  });

  afterEach(() => {
    restoreRequiredEnv();
  });

  it("reads config from process env", async () => {
    const { readGithubFeedbackConfig } =
      await import("@/lib/github-feedback-config");

    expect(readGithubFeedbackConfig()).toEqual({
      owner: "acme",
      repo: "docs",
      category: "Docs Feedback",
      appId: "123",
      privateKey: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----",
    });
  });
});
