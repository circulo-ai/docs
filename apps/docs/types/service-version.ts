export type ServiceIconValue =
  | { type: "lucide"; name: string }
  | { type: "custom"; url: string; alt?: string };

export type ServiceThemeModeValue = Record<string, unknown>;

export type ServiceThemeValue = {
  light?: ServiceThemeModeValue;
  dark?: ServiceThemeModeValue;
};

export type ServiceThemePalettePreview = {
  background?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
};

export type ServiceOption = {
  slug: string;
  name: string;
  description?: string;
  icon?: ServiceIconValue;
  theme?: ServiceThemeValue;
  themePreview?: ServiceThemePalettePreview;
  primaryColor?: string;
};

export type VersionOption = {
  version: string;
  defaultPageSlug?: string;
  isPrerelease?: boolean;
  status?: "draft" | "published";
};

export type ServiceVersionOptions = {
  services: ServiceOption[];
  versionsByService: Record<string, VersionOption[]>;
};
