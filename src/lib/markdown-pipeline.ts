import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import type { MdastRoot } from "./pipeline-types";

// Extended sanitize schema to preserve LaTeX math classes and code syntax highlight classes.
// data: URIs are allowed for images (offline assets), style attributes are stripped.
const customSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span || []), "className"],
    div: [...(defaultSchema.attributes?.div || []), "className"],
    code: [...(defaultSchema.attributes?.code || []), "className"],
    pre: [...(defaultSchema.attributes?.pre || []), "className"],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: [...(defaultSchema.protocols?.src || []), "data"],
  },
};

// Reusable processors initialized once at module scope.
const parseProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath);

const renderProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeSanitize, customSchema)
  .use(rehypeKatex)
  .use(rehypeHighlight)
  .use(rehypeStringify);

/**
 * Parses raw Markdown text into a fully processed mdast AST Root.
 * remark-gfm and remark-math transforms are run on the tree.
 */
export function parseMarkdown(markdown: string): MdastRoot {
  const ast = parseProcessor.parse(markdown);
  const transformedAst = parseProcessor.runSync(ast);
  return transformedAst as MdastRoot;
}

/**
 * Renders Markdown text to a sanitized, styling-ready HTML string.
 * The output html is safe to insert directly into DOM via dangerouslySetInnerHTML.
 */
export function renderMarkdown(markdown: string): string {
  try {
    const result = renderProcessor.processSync(markdown);
    return result.toString();
  } catch (error) {
    console.error("Failed to render markdown:", error);
    return "";
  }
}
