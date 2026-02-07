"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

import { ServiceIcon } from "@/lib/service-icons";
import type {
  ServiceOption,
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
  const service = segments[0];
  if (!service) return {};

  const versionSegment = segments[1];
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
  const selectedService = services.find(
    (service) => service.slug === serviceValue,
  );
  const serviceLabel = selectedService?.name ?? "";
  const selectedServiceDescription = selectedService?.description?.trim();
  const versions = serviceValue ? (versionsByService[serviceValue] ?? []) : [];
  const versionValue = resolveVersionValue(versions, currentVersion);

  if (services.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <Select
        value={serviceValue}
        onValueChange={(nextService) => {
          if (!nextService) return;
          router.push(`/${nextService}`);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Service">
            {serviceValue ? (
              <span className="flex min-w-0 items-center gap-2">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-input/30 text-muted-foreground">
                  <ServiceIcon
                    icon={selectedService?.icon}
                    className="h-3.5 w-3.5"
                  />
                </span>
                <span className="min-w-0 truncate">{serviceLabel}</span>
              </span>
            ) : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Services</SelectLabel>
            {services.map((service) => (
              <SelectItem key={service.slug} value={service.slug}>
                <ServiceOptionContent
                  description={service.description}
                  icon={service.icon}
                  name={service.name}
                />
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {selectedServiceDescription ? (
        <p className="-mt-1 line-clamp-2 text-xs text-muted-foreground">
          {selectedServiceDescription}
        </p>
      ) : null}
      <Select
        value={versionValue === "" ? "Version" : `v${versionValue}`}
        disabled={!serviceValue || versions.length === 0}
        onValueChange={(nextVersion) => {
          if (!nextVersion || !serviceValue) return;
          router.push(`/${serviceValue}/v${nextVersion}`);
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

type ServiceOptionContentProps = {
  description?: string;
  icon?: ServiceOption["icon"];
  name: string;
};

function ServiceOptionContent({
  description,
  icon,
  name,
}: ServiceOptionContentProps) {
  const trimmedDescription = description?.trim();

  return (
    <span className="flex w-full items-start gap-2 py-0.5">
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <ServiceIcon icon={icon} className="h-3.5 w-3.5" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-medium text-foreground">{name}</span>
        {trimmedDescription ? (
          <span className="truncate text-xs text-muted-foreground">
            {trimmedDescription}
          </span>
        ) : null}
      </span>
    </span>
  );
}
