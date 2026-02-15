import { notFound, redirect } from "next/navigation";

import { getLatestVersionCached } from "@/lib/latest-version-cache";

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
  const latest = await getLatestVersionCached(service);

  if (!latest) {
    notFound();
  }

  const defaultSlug = encodeSlugPath(latest.defaultPageSlug ?? "");
  if (!defaultSlug.length) {
    notFound();
  }

  redirect(`/${service}/${defaultSlug}`);
}
