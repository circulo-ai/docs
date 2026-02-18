"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useMemo } from "react";

import {
  buildServiceThemeOverrideStyles,
  SERVICE_THEME_OVERRIDE_VARIABLES,
} from "@/lib/service-theme-overrides";
import type { ServiceOption } from "@/types/service-version";

type ServicePrimaryColorProps = {
  services: ServiceOption[];
};

const parseServiceSlug = (pathname: string): string | undefined => {
  const [firstSegment] = pathname.split("/").filter(Boolean);
  if (!firstSegment) return undefined;

  try {
    return decodeURIComponent(firstSegment);
  } catch {
    return firstSegment;
  }
};

export function ServicePrimaryColor({ services }: ServicePrimaryColorProps) {
  const pathname = usePathname() ?? "";
  const serviceThemeStyles = useMemo(
    () =>
      new Map(
        services.map((service) => [
          service.slug,
          buildServiceThemeOverrideStyles(service.theme),
        ]),
      ),
    [services],
  );

  const serviceSlug = parseServiceSlug(pathname);

  useLayoutEffect(() => {
    const root = document.documentElement;
    SERVICE_THEME_OVERRIDE_VARIABLES.forEach((cssVar) =>
      root.style.removeProperty(cssVar),
    );

    if (!serviceSlug) {
      return;
    }

    const themeStyles = serviceThemeStyles.get(serviceSlug);
    if (!themeStyles) {
      return;
    }

    Object.entries(themeStyles).forEach(([key, value]) => {
      if (typeof value === "string" && value.trim()) {
        root.style.setProperty(key, value);
      }
    });
  }, [serviceThemeStyles, serviceSlug]);

  return null;
}
