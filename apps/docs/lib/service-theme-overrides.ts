import { CSSProperties } from "react";

export const SERVICE_THEME_LIGHT_TOKENS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "radius",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
] as const;

export const SERVICE_THEME_DARK_TOKENS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
] as const;

export type ServiceThemeToken =
  | (typeof SERVICE_THEME_LIGHT_TOKENS)[number]
  | (typeof SERVICE_THEME_DARK_TOKENS)[number];

export type ServiceThemeModeValues = Record<string, unknown>;

export type ServiceThemeOverridesInput = {
  light?: ServiceThemeModeValues | null;
  dark?: ServiceThemeModeValues | null;
};

export type ServiceThemePalettePreview = {
  background?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
};

const toTokenFieldName = (token: ServiceThemeToken) =>
  token.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());

const normalizeTokenValue = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const readTokenValue = (
  values: ServiceThemeModeValues | null | undefined,
  token: ServiceThemeToken,
) => {
  if (!values || typeof values !== "object") return undefined;
  return normalizeTokenValue(values[toTokenFieldName(token)]);
};

export const SERVICE_THEME_OVERRIDE_VARIABLES = [
  ...SERVICE_THEME_LIGHT_TOKENS.map(
    (token) => `--service-light-${token}` as const,
  ),
  ...SERVICE_THEME_DARK_TOKENS.map(
    (token) => `--service-dark-${token}` as const,
  ),
];

export const buildServiceThemeOverrideStyles = (
  theme: ServiceThemeOverridesInput | null | undefined,
): CSSProperties | undefined => {
  if (!theme) return undefined;

  const styles: Record<string, string> = {};

  for (const token of SERVICE_THEME_LIGHT_TOKENS) {
    const value = readTokenValue(theme.light, token);
    if (value) {
      styles[`--service-light-${token}`] = value;
    }
  }

  for (const token of SERVICE_THEME_DARK_TOKENS) {
    const value = readTokenValue(theme.dark, token);
    if (value) {
      styles[`--service-dark-${token}`] = value;
    }
  }

  if (Object.keys(styles).length === 0) return undefined;
  return styles as CSSProperties;
};

export const extractServiceThemePreview = (
  theme: ServiceThemeOverridesInput | null | undefined,
): ServiceThemePalettePreview | undefined => {
  if (!theme) return undefined;

  const preview: ServiceThemePalettePreview = {
    background: readTokenValue(theme.light, "background"),
    primary: readTokenValue(theme.light, "primary"),
    secondary: readTokenValue(theme.light, "secondary"),
    accent: readTokenValue(theme.light, "accent"),
  };

  if (
    !preview.background &&
    !preview.primary &&
    !preview.secondary &&
    !preview.accent
  ) {
    return undefined;
  }

  return preview;
};

export const resolveServiceThemePrimaryColor = (
  theme: ServiceThemeOverridesInput | null | undefined,
) => readTokenValue(theme?.light, "primary");
