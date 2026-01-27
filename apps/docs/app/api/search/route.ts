import { getSource } from "@/lib/source";
import { createFromSource } from "fumadocs-core/search/server";

const config = {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: "english",
};

export async function GET(request: Request) {
  const source = await getSource();
  const { GET } = createFromSource(source, config);
  return GET(request);
}
