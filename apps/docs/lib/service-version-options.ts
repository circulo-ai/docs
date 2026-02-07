import "server-only";

import { getServices, getVersions } from "@repo/docs-source";
import { cache } from "react";

import { getCmsConfig } from "@/lib/cms-config";
import type {
  ServiceIconValue,
  ServiceOption,
  ServiceVersionOptions,
  VersionOption,
} from "@/lib/service-version-types";

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, "");

const prefixAssetUrl = (baseUrl: string, url: string) => {
  if (!url.startsWith("/")) return url;
  return `${normalizeBaseUrl(baseUrl)}${url}`;
};

const resolveServiceIcon = (
  icon: unknown,
  baseUrl: string,
): ServiceIconValue | undefined => {
  if (!icon) return undefined;

  if (typeof icon === "string") {
    return { type: "lucide", name: icon };
  }

  if (typeof icon !== "object") return undefined;

  const iconRecord = icon as Record<string, unknown>;
  const source =
    typeof iconRecord.source === "string" ? iconRecord.source : undefined;

  if (source === "custom") {
    const customSvg = iconRecord.customSvg as
      | Record<string, unknown>
      | undefined;
    const url =
      customSvg && typeof customSvg.url === "string"
        ? prefixAssetUrl(baseUrl, customSvg.url)
        : undefined;
    const alt =
      customSvg && typeof customSvg.alt === "string"
        ? customSvg.alt
        : undefined;
    if (url) {
      return { type: "custom", url, alt };
    }
    return undefined;
  }

  const lucide =
    typeof iconRecord.lucide === "string"
      ? iconRecord.lucide
      : typeof iconRecord.icon === "string"
        ? iconRecord.icon
        : undefined;

  if (lucide) {
    return { type: "lucide", name: lucide };
  }

  return undefined;
};

const toServiceOption = (
  service: {
    slug: string;
    name: string;
    description?: string;
    icon?: unknown;
    theme?: {
      primaryColor?: string;
    };
  },
  baseUrl: string,
): ServiceOption => ({
  slug: service.slug,
  name: service.name,
  description: service.description,
  icon: resolveServiceIcon(service.icon, baseUrl),
  primaryColor: service.theme?.primaryColor,
});

const toVersionOption = (version: {
  version: string;
  isPrerelease?: boolean;
  status?: "draft" | "published";
}): VersionOption => ({
  version: version.version,
  isPrerelease: version.isPrerelease,
  status: version.status,
});

export const getServiceVersionOptions = cache(
  async (): Promise<ServiceVersionOptions> => {
    const config = getCmsConfig();
    const services = await getServices(config, { depth: 1, limit: 200 });

    const versionsByService: Record<string, VersionOption[]> = {};
    await Promise.all(
      services.map(async (service) => {
        const versions = await getVersions(config, service.slug, {
          limit: 200,
        });
        versionsByService[service.slug] = versions.map(toVersionOption);
      }),
    );

    return {
      services: services.map((service) =>
        toServiceOption(service, config.baseUrl),
      ),
      versionsByService,
    };
  },
);
