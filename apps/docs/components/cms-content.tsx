import { getCmsConfig } from "@/lib/cms-config";
import { renderRichText, type RichTextComponentMap } from "@/lib/richtext";
import type { TOCItemType } from "fumadocs-core/toc";

import type {
  BlockFeedback,
  FeedbackAction,
} from "@/components/feedback-github/schema";

type CmsContentProps = {
  content: unknown;
  components?: RichTextComponentMap;
  tocItems?: TOCItemType[];
  blockFeedbackAction?: FeedbackAction<BlockFeedback>;
  currentServiceSlug?: string;
  currentVersion?: string;
};

export function CmsContent({
  content,
  components,
  tocItems,
  blockFeedbackAction,
  currentServiceSlug,
  currentVersion,
}: CmsContentProps) {
  const { baseUrl } = getCmsConfig();
  return (
    <>
      {renderRichText(content, components, {
        baseUrl,
        tocItems,
        onBlockFeedbackAction: blockFeedbackAction,
        currentServiceSlug,
        currentVersion,
      })}
    </>
  );
}
