import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeSanitize from "rehype-sanitize";
import rehypeRemark from "rehype-remark";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";
import { customSchema } from "@/lib/markdown-pipeline";

/**
 * Converts sanitized HTML text into Markdown (GFM).
 * Ensures safety via rehype-sanitize with custom schema matching the preview policy.
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return "";

  const processor = unified()
    .use(rehypeParse)
    .use(rehypeSanitize, customSchema)
    .use(rehypeRemark)
    .use(remarkGfm)
    .use(remarkStringify);

  const file = processor.processSync(html);
  return String(file).trim();
}
