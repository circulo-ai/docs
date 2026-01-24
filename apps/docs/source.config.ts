import { defineDocs, defineConfig, DocsCollection } from "fumadocs-mdx/config";

export const docs: DocsCollection = defineDocs({
  dir: "content/docs",
});

export default defineConfig();
