import { icons, type LucideIcon } from "lucide-react";

const FALLBACK_SERVICE_ICON = "BookOpen" as const;

export const resolveServiceIcon = (iconName?: string): LucideIcon => {
  if (!iconName) {
    return icons[FALLBACK_SERVICE_ICON];
  }

  const resolved = icons[iconName as keyof typeof icons];
  if (resolved) {
    return resolved as LucideIcon;
  }

  return icons[FALLBACK_SERVICE_ICON];
};
