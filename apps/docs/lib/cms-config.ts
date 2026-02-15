import { readBooleanEnv, readEnv } from "@repo/env";

type CmsConfig = {
  baseUrl: string;
  includeDrafts: boolean;
  auth?: {
    email: string;
    password: string;
  };
};

export const getCmsConfig = (): CmsConfig => {
  const baseUrl = readEnv("DOCS_CMS_URL", {
    defaultValue: "http://localhost:3000",
  });
  const includeDrafts = readBooleanEnv("DOCS_INCLUDE_DRAFTS");
  const email = readEnv("DOCS_EMAIL");
  const password = readEnv("DOCS_PASSWORD");
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
