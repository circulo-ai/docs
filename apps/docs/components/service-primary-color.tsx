"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useMemo } from "react";

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
  const servicePrimaryColors = useMemo(
    () =>
      new Map(
        services
          .filter((service) => typeof service.primaryColor === "string")
          .map((service) => [service.slug, service.primaryColor?.trim()]),
      ),
    [services],
  );

  const serviceSlug = parseServiceSlug(pathname);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (!serviceSlug) {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--sidebar-primary");
      root.style.removeProperty("--sidebar-accent");
      return;
    }

    const primaryColor = servicePrimaryColors.get(serviceSlug);
    if (primaryColor) {
      root.style.setProperty("--primary", primaryColor);
      root.style.setProperty("--accent", primaryColor);
      root.style.setProperty("--sidebar-primary", primaryColor);
      root.style.setProperty("--sidebar-accent", primaryColor);
      return;
    }

    root.style.removeProperty("--primary");
    root.style.removeProperty("--accent");
    root.style.removeProperty("--sidebar-primary");
    root.style.removeProperty("--sidebar-accent");
  }, [servicePrimaryColors, serviceSlug]);

  return null;
}
