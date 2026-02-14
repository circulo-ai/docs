import { getDocsSettings } from "@repo/docs-source";

import { getCmsConfig } from "@/lib/cms-config";
import { formatLLMDocument, getLLMText } from "@/lib/get-llm-text";
import { getSource } from "@/lib/source";

export const revalidate = false;
export const dynamic = "force-dynamic";

const resolveHomeLLMText = async (): Promise<string | null> => {
  const settings = await getDocsSettings(getCmsConfig(), { depth: 2 });
  if (!settings.homeContent) return null;

  return formatLLMDocument({
    title: settings.homeTitle ?? "Documentation",
    url: "/",
    description: settings.homeDescription,
    content: settings.homeContent,
  });
};

export async function GET() {
  const source = await getSource();
  const pages = source
    .getPages()
    .slice()
    .sort((a, b) => a.url.localeCompare(b.url));

  const [home, ...documents] = await Promise.all([
    resolveHomeLLMText(),
    ...pages.map((page) => getLLMText(page)),
  ]);

  const content = [home, ...documents].filter((value): value is string =>
    Boolean(value),
  );

  return new Response(content.join("\n\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
