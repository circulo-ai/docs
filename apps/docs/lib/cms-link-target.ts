export const CMS_LINK_TARGETS = ["_self", "_blank", "_parent", "_top"] as const;

export type CmsLinkTarget = (typeof CMS_LINK_TARGETS)[number];

const CMS_LINK_TARGET_SET = new Set<CmsLinkTarget>(CMS_LINK_TARGETS);

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value.trim() : undefined;

export const resolveCmsLinkTarget = (
  value: unknown,
): CmsLinkTarget | undefined => {
  const rawTarget = asString(value);
  if (!rawTarget) return undefined;
  if (!CMS_LINK_TARGET_SET.has(rawTarget as CmsLinkTarget)) return undefined;
  return rawTarget as CmsLinkTarget;
};

export const resolveCmsLinkTargetWithFallback = (
  value: unknown,
  openInNewTabFallback: unknown,
): CmsLinkTarget | undefined => {
  const target = resolveCmsLinkTarget(value);
  if (target) return target;
  return openInNewTabFallback === true ? "_blank" : undefined;
};

export const resolveCmsLinkRel = (target: CmsLinkTarget | undefined) =>
  target === "_blank" ? "noopener noreferrer" : undefined;
