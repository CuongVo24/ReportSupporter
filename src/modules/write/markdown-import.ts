import { parseMarkdown, flattenNodeText } from "@/lib/markdown-pipeline";
import type {
  ReportProjectBundle,
  ReportSection,
  ReportAsset,
  EvidenceItem,
  ImportDraft,
  ImportResult,
  ImportWarning,
  ImportSourceFormat,
  AssetResolution,
} from "@/types";
import { splitMarkdownIntoSections } from "./readme-import";
import { extractEmbeddedAssets } from "../import";

export const MAX_MARKDOWN_IMPORT_BYTES = 50 * 1024 * 1024;

/**
 * Appends new sections, assets, and evidence items into the bundle.
 * Generates fresh UUIDs for all imported items at commit time and rewrites references.
 */
export function appendSections(
  bundle: ReportProjectBundle,
  newSections: ReportSection[],
  newAssets: ReportAsset[] = [],
  newEvidence: EvidenceItem[] = []
): ReportProjectBundle {
  const currentSections = bundle.project.sections;
  const maxOrder = currentSections.reduce(
    (max, section) => Math.max(max, section.order),
    -1
  );

  // 1. Generate new asset IDs and build a mapping to rewrite references
  const assetIdMap = new Map<string, string>();
  const processedAssets = newAssets.map((asset) => {
    const newId = crypto.randomUUID();
    assetIdMap.set(asset.id, newId);
    return {
      ...asset,
      id: newId,
      insertedAt: new Date().toISOString(),
    };
  });

  // 2. Rewrite asset references in sections and assign new section IDs
  const processedSections = newSections.map((section, index) => {
    let md = section.markdown;
    assetIdMap.forEach((newId, oldId) => {
      const escapedOld = oldId.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const mdRegex = new RegExp(`(!\\[.*?\\]\\(asset:)${escapedOld}(\\))`, "g");
      md = md.replace(mdRegex, `$1${newId}$2`);

      const htmlRegex = new RegExp(
        `(<img\\s+[^>]*src=["']asset:)${escapedOld}(["'])`,
        "gi"
      );
      md = md.replace(htmlRegex, `$1${newId}$2`);
    });

    return {
      ...section,
      id: crypto.randomUUID(),
      markdown: md,
      order: maxOrder + index + 1,
      status: section.status || "draft",
      revision: 0,
    };
  });

  // 3. Rewrite asset refs in evidence
  const processedEvidence = newEvidence.map((ev) => {
    let url = ev.url;
    assetIdMap.forEach((newId, oldId) => {
      if (url === `asset:${oldId}`) {
        url = `asset:${newId}`;
      }
    });

    return {
      ...ev,
      id: crypto.randomUUID(),
      url,
      createdAt: new Date().toISOString(),
    };
  });

  return {
    ...bundle,
    assets: [...bundle.assets, ...processedAssets],
    evidence: [...bundle.evidence, ...processedEvidence],
    project: {
      ...bundle.project,
      sections: [...currentSections, ...processedSections],
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Replaces project sections, assets, and evidence items with new ones.
 * Generates fresh UUIDs for all imported items at commit time and rewrites references.
 */
export function replaceSections(
  bundle: ReportProjectBundle,
  newSections: ReportSection[],
  newAssets: ReportAsset[] = [],
  newEvidence: EvidenceItem[] = []
): ReportProjectBundle {
  // 1. Generate new asset IDs and build a mapping to rewrite references
  const assetIdMap = new Map<string, string>();
  const processedAssets = newAssets.map((asset) => {
    const newId = crypto.randomUUID();
    assetIdMap.set(asset.id, newId);
    return {
      ...asset,
      id: newId,
      insertedAt: new Date().toISOString(),
    };
  });

  // 2. Rewrite asset references in sections and assign new section IDs
  const processedSections = newSections.map((section, index) => {
    let md = section.markdown;
    assetIdMap.forEach((newId, oldId) => {
      const escapedOld = oldId.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const mdRegex = new RegExp(`(!\\[.*?\\]\\(asset:)${escapedOld}(\\))`, "g");
      md = md.replace(mdRegex, `$1${newId}$2`);

      const htmlRegex = new RegExp(
        `(<img\\s+[^>]*src=["']asset:)${escapedOld}(["'])`,
        "gi"
      );
      md = md.replace(htmlRegex, `$1${newId}$2`);
    });

    return {
      ...section,
      id: crypto.randomUUID(),
      markdown: md,
      order: index,
      status: section.status || "draft",
      revision: 0,
    };
  });

  // 3. Rewrite asset refs in evidence
  const processedEvidence = newEvidence.map((ev) => {
    let url = ev.url;
    assetIdMap.forEach((newId, oldId) => {
      if (url === `asset:${oldId}`) {
        url = `asset:${newId}`;
      }
    });

    return {
      ...ev,
      id: crypto.randomUUID(),
      url,
      createdAt: new Date().toISOString(),
    };
  });

  return {
    ...bundle,
    assets: [...bundle.assets, ...processedAssets],
    evidence: [...bundle.evidence, ...processedEvidence],
    project: {
      ...bundle.project,
      sections: processedSections,
      updatedAt: new Date().toISOString(),
    },
  };
}

const MARKDOWN_EXTENSIONS = [".md", ".markdown", ".mdown", ".mkd"];
const MARKDOWN_MIME_TYPES = ["text/markdown", "text/x-markdown"];

export function isMarkdownFileName(fileName: string): boolean {
  const lower = fileName.trim().toLowerCase();
  return MARKDOWN_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function isMarkdownFile(file: Pick<File, "name" | "type">): boolean {
  const mimeType = file.type.trim().toLowerCase();
  if (mimeType.startsWith("image/")) return false;
  return (
    MARKDOWN_MIME_TYPES.includes(mimeType) || isMarkdownFileName(file.name)
  );
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
    (node) => node.type === "heading" && (node.depth === 1 || node.depth === 2)
  );

  if (heading) {
    const title = flattenNodeText(
      heading as { value?: string; children?: unknown[] }
    ).trim();
    if (title) return title;
  }

  return titleFromMarkdownFileName(fileName);
}

/**
 * Builds the unified ImportDraft. Extracts any inline data-URLs, splits into sections,
 * and normalizes headings/warnings.
 */
export async function buildMarkdownImportDraft(
  fileName: string,
  markdown: string,
  assets: ReportAsset[] = [],
  evidence: EvidenceItem[] = [],
  summary?: {
    totalScanned: number;
    embeddedCount: number;
    missingCount: number;
    missingList: string[];
    warnings: string[];
    resolutions?: AssetResolution[];
  },
  sourceFormat: ImportSourceFormat = "markdown"
): Promise<ImportDraft> {
  // 1. Extract embedded data-URLs
  const cleanPrefix = fileName.replace(/\.[^.]+$/, "");
  const extractResult = await extractEmbeddedAssets(markdown, cleanPrefix);

  // 2. Map summary string warnings to ImportWarning structure
  const summaryWarnings: ImportWarning[] = (summary?.warnings || []).map(
    (msg) => {
      const lower = msg.toLowerCase();
      const code =
        lower.includes("kích thước") || lower.includes("dung lượng")
          ? "image-skipped"
          : "unsupported-element";
      return { code, message: msg };
    }
  );

  const allAssets = [...assets, ...extractResult.assets];
  const allWarnings = [...summaryWarnings, ...extractResult.warnings];

  const normalizedMarkdown = extractResult.markdown.trim();
  const persistedMarkdown = normalizedMarkdown ? `${normalizedMarkdown}\n` : "";

  // Infer title and split into sections
  const title = inferMarkdownTitle(persistedMarkdown, fileName);
  const sections = splitMarkdownIntoSections(persistedMarkdown, title);

  const result: ImportResult = {
    sourceFormat,
    fileName,
    markdown: persistedMarkdown,
    assets: allAssets,
    warnings: allWarnings,
    convertedAt: new Date().toISOString(),
  };

  return {
    result,
    sections,
    mode: "append",
    evidence,
    summary,
  };
}

export type MarkdownFileReadResult =
  | { ok: true; markdown: string; draft: ImportDraft }
  | { ok: false; error: string };

export async function readMarkdownFile(
  file: Pick<File, "name" | "type" | "size" | "text">,
  maxBytes = MAX_MARKDOWN_IMPORT_BYTES
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

    const draft = await buildMarkdownImportDraft(
      file.name || "report.md",
      markdown
    );
    return {
      ok: true,
      markdown,
      draft,
    };
  } catch {
    return { ok: false, error: "Không thể đọc nội dung file Markdown." };
  }
}
