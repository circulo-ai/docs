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
import { useMemo, type CSSProperties } from "react";

import { ServiceIcon } from "@/components/service-icons";
import { buildServiceThemeOverrideStyles } from "@/lib/service-theme-overrides";
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
const CSS_COLOR_FUNCTION_REGEX =
  /^(#|rgb\(|rgba\(|hsl\(|hsla\(|hwb\(|lab\(|lch\(|oklab\(|oklch\(|color\(|var\()/i;

type ParsedPath = {
  service?: string;
  version?: string;
};

type ThemePreview = ServiceOption["themePreview"];

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

const normalizePreviewColor = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

function ServiceThemePalette({ preview }: { preview?: ThemePreview }) {
  const values = [
    normalizePreviewColor(preview?.background),
    normalizePreviewColor(preview?.primary),
    normalizePreviewColor(preview?.secondary),
    normalizePreviewColor(preview?.accent),
  ];

  if (!values.some(Boolean)) return null;

  return (
    <span
      aria-hidden="true"
      className="grid h-4 w-4 shrink-0 grid-cols-2 grid-rows-2 overflow-hidden rounded border"
    >
      {values.map((value, index) => (
        <span
          key={index}
          className="block"
          style={
            value ? ({ backgroundColor: value } as CSSProperties) : undefined
          }
        />
      ))}
    </span>
  );
}

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
            <ServiceThemePalette preview={selectedService?.themePreview} />
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
                style={buildServiceThemeOverrideStyles(service.theme)}
              >
                <ServiceOptionContent
                  description={service.description}
                  icon={service.icon}
                  name={service.name}
                  primaryColor={service.primaryColor}
                  themePreview={service.themePreview}
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
  primaryColor?: string;
  themePreview?: ThemePreview;
};

function ServiceOptionContent({
  description,
  icon,
  name,
  primaryColor,
  themePreview,
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
      <ServiceThemePalette preview={themePreview} />
    </>
  );
}
