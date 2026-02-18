import { getDocsSettings } from "@repo/docs-source";
import {
  DocsBody,
  DocsDescription,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CmsContent } from "@/components/cms-content";
import { DocsPageWithFeedback } from "@/components/docs-page-with-feedback";
import {
  onBlockFeedbackAction,
  onPageFeedbackAction,
} from "@/components/feedback/actions";
import { Feedback } from "@/components/feedback/client";
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
    <DocsPageWithFeedback toc={toc} tableOfContent={{ style: "clerk" }}>
      <DocsTitle>{title}</DocsTitle>
      {description ? <DocsDescription>{description}</DocsDescription> : null}
      <DocsBody>
        <div className="mb-4 flex items-center gap-2 border-b pb-4">
          <LLMCopyButton markdownUrl="/.mdx" />
          <ViewOptions markdownUrl="/.mdx" />
        </div>
        <CmsContent
          content={content}
          tocItems={toc}
          blockFeedbackAction={onBlockFeedbackAction}
        />
        <Feedback onSendAction={onPageFeedbackAction} />
      </DocsBody>
    </DocsPageWithFeedback>
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
