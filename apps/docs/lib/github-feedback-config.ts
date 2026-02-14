export type GithubFeedbackConfig = {
  owner: string;
  repo: string;
  category: string;
  appId: string;
  privateKey: string;
};

const stripWrappingQuotes = (value: string) => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
};

const normalizeEnvValue = (value: string | undefined) => {
  if (typeof value !== "string") return "";
  return stripWrappingQuotes(value).trim();
};

export const normalizeMultilineSecret = (value: string) =>
  stripWrappingQuotes(value).replace(/\\n/g, "\n").trim();

export const readGithubFeedbackConfig = (
  env: Record<string, string | undefined> = process.env,
): GithubFeedbackConfig | null => {
  const owner = normalizeEnvValue(env.DOCS_FEEDBACK_GITHUB_OWNER);
  const repo = normalizeEnvValue(env.DOCS_FEEDBACK_GITHUB_REPO);
  const category =
    normalizeEnvValue(env.DOCS_FEEDBACK_GITHUB_CATEGORY) || "Docs Feedback";
  const appId = normalizeEnvValue(env.GITHUB_APP_ID);
  const rawPrivateKey = normalizeEnvValue(env.GITHUB_APP_PRIVATE_KEY);

  if (!owner || !repo || !appId || !rawPrivateKey) {
    return null;
  }

  return {
    owner,
    repo,
    category,
    appId,
    privateKey: normalizeMultilineSecret(rawPrivateKey),
  };
};
