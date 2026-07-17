import { z } from "zod";
import { reportAssetSchema, reportSectionSchema, evidenceItemSchema } from "./schemas";
import type { ReportAsset, ReportSection, ReportIssue, EvidenceItem } from "@/types";

/** Source formats the universal import accepts. "markdown" là đường .md hiện có, refactor vào registry ở W21. */
export const importSourceFormatSchema = z.enum(["markdown", "docx", "pdf", "xlsx", "pptx"]);
export type ImportSourceFormat = z.infer<typeof importSourceFormatSchema>;

/** Machine-readable warning codes — mỗi converter phải dùng code chuẩn, không tự chế string. */
export const importWarningCodeSchema = z.enum([
  "unsupported-element",  // SmartArt/chart/OLE... bị bỏ qua
  "scanned-page",         // trang PDF không có text layer (OCR experimental — W24)
  "table-flattened",      // bảng không tái tạo được → flatten thành text
  "sheet-truncated",      // sheet vượt row cap
  "image-skipped",        // ảnh không trích được / vượt giới hạn
  "heading-guessed",      // heading suy ra từ heuristic (font-size / OCR), cần user xác nhận
  "file-too-large",       // vượt maxBytes của converter
]);
export type ImportWarningCode = z.infer<typeof importWarningCodeSchema>;

export const importWarningSchema = z.object({
  code: importWarningCodeSchema,
  message: z.string(),         // human-readable, tiếng Việt
  location: z.string().optional(),       // "page 3" | "sheet Data" | "slide 5"
});
export type ImportWarning = z.infer<typeof importWarningSchema>;

/** Kết quả thuần của một converter — chưa gắn vào project. */
export const importResultSchema = z.object({
  sourceFormat: importSourceFormatSchema,
  fileName: z.string(),
  markdown: z.string(),
  assets: z.array(reportAssetSchema),   // ảnh nhúng → base64 data URL (§1)
  warnings: z.array(importWarningSchema),
  convertedAt: z.string(),     // ISO 8601
});

export type ImportResult = {
  sourceFormat: ImportSourceFormat;
  fileName: string;
  markdown: string;
  assets: ReportAsset[];
  warnings: ImportWarning[];
  convertedAt: string; // ISO 8601
};

/** Một converter đăng ký vào registry (Module 6). Route theo extension + MIME, extension thắng khi MIME rỗng/sai. */
export type ImportConverter = {
  format: ImportSourceFormat;
  extensions: string[];    // [".docx"]
  mimeTypes: string[];
  maxBytes: number;        // per-format cap (mặc định 50MB — MAX_MARKDOWN_IMPORT_BYTES)
  convert: (
    file: File,
    onProgress?: (progress: number) => void,
    abortSignal?: AbortSignal,
  ) => Promise<ImportResult>;
};

// Zod schema for ReportIssue used inside ImportDraft
export const reportIssueSchema = z.object({
  id: z.string(),
  severity: z.enum(["error", "warning", "info"]),
  module: z.enum(["write", "format", "check", "export", "import"]),
  message: z.string(),
  suggestion: z.string(),
  sectionId: z.string().optional(),
  line: z.number().optional(),
});

/**
 * Draft trình cho user duyệt trước khi commit vào bundle (preview diff — W24).
 * Thay thế/absorb `MarkdownImportDraft` (type cục bộ W-trước tại `src/modules/write/markdown-import.ts`) — W21 reconcile.
 */
export const importDraftSchema = z.object({
  result: importResultSchema,
  sections: z.array(reportSectionSchema),  // đề xuất split theo heading; id sinh lại khi commit
  mode: z.enum(["append", "replace"]),
  issues: z.array(reportIssueSchema).optional(),     // Check engine chạy trên draft (module: "import") — W24
  summary: z.object({
    totalScanned: z.number(),
    embeddedCount: z.number(),
    missingCount: z.number(),
    missingList: z.array(z.string()),
    warnings: z.array(z.string()),
  }).optional(),
  evidence: z.array(evidenceItemSchema).optional(),
});

export type ImportDraft = {
  result: ImportResult;
  sections: ReportSection[];
  mode: "append" | "replace";
  issues?: ReportIssue[];
  file?: File;
  summary?: {
    totalScanned: number;
    embeddedCount: number;
    missingCount: number;
    missingList: string[];
    warnings: string[];
  };
  evidence?: EvidenceItem[];
};

export type OcrProgress = {
  status: string;
  progress: number;
};
