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
import type { Root as HastRoot } from "hast";

// Extended sanitize schema to preserve LaTeX math classes and code syntax highlight classes.
// data: URIs are allowed for images (offline assets), style attributes are stripped.
export const customSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), "button"],
  clobberPrefix: "",
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span || []), "className", "data-url"],
    div: [...(defaultSchema.attributes?.div || []), "className", "data-missing-image", "data-original-src", "data-alt"],
    p: [...(defaultSchema.attributes?.p || []), "className", "data-missing-image", "data-original-src", "data-alt"],
    button: [...(defaultSchema.attributes?.button || []), "className", "type", "data-action", "data-original-src", "data-alt"],
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
  .use(rehypeHighlight);

const htmlProcessor = unified()
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
 * Transforms an MDAST root to a HAST root using the unified pipeline.
 */
export function renderMdastToHast(ast: MdastRoot): HastRoot {
  return astRenderProcessor.runSync(ast) as HastRoot;
}

/**
 * Serializes a HAST root to an HTML string.
 */
export function stringifyHast(hast: HastRoot): string {
  return htmlProcessor.stringify(hast);
}

/**
 * Renders an already parsed mdast AST Root to a sanitized HTML string.
 */
export function renderMdastToHtml(ast: MdastRoot): string {
  try {
    const hast = renderMdastToHast(ast);
    return stringifyHast(hast);
  } catch (error) {
    console.error("Failed to render MDAST:", error);
    return '<p class="ws-preview-error">⚠ Không render được nội dung.</p>';
  }
}

/**
 * Flattens any MDAST/UNIST node value and children text recursively.
 * Replaces duplicate helpers across modules.
 */
export function flattenNodeText(node: { value?: string; children?: unknown[] }): string {
  let text = "";
  if (node.value) {
    text += node.value;
  }
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      text += flattenNodeText(child as { value?: string; children?: unknown[] });
    }
  }
  return text;
}
