import {
  getDocsSettings,
  getLatestVersion,
  getVersion,
} from "@repo/docs-source";

import { getCmsConfig } from "@/lib/cms-config";
import { formatLLMDocument, getLLMText } from "@/lib/get-llm-text";
import { getSource } from "@/lib/source";

export const revalidate = false;
export const dynamic = "force-dynamic";

const VERSION_SEGMENT_REGEX =
  /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

const normalizeSegments = (segments: string[]) =>
  segments.map((part) => part.trim()).filter(Boolean);

const isVersionSegment = (segment: string) =>
  VERSION_SEGMENT_REGEX.test(segment);

const resolveDefaultSlug = async (
  service: string,
  versionSegment?: string,
): Promise<string[] | null> => {
  const config = getCmsConfig();

  if (versionSegment) {
    const version = await getVersion(config, {
      serviceSlug: service,
      version: versionSegment.slice(1),
    });
    const slug = normalizeSegments(version?.defaultPageSlug?.split("/") ?? []);
    return slug.length > 0 ? slug : null;
  }

  const latest = await getLatestVersion(config, service);
  const slug = normalizeSegments(latest?.defaultPageSlug?.split("/") ?? []);
  return slug.length > 0 ? slug : null;
};

const resolvePageFromSlugs = async (slugs: string[]) => {
  const normalized = normalizeSegments(slugs);
  if (normalized.length === 0) return null;

  const [service, ...rest] = normalized;
  if (!service) return null;

  let versionSegment = rest[0];
  let pageSegments = rest.slice(1);

  if (!versionSegment || !isVersionSegment(versionSegment)) {
    const latest = await getLatestVersion(getCmsConfig(), service);
    if (!latest) return null;

    versionSegment = `v${latest.version}`;
    pageSegments = rest;

    if (pageSegments.length === 0) {
      pageSegments = normalizeSegments(
        latest.defaultPageSlug?.split("/") ?? [],
      );
    }
  } else if (pageSegments.length === 0) {
    pageSegments = (await resolveDefaultSlug(service, versionSegment)) ?? [];
  }

  if (pageSegments.length === 0) return null;

  const source = await getSource();
  const page = source.getPage([service, versionSegment, ...pageSegments]);
  return page ?? null;
};

const resolveHomeText = async (): Promise<string | null> => {
  const settings = await getDocsSettings(getCmsConfig(), { depth: 2 });
  if (!settings.homeContent) return null;

  return formatLLMDocument({
    title: settings.homeTitle ?? "Documentation",
    url: "/",
    description: settings.homeDescription,
    content: settings.homeContent,
  });
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  const params = await context.params;
  const slugs = params.slug ?? [];

  const body =
    slugs.length === 0
      ? await resolveHomeText()
      : await resolvePageFromSlugs(slugs).then((page) =>
          page ? getLLMText(page) : null,
        );

  if (!body) {
    return new Response("Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
