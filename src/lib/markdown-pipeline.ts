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

export const HEADING_DOM_CLOBBER_PREFIX = "user-content-";

/**
 * Returns a canonical, DOM-clobber-safe element ID with user-content- prefix.
 */
export function getHeadingAnchorId(id: string): string {
  if (!id) return "";
  return id.startsWith(HEADING_DOM_CLOBBER_PREFIX) ? id : `${HEADING_DOM_CLOBBER_PREFIX}${id}`;
}

/**
 * Branded type for HTML strings that have undergone full pipeline sanitization.
 */
export type SanitizedHtml = string & { readonly __sanitizedBrand: unique symbol };

export function asSanitizedHtml(html: string): SanitizedHtml {
  return html as SanitizedHtml;
}

// Extended sanitize schema to preserve LaTeX math elements/classes, code syntax highlight classes,
// figures/captions, and prevent DOM-clobbering via user-content- prefixing.
export const customSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    "button",
    "figure",
    "figcaption",
    "caption",
    "math",
    "annotation",
    "annotation-xml",
    "semantics",
    "mtext",
    "mn",
    "mo",
    "mi",
    "mspace",
    "mtable",
    "mtr",
    "mtd",
    "mrow",
    "msubsup",
    "msup",
    "msub",
    "mfrac",
    "msqrt",
    "mroot",
    "svg",
    "path",
    "line",
    "rect",
    "circle",
    "polygon",
    "polyline",
    "use",
  ],
  clobberPrefix: HEADING_DOM_CLOBBER_PREFIX,
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span || []), "className", "data-url", "style", "aria-hidden"],
    div: [...(defaultSchema.attributes?.div || []), "className", "data-missing-image", "data-original-src", "data-alt", "style"],
    p: [...(defaultSchema.attributes?.p || []), "className", "data-missing-image", "data-original-src", "data-alt"],
    button: [...(defaultSchema.attributes?.button || []), "className", "type", "data-action", "data-original-src", "data-alt"],
    figure: ["className", "id", "style"],
    figcaption: ["className", "id", "style"],
    caption: ["className", "id", "style"],
    table: [...(defaultSchema.attributes?.table || []), "id", "className", "style"],
    code: [...(defaultSchema.attributes?.code || []), "className"],
    pre: [...(defaultSchema.attributes?.pre || []), "className"],
    h1: [...(defaultSchema.attributes?.h1 || []), "id"],
    h2: [...(defaultSchema.attributes?.h2 || []), "id"],
    h3: [...(defaultSchema.attributes?.h3 || []), "id"],
    h4: [...(defaultSchema.attributes?.h4 || []), "id"],
    h5: [...(defaultSchema.attributes?.h5 || []), "id"],
    h6: [...(defaultSchema.attributes?.h6 || []), "id"],
    a: [...(defaultSchema.attributes?.a || []), "id", "aria-hidden", "tabIndex"],
    svg: ["xmlns", "viewBox", "width", "height", "className", "aria-hidden", "role", "style"],
    path: ["d", "fill", "stroke", "strokeWidth", "className"],
    annotation: ["encoding"],
    math: ["xmlns", "display"],
    mo: ["stretchy", "symmetric", "lspace", "rspace", "maxsize", "minsize", "fence", "separator", "accent", "largeop", "movablelimits"],
    mi: ["mathvariant"],
    mn: ["mathvariant"],
    mspace: ["width", "height", "depth"],
    mtext: ["mathvariant"],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: [...(defaultSchema.protocols?.src || []), "data", "http", "https"],
    href: [...(defaultSchema.protocols?.href || []), "http", "https"],
  },
};

const parseProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath);

const renderProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeKatex)
  .use(rehypeHighlight)
  .use(rehypeSanitize, customSchema)
  .use(rehypeStringify);

const astRenderProcessor = unified()
  .use(remarkRehype)
  .use(rehypeKatex)
  .use(rehypeHighlight)
  .use(rehypeSanitize, customSchema);

const htmlProcessor = unified()
  .use(rehypeStringify);

export function parseMarkdown(markdown: string): MdastRoot {
  const ast = parseProcessor.parse(markdown);
  const transformedAst = parseProcessor.runSync(ast);
  return transformedAst as MdastRoot;
}

export function renderMarkdown(markdown: string): SanitizedHtml {
  try {
    const result = renderProcessor.processSync(markdown);
    return asSanitizedHtml(result.toString());
  } catch {
    return asSanitizedHtml('<p class="ws-preview-error">⚠ Không render được nội dung.</p>');
  }
}

export function renderMdastToHast(ast: MdastRoot): HastRoot {
  const clonedAst = structuredClone(ast);
  return astRenderProcessor.runSync(clonedAst) as HastRoot;
}

export function stringifyHast(hast: HastRoot): string {
  return htmlProcessor.stringify(hast);
}

export function renderMdastToHtml(ast: MdastRoot): SanitizedHtml {
  try {
    const hast = renderMdastToHast(ast);
    return asSanitizedHtml(stringifyHast(hast));
  } catch {
    return asSanitizedHtml('<p class="ws-preview-error">⚠ Không render được nội dung.</p>');
  }
}

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
