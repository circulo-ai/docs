import { getLatestVersion } from "@repo/docs-source";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { cloneElement, isValidElement, type ComponentProps } from "react";

import { getMDXComponents } from "@/mdx-components";
import { getCmsConfig } from "@/lib/cms-config";
import { getSource } from "@/lib/source";

type LatestAliasProps = {
  params:
    | { service: string; slug: string[] }
    | Promise<{ service: string; slug: string[] }>;
};

const VERSION_SEGMENT_REGEX =
  /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

const isVersionSegment = (segment: string) =>
  VERSION_SEGMENT_REGEX.test(segment);

const normalizeSegments = (segments: string[]) =>
  segments.map((part) => part.trim()).filter(Boolean);

const resolvePage = async (service: string, segments: string[]) => {
  const normalized = normalizeSegments(segments);
  if (normalized.length === 0) return null;

  let versionSegment = normalized[0] as string; // type assertion is safe due to prior length check
  let slugParts = normalized.slice(1);
  let isAlias = false;

  if (!isVersionSegment(versionSegment)) {
    const latest = await getLatestVersion(getCmsConfig(), service);
    if (!latest) return null;
    versionSegment = `v${latest.version}`;
    slugParts = normalized;
    isAlias = true;
  }

  if (slugParts.length === 0) return null;

  const source = await getSource();
  const page = source.getPage([service, versionSegment, ...slugParts]);
  return page ? { page, source, service, versionSegment, isAlias } : null;
};

const rewriteHrefForAlias = (
  href: string,
  service: string,
  versionSegment: string,
) => {
  if (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return href;
  }

  let url: URL;
  try {
    url = new URL(href, "http://docs.local");
  } catch {
    return href;
  }

  if (url.origin !== "http://docs.local") {
    return href;
  }

  const versionPrefix = `/docs/${service}/${versionSegment}/`;
  const versionRoot = `/docs/${service}/${versionSegment}`;

  if (url.pathname.startsWith(versionPrefix)) {
    url.pathname =
      `/docs/${service}/` + url.pathname.slice(versionPrefix.length);
    return url.pathname + url.search + url.hash;
  }

  if (url.pathname === versionRoot) {
    url.pathname = `/docs/${service}`;
    return url.pathname + url.search + url.hash;
  }

  return href;
};

export default async function Page(props: LatestAliasProps) {
  const params = await props.params;
  const resolved = await resolvePage(params.service, params.slug);
  if (!resolved) notFound();

  const { page, source, service, versionSegment, isAlias } = resolved;
  const MDX = page.data.body;
  const RelativeLink = createRelativeLink(source, page);
  const aliasAwareLink = (props: ComponentProps<"a">) => {
    const element = RelativeLink(props);
    if (!isAlias) return element;
    if (!isValidElement<{ href?: string }>(element)) return element;
    const href = element.props.href;
    if (typeof href !== "string") return element;
    const nextHref = rewriteHrefForAlias(href, service, versionSegment);
    if (nextHref === href) return element;
    return cloneElement(element, { href: nextHref });
  };

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: aliasAwareLink,
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateMetadata(
  props: LatestAliasProps,
): Promise<Metadata> {
  const params = await props.params;
  const resolved = await resolvePage(params.service, params.slug);
  if (!resolved) notFound();

  const { page } = resolved;
  return {
    title: page.data.title,
    description: page.data.description,
  };
}
