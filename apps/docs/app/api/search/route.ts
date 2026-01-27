import { getSource } from "@/lib/source";
import { createSearchAPI } from "fumadocs-core/search/server";

const toTitle = (segment: string) =>
  segment.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export async function GET(request: Request) {
  const source = await getSource();
  const pages = source.getPages();
  const indexes = pages.map((page) => ({
    title: page.data.title ?? "Untitled",
    description: page.data.description ?? "",
    breadcrumbs: page.slugs.map(toTitle),
    content: page.data.description ?? "",
    url: page.url,
  }));

  const { GET } = createSearchAPI("simple", {
    indexes,
    // https://docs.orama.com/docs/orama-js/supported-languages
    language: "english",
  });
  return GET(request);
}
