type CmsConfig = {
  baseUrl: string;
  includeDrafts: boolean;
  auth?: {
    email: string;
    password: string;
  };
};

export const getCmsConfig = (): CmsConfig => {
  const baseUrl = process.env.DOCS_CMS_URL ?? "http://localhost:3000";
  const includeDrafts = process.env.DOCS_INCLUDE_DRAFTS === "true";
  const email = process.env.DOCS_EMAIL;
  const password = process.env.DOCS_PASSWORD;
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
