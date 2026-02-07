import { icons, type LucideIcon, type LucideProps } from "lucide-react";
import { createElement } from "react";

import type { ServiceIconValue } from "@/lib/service-version-types";

const FALLBACK_SERVICE_ICON = "BookOpen" as const;

const resolveServiceIcon = (iconName?: string): LucideIcon => {
  if (!iconName) {
    return icons[FALLBACK_SERVICE_ICON];
  }

  const resolved = icons[iconName as keyof typeof icons];
  if (resolved) {
    return resolved as LucideIcon;
  }

  return icons[FALLBACK_SERVICE_ICON];
};

type ServiceIconProps = LucideProps & {
  icon?: ServiceIconValue | string;
};

export function ServiceIcon({ icon, ...props }: ServiceIconProps) {
  if (icon && typeof icon === "object") {
    if (icon.type === "custom") {
      const size =
        typeof props.size === "number"
          ? props.size
          : props.size
            ? Number(props.size)
            : undefined;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={icon.alt ?? ""}
          className={props.className}
          height={size}
          src={icon.url}
          width={size}
        />
      );
    }

    return createElement(resolveServiceIcon(icon.name), props);
  }

  if (typeof icon === "string") {
    return createElement(resolveServiceIcon(icon), props);
  }

  return createElement(resolveServiceIcon(undefined), props);
}
