import { parseMarkdown, flattenNodeText } from "@/lib/markdown-pipeline";
import type { ReportProjectBundle, ReportSection } from "@/types";
import { importReadme } from "./readme-import";

export const MAX_MARKDOWN_IMPORT_BYTES = 2 * 1024 * 1024;

export function appendSections(
  bundle: ReportProjectBundle,
  newSections: ReportSection[]
): ReportProjectBundle {
  const currentSections = bundle.project.sections;
  const maxOrder = currentSections.reduce((max, section) => Math.max(max, section.order), -1);

  const updatedNewSections = newSections.map((section, index) => ({
    ...section,
    id: crypto.randomUUID(),
    order: maxOrder + index + 1,
    status: section.status || "draft",
  }));

  return {
    ...bundle,
    project: {
      ...bundle.project,
      sections: [...currentSections, ...updatedNewSections],
      updatedAt: new Date().toISOString(),
    },
  };
}

export function replaceSections(
  bundle: ReportProjectBundle,
  newSections: ReportSection[]
): ReportProjectBundle {
  const updatedNewSections = newSections.map((section, index) => ({
    ...section,
    id: crypto.randomUUID(),
    order: index,
    status: section.status || "draft",
  }));

  return {
    ...bundle,
    project: {
      ...bundle.project,
      sections: updatedNewSections,
      updatedAt: new Date().toISOString(),
    },
  };
}

export type MarkdownImportDraft = {
  fileName: string;
  markdown: string;
  title: string;
  sectionCount: number;
};

const MARKDOWN_EXTENSIONS = [".md", ".markdown", ".mdown", ".mkd"];
const MARKDOWN_MIME_TYPES = ["text/markdown", "text/x-markdown"];

export function isMarkdownFileName(fileName: string): boolean {
  const lower = fileName.trim().toLowerCase();
  return MARKDOWN_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function isMarkdownFile(file: Pick<File, "name" | "type">): boolean {
  const mimeType = file.type.trim().toLowerCase();
  if (mimeType.startsWith("image/")) return false;
  return MARKDOWN_MIME_TYPES.includes(mimeType) || isMarkdownFileName(file.name);
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

export type MarkdownFileReadResult =
  | { ok: true; markdown: string; draft: MarkdownImportDraft }
  | { ok: false; error: string };

export async function readMarkdownFile(
  file: Pick<File, "name" | "type" | "size" | "text">,
  maxBytes = MAX_MARKDOWN_IMPORT_BYTES,
): Promise<MarkdownFileReadResult> {
  if (!isMarkdownFile(file)) {
    return { ok: false, error: "Chỉ nhận file Markdown .md hoặc .markdown." };
  }

  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, error: `File Markdown vượt quá giới hạn ${maxMb}MB.` };
  }

  try {
    const markdown = await file.text();
    if (!markdown.trim()) {
      return { ok: false, error: "File Markdown đang trống." };
    }

    return {
      ok: true,
      markdown,
      draft: buildMarkdownImportDraft(file.name || "report.md", markdown),
    };
  } catch {
    return { ok: false, error: "Không thể đọc nội dung file Markdown." };
  }
}
