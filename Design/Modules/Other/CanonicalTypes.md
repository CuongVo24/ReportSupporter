# 📐 CANONICAL TYPES — Single Source of Truth (V1.2)

## W25–W35 canonical type addendum

The executable source remains `src/types`; these additions supersede older examples below:

- `ReportSection.revision: number`; bundle schema v2 migration assigns zero.
- `ProjectSummary`, `ProjectRecord`, `RecoveryItem`, `ProjectPackageManifest` for multi-project persistence and `.rsproject` packages.
- `ExportArtifact` integrity metadata and `ExportJob.artifact`; Print Preview has no job.
- `AiActionGateway.request({ signal, requestId, context, onEvent })`, base project/section/revision/hash/usage, NDJSON events and per-section task states.
- `ImportFileRef`, `AssetResolution`, `OcrResult`, review decisions; asset states `exact | unique-basename | ambiguous | missing`.
- `PipelineRequest/PipelineResponse` echo request ID, project ID and revisions; `TemplateCatalogEntry` bundles template/cover/preset/rubric/checklist.

This document locks the core TypeScript definitions for the entire ReportSupporter application. All code in `src/types/` must conform to these interfaces, and **every module spec references this file instead of re-declaring types** (see import-boundary rules in `Design/Conventions/Coding & Git Standard.md` §4b).

> **Rule:** A type is defined **exactly once** — here. Module specs (`1.Write.md`, `2.Format.md`, `3.Check.md`, `Support.Evidence.md`) and pipeline/contract docs only *cite* these shapes. Changing a shape means editing this file first, then the code.

> **Shared AST imports** (from the `unified` ecosystem, see `Design/Modules/Other/PipelineContract.md`):
> ```ts
> import { Root as MdastRoot } from "mdast";
> import { Root as HastRoot } from "hast";
> ```

---

## 1. Document & Project Model

Represents the core document being edited, formatted, and exported.

```ts
/**
 * A section of a report document.
 * `order` drives numbering / navigator / export merge.
 * `status` is the core authoring state machine (Rule.md §4).
 */
export type ReportSection = {
  id: string;
  order: number;
  title: string;
  markdown: string;
  status: "draft" | "review" | "done";
};

/**
 * The core project information.
 */
export type ReportProject = {
  id: string;
  title: string;
  templateId: string;
  metadata: Record<string, string | string[]>; // school, class, members, etc.
  sections: ReportSection[];
  updatedAt: string; // ISO 8601
};

/**
 * An asset (e.g., image) embedded inside the report.
 * Stored as a base64 data URL for offline-safe usage (no cloud).
 */
export type ReportAsset = {
  id: string;
  kind: "image";
  fileName: string;
  mimeType: string; // "image/png" | "image/jpeg" | ...
  data: string;     // base64 data URL
  insertedAt: string; // ISO 8601
};

/**
 * Snippet kinds inserted into the editor by the asset menu (Module 1).
 */
export type SnippetKind = "image" | "table" | "code" | "math" | "mermaid" | "callout";
```

---

## 2. Evidence Model

Standardized evidence items (Evidence Kit — `Design/Modules/Support.Evidence.md`).

```ts
export type EvidenceKind =
  | "video"
  | "github"
  | "deploy"
  | "drive"
  | "figma"
  | "account"
  | "api-docs"
  | "slide"
  | "other"; // 8 common kinds + "other" fallback = 9 total

export type EvidenceItem = {
  id: string;
  kind: EvidenceKind;
  title: string;
  url?: string;
  note?: string;
  qrEnabled: boolean;
  createdAt: string; // ISO 8601
};
```

---

## 3. Format Model

Layout preset + per-project format settings + TOC/caption outputs.
Matches `Design/Modules/2.Format.md` §3.2.

```ts
/**
 * Academic layout preset applied at render time.
 */
export type FormatPreset = {
  id: string;            // "academic-default" | "tnr-13" | ...
  page: "A4";            // MVP is A4 only
  margin: { top: string; right: string; bottom: string; left: string }; // cm/mm
  fontFamily: string;    // "Times New Roman"
  fontSizePt: 13 | 14;
  lineHeight: number;    // 1.5
  bodyAlign: "justify" | "left";
  chapterStartsNewPage: boolean; // page-break before each chapter (h1)
  captionNumbering: "continuous" | "per-chapter"; // "Hình 1" vs "Hình 1.1"
  header?: string;       // e.g. "{title}"
  footer?: string;       // e.g. "Trang {page} / {pages}"
};

/**
 * Per-project format settings (chosen preset + document-level toggles).
 */
export type FormatSettings = {
  presetId: string;
  includeToc: boolean;
  includeListOfFigures: boolean;
  includeListOfTables: boolean;
  captionNumbering: "continuous" | "per-chapter";
};

/**
 * TOC node generated from numbered headings.
 */
export type TocNode = {
  id: string;            // anchor slug, e.g. "1-1-kien-truc" (see lib/slugify)
  number: string;        // "1.1"
  text: string;          // "Kiến trúc hệ thống"
  level: number;         // 1..6 (h1..h6)
  sectionId: string;     // ReportSection containing this heading
  children: TocNode[];   // hierarchical tree
};

/**
 * Numbered figure/table caption entry.
 */
export type CaptionEntry = {
  id: string;            // anchor for cross-reference
  kind: "figure" | "table";
  number: number;        // running number (continuous or per-chapter)
  label: string;         // "Hình 1", "Bảng 2"
  text: string;          // caption description
  sectionId: string;
};
```

---

## 4. Bundle Model

The complete wrapper persisted to IndexedDB and passed to Check/Export/Present.

```ts
export type ReportProjectBundle = {
  project: ReportProject;
  assets: ReportAsset[];
  evidence: EvidenceItem[];
  formatSettings: FormatSettings;
  schemaVersion: number; // for migration when shape changes
};
```

---

## 5. Template Schema (Locked)

Used by the template picker to spawn report skeletons and metadata inputs.

```ts
export type MetadataFieldSpec = {
  key: string;                // "school" | "members" | ...
  label: string;
  type: "text" | "textList";  // textList → string[] (e.g. member list)
  required: boolean;
  placeholder?: string;
};

export type TemplateSectionSeed = {
  title: string;              // "Mở đầu" — never hard-code "1. ..."
  order: number;
  starterMarkdown: string;    // sample/starter content; headings carry no chapter number
  status: "draft";            // every generated section starts "draft"
};

export type TemplateSchema = {
  id: string;                       // "software-project" | "lab-report" | ...
  name: string;                     // shown in template picker
  description: string;
  metadataFields: MetadataFieldSpec[];
  sections: TemplateSectionSeed[];
  requiredSections: string[];       // template-aware Check (titles required)
  requiredEvidenceKinds: EvidenceKind[]; // Evidence Kit requirements
  requiresToc: boolean;             // pairs with FormatSettings.includeToc
};
```

---

## 6. Checker Model

Used by the pre-submit checker to report quality issues and compute scores.
Matches `Design/Modules/3.Check.md` §3.2.

```ts
export type ReportIssueSeverity = "error" | "warning" | "info";

export type ReportIssue = {
  id: string;            // checker rule id, e.g. "missing-references" (user-visible prefix)
  severity: ReportIssueSeverity;
  module: "write" | "format" | "check" | "export" | "import"; // "import" added in V1.2 (Phase 5 / W21)
  message: string;
  suggestion: string;
  sectionId?: string;
  line?: number;
};

/**
 * A single rule in the checker engine.
 * `detect` is an array so composite rules can declare e.g. ["ast", "meta"].
 */
export type CheckRule = {
  id: string;
  severity: ReportIssueSeverity;
  detect: ("ast" | "text" | "meta")[]; // AST node / plain text / bundle metadata
  run: (ctx: CheckContext) => ReportIssue[];
};

/**
 * Context passed to every rule (parsed once, shared across rules).
 */
export type CheckContext = {
  bundle: ReportProjectBundle;
  formatted?: FormattedReport;
  sectionAsts: Record<string /* sectionId */, MdastRoot>; // parse-once cache
  templateId: string;
};

/**
 * Aggregate result of running the whole engine.
 */
export type CheckResult = {
  issues: ReportIssue[];
  grouped: {
    error: ReportIssue[];
    warning: ReportIssue[];
    info: ReportIssue[];
  };
  readinessScore: number; // 0..100 (see 3.Check.md §5.3)
  ranAt: string;          // ISO 8601
};
```

---

## 7. Pipeline Model

Shared AST structures (defined here; runtime semantics — caching & worker boundary — in `Design/Modules/Other/PipelineContract.md`).

```ts
/**
 * A single section parsed into AST.
 */
export type ParsedSection = {
  sectionId: string;
  markdown: string;
  ast: MdastRoot;         // mdast Root from remark-parse
  updatedAt: string;      // ISO 8601
};

/**
 * Output of the orchestrator after merging and parsing all sections.
 */
export type PipelineResult = {
  projectId: string;
  sections: ParsedSection[];
  combinedMdast: MdastRoot;
  updatedAt: string;      // ISO 8601
};

/**
 * The fully formatted and numbered report.
 * Generated by Format, consumed by Check and Export.
 */
export type FormattedReport = {
  projectId: string;
  toc: TocNode[];
  figures: CaptionEntry[];
  tables: CaptionEntry[];
  preset: FormatPreset;
  hast: HastRoot;         // for HTML/PDF rendering (Module 4)
  mdast: MdastRoot;       // formatted nodes for DOCX rendering (Module 4)
};
```

---

## 8. Export Model

Used to track the state and results of file generation.

```ts
export type ExportTarget = "html" | "pdf" | "docx";

export type ExportStatus = "idle" | "running" | "done" | "error";

export type ExportError = {
  stage: "merge" | "parse" | "format" | "render-html" | "render-pdf" | "render-docx";
  message: string;
  recoverable: boolean;
};

export type ExportResult =
  | { ok: true; blob: Blob }
  | { ok: false; error: ExportError };

export type ExportJob = {
  id: string;
  target: ExportTarget;
  projectId: string;
  status: ExportStatus;
  startedAt: string; // ISO 8601
  finishedAt?: string;
  fileName: string;
  error?: ExportError;
};

export type PackageManifest = {
  generatedAt: string;
  projectTitle: string;
  files: { name: string; target: ExportTarget | "readme" | "evidence" }[];
  evidenceCount: number;
};

export type SubmissionPackage = {
  manifest: PackageManifest;
  blob: Blob;
};

export type SubmissionChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  detail: string;
  severity?: ReportIssueSeverity;
};
```

---

## 9. Present Model

Used by the slide presentation and outline generation systems.

```ts
export type SlideOutline = {
  id: string;
  fromSectionId: string;
  order: number;
  title: string;
  bullets: string[];
  speakerId?: string;
  evidenceRefs: string[];
  brokenEvidenceNotes?: string[];
};

export type PresentationTimeline = {
  totalSeconds: number;
  slots: { slideId: string; speakerId?: string; seconds: number }[];
  overLimit: boolean;
};

export type Speaker = {
  id: string;
  name: string;
  assignedSlideIds: string[];
};

export type SpeakerScript = {
  slideId: string;
  speakerId?: string;
  script: string;
  cues: string[];
};

export type DefenseQA = {
  id: string;
  question: string;
  suggestedAnswer: string;
  relatedSectionId?: string;
  topic: "scope" | "tech" | "result" | "limitation" | "future";
};

export type WeakSectionHint = {
  sectionId: string;
  slideId?: string;
  severity: "error" | "warning" | "info";
  reason: string;
  suggestion: string;
};
```

---

## 10. AI Model

Used by the optional AI assistant layer (Module Write — W11). **Feature flag defaults to OFF**; W1–W10 features do not depend on this.

Design constraints:
- Flag `enabled` is `false` by default (Locked #2).
- `provider` is user-supplied; no SDK is bundled here (Locked #3).
- Client-key strategy: the user supplies a provider key in AI Settings.
- The provider key is kept **in-memory only** (module-level variable in `ai-config.ts`, not `localStorage`) and sent only to `/api/ai` through `x-api-key`; it does not survive a page reload. Only `enabled`/`provider`/`model` persist to `localStorage`. XSS in an open tab can still read the in-memory key, so Markdown sanitize must stay strict.
- No server-env fallback in `/api/ai`; adapter injection pattern remains provider-agnostic (see `ai-gateway.ts`).

```ts
/** The AI operations the assistant can perform. */
export type AiAction = "outline" | "rewrite" | "tone" | "translate" | "terminology";

/** A single AI suggestion, before or after user acceptance. */
export type AiSuggestion = {
  id: string;
  action: AiAction;
  /** Original text sent to AI. */
  original: string;
  /** AI-generated text. Empty string when gateway is disabled/unconfigured. */
  suggestion: string;
  /** Undefined until user explicitly accepts or rejects. */
  accepted?: boolean;
};

/** Feature flag + provider identifier + local client key. */
export type AiConfig = {
  /** Master switch — default false. */
  enabled: boolean;
  /**
   * Provider identifier (e.g. "openai" | "gemini").
   * Meaningful only when enabled === true.
   * No SDK is bundled; adapters are approved separately.
   */
  provider?: string;
  /** Provider API key, in-memory only (never persisted to localStorage); required when enabled. */
  apiKey?: string;
  /** Optional model identifier. */
  model?: string;
};

/**
 * Operational state of the AI gateway at call time.
 * - "ready"        → flag ON + provider + local API key + adapter registered → may send request.
 * - "unconfigured" → flag ON but provider/key/adapter missing → no fetch.
 * - "disabled"     → flag OFF → no fetch (default).
 */
export type GatewayState = "ready" | "unconfigured" | "disabled";
```

---

## 11. Import Model (V1.2 — Phase 5 / W21-W24)

Used by Module 6 — Import (`Design/Modules/6.Import.md`): universal import PDF/DOCX/XLSX/PPTX → Markdown.
Mọi converter chạy **client-side**; output là **Markdown text + `ReportAsset[]`** — import **không bao giờ** tự sinh mdast
(Markdown import re-enter pipeline chuẩn qua `remark-parse`, xem `PipelineContract.md` §4).

```ts
/** Source formats the universal import accepts. "markdown" là đường .md hiện có, refactor vào registry ở W21. */
export type ImportSourceFormat = "markdown" | "docx" | "pdf" | "xlsx" | "pptx";

/** Machine-readable warning codes — mỗi converter phải dùng code chuẩn, không tự chế string. */
export type ImportWarningCode =
  | "unsupported-element"  // SmartArt/chart/OLE... bị bỏ qua
  | "scanned-page"         // trang PDF không có text layer (OCR experimental — W24)
  | "table-flattened"      // bảng không tái tạo được → flatten thành text
  | "sheet-truncated"      // sheet vượt row cap
  | "image-skipped"        // ảnh không trích được / vượt giới hạn
  | "heading-guessed"      // heading suy ra từ heuristic (font-size / OCR), cần user xác nhận
  | "file-too-large";      // vượt maxBytes của converter

export type ImportWarning = {
  code: ImportWarningCode;
  message: string;         // human-readable, tiếng Việt
  location?: string;       // "page 3" | "sheet Data" | "slide 5"
};

/** Kết quả thuần của một converter — chưa gắn vào project. */
export type ImportResult = {
  sourceFormat: ImportSourceFormat;
  fileName: string;
  markdown: string;
  assets: ReportAsset[];   // ảnh nhúng → base64 data URL (§1)
  warnings: ImportWarning[];
  convertedAt: string;     // ISO 8601
};

/** Một converter đăng ký vào registry (Module 6). Route theo extension + MIME, extension thắng khi MIME rỗng/sai. */
export type ImportConverter = {
  format: ImportSourceFormat;
  extensions: string[];    // [".docx"]
  mimeTypes: string[];
  maxBytes: number;        // per-format cap (mặc định 50MB — MAX_MARKDOWN_IMPORT_BYTES)
  convert: (file: File) => Promise<ImportResult>;
};

/**
 * Draft trình cho user duyệt trước khi commit vào bundle (preview diff — W24).
 * Thay thế/absorb `MarkdownImportDraft` (type cục bộ W-trước tại `src/modules/write/markdown-import.ts`) — W21 reconcile.
 */
export type ImportDraft = {
  result: ImportResult;
  sections: ReportSection[];  // đề xuất split theo heading; id sinh lại khi commit
  mode: "append" | "replace";
  issues?: ReportIssue[];     // Check engine chạy trên draft (module: "import") — W24
};
```


