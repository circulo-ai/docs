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
import { Archive, Tag } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

import { ServiceIcon } from "@/components/service-icons";
import {
  buildServiceLatestHref,
  buildVersionHref,
  isKeyboardSelectionEvent,
  isSamePathname,
} from "@/lib/service-version-switcher-navigation";
import { cn } from "@/lib/utils";
import type {
  ServiceOption,
  ServiceVersionOptions,
  VersionOption,
} from "@/types/service-version";

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
  latestVersion: string,
  currentVersion?: string,
) => {
  if (!versions.length) return "";

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
  const versions = serviceValue ? (versionsByService[serviceValue] ?? []) : [];
  const latestVersion = versions[0]?.version ?? "";
  const versionValue = resolveVersionValue(
    versions,
    latestVersion,
    currentVersion,
  );

  const preventSamePathNavigation = (
    event: { defaultPrevented: boolean; preventDefault: () => void },
    href: string,
  ) => {
    if (!event.defaultPrevented && isSamePathname(pathname, href)) {
      event.preventDefault();
    }
  };

  const pushIfPathChanged = (href: string) => {
    if (!isSamePathname(pathname, href)) {
      router.push(href);
    }
  };

  const resolveServiceHref = (serviceSlug: string) => {
    const latestDefaultPageSlug =
      versionsByService[serviceSlug]?.[0]?.defaultPageSlug;
    return buildServiceLatestHref(serviceSlug, latestDefaultPageSlug);
  };

  const SelectedVersionIcon = latestVersion === versionValue ? Tag : Archive;

  if (services.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <Select
        value={serviceValue}
        onValueChange={(nextService, eventDetails) => {
          if (!nextService || nextService === serviceValue) return;
          if (!isKeyboardSelectionEvent(eventDetails)) return;
          pushIfPathChanged(resolveServiceHref(nextService));
        }}
      >
        <SelectTrigger className="h-auto! w-full">
          <SelectValue className="gap-2!">
            <ServiceOptionContent
              description={selectedService?.description ?? "Browse docs"}
              icon={
                selectedService?.icon ?? {
                  type: "lucide",
                  name: "Folder",
                }
              }
              name={selectedService?.name ?? "Select a service"}
            />
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            <SelectLabel>Services</SelectLabel>
            {services.map((service) => (
              <SelectItem
                key={service.slug}
                value={service.slug}
                nativeButton={false}
                render={(props) => {
                  const href = resolveServiceHref(service.slug);
                  return (
                    <Link
                      href={href}
                      {...props}
                      onClick={(event) => {
                        props.onClick?.(event);
                        preventSamePathNavigation(event, href);
                      }}
                    />
                  );
                }}
              >
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
      <Select
        value={versionValue}
        disabled={!serviceValue || versions.length === 0}
        onValueChange={(nextVersion, eventDetails) => {
          if (!nextVersion || !serviceValue || nextVersion === versionValue) {
            return;
          }
          if (!isKeyboardSelectionEvent(eventDetails)) return;
          pushIfPathChanged(buildVersionHref(serviceValue, nextVersion));
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            <SelectedVersionIcon className="size-4" />
            <span className="truncate">
              {versionValue || "Select a version"}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            <SelectLabel>Versions</SelectLabel>
            {versions.map(({ version }) => {
              const isLatest = version === latestVersion;
              const Icon = isLatest ? Tag : Archive;
              return (
                <SelectItem
                  key={version}
                  value={version}
                  nativeButton={false}
                  render={(props) => {
                    const href = buildVersionHref(serviceValue, version);
                    return (
                      <Link
                        href={href}
                        {...props}
                        onClick={(event) => {
                          props.onClick?.(event);
                          preventSamePathNavigation(event, href);
                        }}
                      />
                    );
                  }}
                  className="*:items-center"
                >
                  <Icon
                    className={cn(
                      "size-4",
                      !isLatest && "text-muted-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "truncate",
                      !isLatest && "text-muted-foreground",
                    )}
                  >
                    v{version}
                  </span>
                </SelectItem>
              );
            })}
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
    <>
      <ServiceIcon icon={icon} className="my-auto size-4" />
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{name}</span>
        {trimmedDescription && (
          <span className="truncate text-xs text-muted-foreground">
            {trimmedDescription}
          </span>
        )}
      </span>
    </>
  );
}
