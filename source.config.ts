import { defineDocs, defineConfig } from "fumadocs-mdx/config";

export const docs = defineDocs({
  dir: "content/docs",
});

export const docsPt = defineDocs({
  dir: "content/docs-pt",
});

export default defineConfig();
