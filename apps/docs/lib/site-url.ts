import { readEnv } from "@repo/env";

const DEFAULT_DOCS_SITE_URL = "http://localhost:3001";

const toOrigin = (value: string | undefined) => {
  if (!value) return undefined;

  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
};

export const resolveSiteUrl = (fallback = DEFAULT_DOCS_SITE_URL) =>
  toOrigin(readEnv("DOCS_SITE_URL")) ??
  toOrigin(fallback) ??
  DEFAULT_DOCS_SITE_URL;
