import { renderRichText, type RichTextComponentMap } from "@/lib/richtext";

type CmsContentProps = {
  content: unknown;
  components?: RichTextComponentMap;
};

export function CmsContent({ content, components }: CmsContentProps) {
  return <>{renderRichText(content, components)}</>;
}
