"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import type {
  ServiceVersionOptions,
  VersionOption,
} from "@/lib/service-version-types";

const VERSION_SEGMENT_REGEX =
  /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

type ParsedPath = {
  service?: string;
  version?: string;
};

const parseDocsPath = (pathname: string): ParsedPath => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "docs") return {};

  const service = segments[1];
  if (!service) return {};

  const versionSegment = segments[2];
  if (versionSegment && VERSION_SEGMENT_REGEX.test(versionSegment)) {
    return {
      service,
      version: versionSegment.slice(1),
    };
  }

  return { service };
};

const resolveVersionValue = (
  versions: VersionOption[],
  currentVersion?: string,
) => {
  if (!versions.length) return "";

  const latestVersion = versions[0]?.version ?? "";
  if (!currentVersion) return latestVersion;

  const exists = versions.some((version) => version.version === currentVersion);
  return exists ? currentVersion : latestVersion;
};

export function ServiceVersionSwitcher({
  services,
  versionsByService,
}: ServiceVersionOptions) {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  const { service: currentService, version: currentVersion } = useMemo(
    () => parseDocsPath(pathname),
    [pathname],
  );

  const serviceValue =
    currentService &&
    services.some((service) => service.slug === currentService)
      ? currentService
      : "";
  const versions = serviceValue ? (versionsByService[serviceValue] ?? []) : [];
  const versionValue = resolveVersionValue(versions, currentVersion);

  if (services.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <label className="sr-only" htmlFor="service-select">
        Service
      </label>
      <select
        id="service-select"
        className="h-8 max-w-38 rounded-md border border-fd-border bg-fd-background px-2 text-xs text-fd-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring/50"
        value={serviceValue}
        onChange={(event) => {
          const nextService = event.target.value;
          if (!nextService) return;
          router.push(`/docs/${nextService}`);
        }}
      >
        <option value="" disabled>
          Service
        </option>
        {services.map((service) => (
          <option key={service.slug} value={service.slug}>
            {service.name}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="version-select">
        Version
      </label>
      <select
        id="version-select"
        className="h-8 max-w-34 rounded-md border border-fd-border bg-fd-background px-2 text-xs text-fd-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
        value={versionValue}
        disabled={!serviceValue || versions.length === 0}
        onChange={(event) => {
          const nextVersion = event.target.value;
          if (!nextVersion || !serviceValue) return;
          router.push(`/docs/${serviceValue}/v${nextVersion}`);
        }}
      >
        {!serviceValue || versions.length === 0 ? (
          <option value="">Version</option>
        ) : null}
        {versions.map((version) => (
          <option key={version.version} value={version.version}>
            v{version.version}
          </option>
        ))}
      </select>
    </div>
  );
}
