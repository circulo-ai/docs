import {
  defineDocs,
  defineConfig,
  frontmatterSchema,
  metaSchema,
  DocsCollection,
} from "fumadocs-mdx/config";

export const docs: DocsCollection<typeof frontmatterSchema, typeof metaSchema> =
  defineDocs({
    dir: "content/docs",
  });

export default defineConfig();
