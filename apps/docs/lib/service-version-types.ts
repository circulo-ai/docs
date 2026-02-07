export type ServiceIconValue =
  | { type: "lucide"; name: string }
  | { type: "custom"; url: string; alt?: string };

export type ServiceOption = {
  slug: string;
  name: string;
  description?: string;
  icon?: ServiceIconValue;
  primaryColor?: string;
};

export type VersionOption = {
  version: string;
  isPrerelease?: boolean;
  status?: "draft" | "published";
};

export type ServiceVersionOptions = {
  services: ServiceOption[];
  versionsByService: Record<string, VersionOption[]>;
};
