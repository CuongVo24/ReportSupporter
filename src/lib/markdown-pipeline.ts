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
  clobberPrefix: "",
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span || []), "className"],
    div: [...(defaultSchema.attributes?.div || []), "className"],
    code: [...(defaultSchema.attributes?.code || []), "className"],
    pre: [...(defaultSchema.attributes?.pre || []), "className"],
    h1: [...(defaultSchema.attributes?.h1 || []), "id"],
    h2: [...(defaultSchema.attributes?.h2 || []), "id"],
    h3: [...(defaultSchema.attributes?.h3 || []), "id"],
    h4: [...(defaultSchema.attributes?.h4 || []), "id"],
    h5: [...(defaultSchema.attributes?.h5 || []), "id"],
    h6: [...(defaultSchema.attributes?.h6 || []), "id"],
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

const astRenderProcessor = unified()
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
    return '<p class="ws-preview-error">⚠ Không render được nội dung.</p>';
  }
}

/**
 * Renders an already parsed mdast AST Root to a sanitized HTML string.
 */
export function renderMdastToHtml(ast: MdastRoot): string {
  try {
    const hast = astRenderProcessor.runSync(ast);
    const result = astRenderProcessor.stringify(hast);
    return result.toString();
  } catch (error) {
    console.error("Failed to render MDAST:", error);
    return '<p class="ws-preview-error">⚠ Không render được nội dung.</p>';
  }
}

