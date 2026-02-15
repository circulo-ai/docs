type SelectionEventDetails = {
  nativeEvent?: {
    type?: string;
  };
  event?: {
    type?: string;
  };
};

const encodeSlugPath = (slug: string): string =>
  slug
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");

export const buildServiceHref = (serviceSlug: string): string =>
  `/${serviceSlug}`;

export const buildServiceLatestHref = (
  serviceSlug: string,
  defaultPageSlug?: string,
): string => {
  const encodedSlugPath = defaultPageSlug
    ? encodeSlugPath(defaultPageSlug)
    : "";
  if (!encodedSlugPath) {
    return buildServiceHref(serviceSlug);
  }
  return `/${serviceSlug}/${encodedSlugPath}`;
};

export const buildVersionHref = (
  serviceSlug: string,
  version: string,
): string => `/${serviceSlug}/v${version}`;

const normalizePathname = (pathname: string): string => {
  const path = pathname.trim().split("?")[0]?.split("#")[0] ?? "";
  if (!path || path === "/") {
    return "/";
  }

  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  return withLeadingSlash.replace(/\/+$/, "");
};

export const isSamePathname = (
  currentPathname: string,
  targetPathname: string,
): boolean =>
  normalizePathname(currentPathname) === normalizePathname(targetPathname);

export const isKeyboardSelectionEvent = (
  eventDetails?: SelectionEventDetails,
): boolean => {
  const eventType =
    eventDetails?.nativeEvent?.type ?? eventDetails?.event?.type;
  return eventType?.startsWith("key") ?? false;
};
