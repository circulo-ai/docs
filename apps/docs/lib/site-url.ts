const DEFAULT_DOCS_SITE_URL = "http://localhost:3001";

const stripWrappingQuotes = (value: string) => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
};

const toOrigin = (value: string | undefined) => {
  if (!value) return undefined;
  const normalized = stripWrappingQuotes(value.trim());
  if (!normalized) return undefined;

  try {
    return new URL(normalized).origin;
  } catch {
    return undefined;
  }
};

export const resolveSiteUrl = (fallback = DEFAULT_DOCS_SITE_URL) =>
  toOrigin(process.env.DOCS_SITE_URL) ??
  toOrigin(fallback) ??
  DEFAULT_DOCS_SITE_URL;
