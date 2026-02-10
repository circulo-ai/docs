import { getCmsConfig } from "@/lib/cms-config";
import { renderRichText, type RichTextComponentMap } from "@/lib/richtext";
import type { TOCItemType } from "fumadocs-core/toc";

type CmsContentProps = {
  content: unknown;
  components?: RichTextComponentMap;
  tocItems?: TOCItemType[];
};

export function CmsContent({ content, components, tocItems }: CmsContentProps) {
  const { baseUrl } = getCmsConfig();
  return <>{renderRichText(content, components, { baseUrl, tocItems })}</>;
}
