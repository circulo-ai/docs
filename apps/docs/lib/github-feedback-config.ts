import { readEnv, readMultilineEnv } from "@repo/env";

export type GithubFeedbackConfig = {
  owner: string;
  repo: string;
  category: string;
  appId: string;
  privateKey: string;
};

export const normalizeMultilineSecret = (value: string) =>
  value.replace(/\\n/g, "\n").trim();

export const readGithubFeedbackConfig = (
  env: Record<string, string | undefined> = process.env,
): GithubFeedbackConfig | null => {
  const envOptions = {
    env,
    load: env === process.env,
  };

  const owner = readEnv("DOCS_FEEDBACK_GITHUB_OWNER", envOptions);
  const repo = readEnv("DOCS_FEEDBACK_GITHUB_REPO", envOptions);
  const category =
    readEnv("DOCS_FEEDBACK_GITHUB_CATEGORY", envOptions) || "Docs Feedback";
  const appId = readEnv("GITHUB_APP_ID", envOptions);
  const privateKey = readMultilineEnv("GITHUB_APP_PRIVATE_KEY", envOptions);

  if (!owner || !repo || !appId || !privateKey) {
    return null;
  }

  return {
    owner,
    repo,
    category,
    appId,
    privateKey,
  };
};
