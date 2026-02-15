"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useMemo } from "react";

import { serviceColors } from "@/lib/service-colors";
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
      serviceColors.forEach((color) => root.style.removeProperty(color));
      return;
    }

    const primaryColor = servicePrimaryColors.get(serviceSlug);
    if (primaryColor) {
      serviceColors.forEach((color) =>
        root.style.setProperty(color, primaryColor),
      );
      return;
    }

    serviceColors.forEach((color) => root.style.removeProperty(color));
  }, [servicePrimaryColors, serviceSlug]);

  return null;
}
