import { getDocsSettings } from "@repo/docs-source";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CmsContent } from "@/components/cms-content";
import { LLMCopyButton, ViewOptions } from "@/components/page-actions";
import { getCmsConfig } from "@/lib/cms-config";
import { extractTocFromRichText } from "@/lib/richtext";

const resolveDocsSettings = async () => {
  const settings = await getDocsSettings(getCmsConfig(), { depth: 2 });
  const content = settings.homeContent ?? null;
  if (!content) return null;

  return {
    title: settings.homeTitle ?? "Documentation",
    description: settings.homeDescription ?? null,
    content,
  };
};

export default async function DocsIndex() {
  const resolved = await resolveDocsSettings();
  if (!resolved) notFound();

  const { title, description, content } = resolved;
  const toc = extractTocFromRichText(content);

  return (
    <DocsPage toc={toc} tableOfContent={{ style: "clerk" }}>
      <DocsTitle>{title}</DocsTitle>
      {description ? <DocsDescription>{description}</DocsDescription> : null}
      <DocsBody>
        <div className="flex flex-row items-center gap-2 border-b pt-2 pb-6">
          <LLMCopyButton markdownUrl="/.mdx" />
          <ViewOptions markdownUrl="/.mdx" />
        </div>
        <CmsContent content={content} tocItems={toc} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const resolved = await resolveDocsSettings();
  if (!resolved) notFound();

  return {
    title: resolved.title,
    description: resolved.description ?? undefined,
  };
}
