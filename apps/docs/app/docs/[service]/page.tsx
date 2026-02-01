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
    .filter(Boolean)
    .join("/");

export default async function ServiceRoute(props: ServiceRouteProps) {
  const params = await props.params;
  const service = params.service;
  const config = getCmsConfig();
  const latest = await getLatestVersion(config, service);

  if (!latest) {
    notFound();
  }

  const defaultSlug = normalizeSlug(latest.defaultPageSlug ?? "");
  if (!defaultSlug) {
    notFound();
  }

  redirect(`/docs/${service}/${defaultSlug}`);
}
