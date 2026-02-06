import { getLatestVersion } from "@repo/docs-source";
import { notFound, redirect } from "next/navigation";

import { getCmsConfig } from "@/lib/cms-config";

type ServiceRouteProps = {
  params: { service: string } | Promise<{ service: string }>;
};

const normalizeSlug = (slug: string) =>
  slug
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

const encodeSlugPath = (slug: string) =>
  normalizeSlug(slug)
    .map((part) => encodeURIComponent(part))
    .join("/");

export default async function ServiceRoute(props: ServiceRouteProps) {
  const params = await props.params;
  const service = params.service;
  const config = getCmsConfig();
  const latest = await getLatestVersion(config, service);

  if (!latest) {
    notFound();
  }

  const defaultSlug = encodeSlugPath(latest.defaultPageSlug ?? "");
  if (!defaultSlug.length) {
    notFound();
  }

  redirect(`/${service}/${defaultSlug}`);
}
