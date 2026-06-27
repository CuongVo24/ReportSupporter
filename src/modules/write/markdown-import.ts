import { parseMarkdown, flattenNodeText } from "@/lib/markdown-pipeline";
import { importReadme } from "./readme-import";

export type MarkdownImportDraft = {
  fileName: string;
  markdown: string;
  title: string;
  sectionCount: number;
};

const MARKDOWN_EXTENSIONS = [".md", ".markdown", ".mdown", ".mkd"];

export function isMarkdownFileName(fileName: string): boolean {
  const lower = fileName.trim().toLowerCase();
  return MARKDOWN_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function titleFromMarkdownFileName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const normalized = withoutExtension.replace(/[-_]+/g, " ").trim();
  if (!normalized) return "Báo cáo Markdown";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function inferMarkdownTitle(markdown: string, fileName: string): string {
  const trimmed = markdown.trim();
  if (!trimmed) return titleFromMarkdownFileName(fileName);

  const ast = parseMarkdown(trimmed);
  const heading = ast.children.find(
    (node) => node.type === "heading" && (node.depth === 1 || node.depth === 2),
  );

  if (heading) {
    const title = flattenNodeText(heading as { value?: string; children?: unknown[] }).trim();
    if (title) return title;
  }

  return titleFromMarkdownFileName(fileName);
}

export function buildMarkdownImportDraft(fileName: string, markdown: string): MarkdownImportDraft {
  const normalizedMarkdown = markdown.trim();
  const persistedMarkdown = normalizedMarkdown ? `${normalizedMarkdown}\n` : "";
  const sectionCount = importReadme(persistedMarkdown).length;

  return {
    fileName,
    markdown: persistedMarkdown,
    title: inferMarkdownTitle(persistedMarkdown, fileName),
    sectionCount,
  };
}
