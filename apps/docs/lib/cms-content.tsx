import { ComponentMap, renderLexicalContent } from "@/lib/lexical-renderer";

type CmsContentProps = {
  content: unknown;
  components?: ComponentMap;
};

export function CmsContent({ content, components }: CmsContentProps) {
  const { content: rendered } = renderLexicalContent(content, { components });
  return <>{rendered}</>;
}
