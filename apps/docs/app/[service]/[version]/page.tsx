import { getVersion } from "@repo/docs-source";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getCmsConfig } from "@/lib/cms-config";
import AliasPage, {
  generateMetadata as generateAliasMetadata,
} from "../[...slug]/page";

type VersionRouteProps = {
  params:
    | { service: string; version: string }
    | Promise<{ service: string; version: string }>;
};

const VERSION_SEGMENT_REGEX =
  /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

const normalizeSlug = (slug: string) =>
  slug
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

const encodeSlugPath = (slug: string) =>
  normalizeSlug(slug)
    .map((part) => encodeURIComponent(part))
    .join("/");

export default async function VersionRoute(props: VersionRouteProps) {
  const params = await props.params;
  const { service, version } = params;

  if (!VERSION_SEGMENT_REGEX.test(version)) {
    return AliasPage({ params: { service, slug: [version] } });
  }

  const docVersion = await getVersion(getCmsConfig(), {
    serviceSlug: service,
    version: version.slice(1),
  });

  if (!docVersion) {
    notFound();
  }

  const defaultSlug = encodeSlugPath(docVersion.defaultPageSlug ?? "");
  if (!defaultSlug.length) {
    notFound();
  }

  redirect(`/${service}/${version}/${defaultSlug}`);
}

export async function generateMetadata(
  props: VersionRouteProps,
): Promise<Metadata> {
  const params = await props.params;
  const { service, version } = params;

  if (!VERSION_SEGMENT_REGEX.test(version)) {
    return generateAliasMetadata({ params: { service, slug: [version] } });
  }

  return {
    title: `${service} ${version}`,
  };
}
