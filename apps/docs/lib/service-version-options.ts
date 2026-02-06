import "server-only";

import { getServices, getVersions } from "@repo/docs-source";
import { cache } from "react";

import { getCmsConfig } from "@/lib/cms-config";
import type {
  ServiceOption,
  ServiceVersionOptions,
  VersionOption,
} from "@/lib/service-version-types";

const toServiceOption = (service: {
  slug: string;
  name: string;
  theme?: {
    primaryColor?: string;
  };
}): ServiceOption => ({
  slug: service.slug,
  name: service.name,
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
    const services = await getServices(config, { depth: 0, limit: 200 });

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
      services: services.map(toServiceOption),
      versionsByService,
    };
  },
);
