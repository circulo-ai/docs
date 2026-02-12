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
import type { CSSProperties } from "react";
import { useMemo } from "react";

import { ServiceIcon } from "@/lib/service-icons";
import type {
  ServiceOption,
  ServiceVersionOptions,
  VersionOption,
} from "@/lib/service-version-types";
import { Archive, Tag } from "lucide-react";
import { cn } from "./utils";

const VERSION_SEGMENT_REGEX =
  /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const CSS_COLOR_FUNCTION_REGEX =
  /^(#|rgb\(|rgba\(|hsl\(|hsla\(|hwb\(|lab\(|lch\(|oklab\(|oklch\(|color\(|var\()/i;

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

const normalizePrimaryColor = (primaryColor?: string) => {
  const trimmed = primaryColor?.trim();
  return trimmed ? trimmed : undefined;
};

const resolveServiceCssColor = (primaryColor?: string) => {
  const normalized = normalizePrimaryColor(primaryColor);
  if (!normalized) return undefined;
  if (CSS_COLOR_FUNCTION_REGEX.test(normalized)) return normalized;
  return `hsl(${normalized})`;
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
  const selectedServiceColor = resolveServiceCssColor(
    selectedService?.primaryColor,
  );
  const serviceLabel = selectedService?.name ?? "";
  const versions = serviceValue ? (versionsByService[serviceValue] ?? []) : [];
  const latestVersion = versions[0]?.version ?? "";
  const versionValue = resolveVersionValue(
    versions,
    latestVersion,
    currentVersion,
  );

  const SelectedVersionIcon = latestVersion === versionValue ? Tag : Archive;

  if (services.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <Select
        value={serviceValue}
        onValueChange={(nextService) => {
          if (!nextService || nextService === serviceValue) return;
          router.push(`/${nextService}`);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            <ServiceIcon
              icon={
                selectedService?.icon ?? {
                  type: "lucide",
                  name: "Folder",
                }
              }
              className="size-4"
              style={
                selectedServiceColor
                  ? ({ color: selectedServiceColor } as CSSProperties)
                  : undefined
              }
            />
            <span className="truncate">
              {serviceLabel || "Select a service"}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            <SelectLabel>Services</SelectLabel>
            {services.map((service) => (
              <SelectItem
                key={service.slug}
                value={service.slug}
                style={
                  service.primaryColor
                    ? ({
                        "--primary": service.primaryColor,
                        "--accent": service.primaryColor,
                        "--sidebar-primary": service.primaryColor,
                        "--sidebar-accent": service.primaryColor,
                      } as CSSProperties)
                    : undefined
                }
              >
                <ServiceOptionContent
                  description={service.description}
                  icon={service.icon}
                  name={service.name}
                  primaryColor={service.primaryColor}
                />
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={versionValue}
        disabled={!serviceValue || versions.length === 0}
        onValueChange={(nextVersion) => {
          if (!nextVersion || !serviceValue || nextVersion === versionValue) {
            return;
          }
          router.push(`/${serviceValue}/v${nextVersion}`);
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
  primaryColor?: string;
};

function ServiceOptionContent({
  description,
  icon,
  name,
  primaryColor,
}: ServiceOptionContentProps) {
  const trimmedDescription = description?.trim();
  const serviceColor = resolveServiceCssColor(primaryColor);

  return (
    <>
      <ServiceIcon
        icon={icon}
        className="my-auto size-4"
        style={
          serviceColor ? ({ color: serviceColor } as CSSProperties) : undefined
        }
      />
      <span className="flex flex-col">
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
