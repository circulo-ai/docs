import { getCmsConfig } from "@/lib/cms-config";
import {
  richTextHasContent,
  richTextToMarkdown,
} from "@/lib/richtext-markdown";

type LLMPageLike = {
  url: string;
  data: {
    title?: string;
    description?: string;
    rawContent?: unknown;
  };
};

type LLMDocumentInput = {
  title: string;
  url: string;
  description?: string | null;
  content?: unknown;
};

const normalizeParagraph = (value: string) =>
  value.trim().replace(/\n{3,}/g, "\n\n");

export const formatLLMDocument = ({
  title,
  url,
  description,
  content,
}: LLMDocumentInput): string => {
  const { baseUrl } = getCmsConfig();
  const sections: string[] = [`# ${title} (${url})`];

  const cleanDescription = description?.trim();
  if (cleanDescription) {
    sections.push(cleanDescription);
  }

  if (richTextHasContent(content)) {
    const markdown = richTextToMarkdown(content, {
      baseUrl,
    });

    if (markdown.length > 0) {
      sections.push(markdown);
    }
  }

  return normalizeParagraph(sections.join("\n\n"));
};

export async function getLLMText(page: LLMPageLike): Promise<string> {
  return formatLLMDocument({
    title: page.data.title ?? "Untitled",
    url: page.url,
    description: page.data.description,
    content: page.data.rawContent,
  });
}
