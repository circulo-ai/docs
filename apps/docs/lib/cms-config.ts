type CmsConfig = {
  baseUrl: string;
  includeDrafts: boolean;
  auth?: {
    email: string;
    password: string;
  };
};

const stripWrappingQuotes = (value: string | undefined) => {
  if (!value) return undefined;
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
};

export const getCmsConfig = (): CmsConfig => {
  const baseUrl =
    stripWrappingQuotes(process.env.DOCS_CMS_URL) ?? "http://localhost:3000";
  const includeDrafts = process.env.DOCS_INCLUDE_DRAFTS === "true";
  const email = stripWrappingQuotes(process.env.DOCS_EMAIL);
  const password = stripWrappingQuotes(process.env.DOCS_PASSWORD);
  const auth =
    email && password
      ? {
          email,
          password,
        }
      : undefined;
  return { baseUrl, includeDrafts, auth };
};

export type { CmsConfig };
