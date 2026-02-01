export type ServiceOption = {
  slug: string;
  name: string;
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
