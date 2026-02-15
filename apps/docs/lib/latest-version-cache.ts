import { getLatestVersion } from "@repo/docs-source";
import { unstable_cache } from "next/cache";

import { getCmsConfig } from "@/lib/cms-config";

export const LATEST_VERSION_CACHE_TAG = "docs:latest-version";

const LATEST_VERSION_CACHE_KEY = "docs-latest-version";

const normalizeServiceSlug = (service: string) => service.trim().toLowerCase();

export const getLatestVersionServiceTag = (service: string) =>
  `${LATEST_VERSION_CACHE_TAG}:${normalizeServiceSlug(service)}`;

export const getLatestVersionCached = async (service: string) => {
  const normalizedService = normalizeServiceSlug(service);
  const config = getCmsConfig();

  return unstable_cache(
    async () => getLatestVersion(config, normalizedService),
    [
      LATEST_VERSION_CACHE_KEY,
      config.baseUrl,
      String(config.includeDrafts),
      normalizedService,
    ],
    {
      revalidate: false,
      tags: [
        LATEST_VERSION_CACHE_TAG,
        getLatestVersionServiceTag(normalizedService),
      ],
    },
  )();
};
