"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <div className="flex flex-col gap-3">
      <Select
        value={serviceValue}
        onValueChange={(nextService) => {
          if (!nextService) return;
          router.push(`/docs/${nextService}`);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Service" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Services</SelectLabel>
            {services.map((service) => (
              <SelectItem key={service.slug} value={service.slug}>
                {service.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={`v${versionValue}`}
        disabled={!serviceValue || versions.length === 0}
        onValueChange={(nextVersion) => {
          if (!nextVersion || !serviceValue) return;
          router.push(`/docs/${serviceValue}/v${nextVersion}`);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Version" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Versions</SelectLabel>
            {versions.map((version) => (
              <SelectItem key={version.version} value={version.version}>
                v{version.version}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
