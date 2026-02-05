import { getCmsConfig } from "@/lib/cms-config";
import { renderRichText, type RichTextComponentMap } from "@/lib/richtext";

type CmsContentProps = {
  content: unknown;
  components?: RichTextComponentMap;
};

export function CmsContent({ content, components }: CmsContentProps) {
  const { baseUrl } = getCmsConfig();
  return <>{renderRichText(content, components, { baseUrl })}</>;
}
