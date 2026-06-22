# 📐 CANONICAL TYPES — Single Source of Truth (V1.0)

This document locks the core TypeScript definitions for the entire ReportSupporter application. All code implementations in `src/types/` must conform to these interfaces to prevent type drift between modules.

---

## 1. Document & Project Model

Represents the core document being edited, formatted, and exported.

```ts
/**
 * A section of a report document.
 */
export type ReportSection = {
  id: string;
  title: string;
  markdown: string;
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
 */
export type ReportAsset = {
  id: string;
  kind: "image";
  fileName: string;
  mimeType: string;
  dataUrl: string; // base64 representation for offline usage
  createdAt: string; // ISO 8601
};

/**
 * Standardized Evidence Item (Submission MVP / Phase 2).
 */
export type EvidenceKind = 
  | "video" 
  | "github" 
  | "deploy" 
  | "drive" 
  | "figma" 
  | "account" 
  | "api-docs" 
  | "slide" 
  | "other";

export type EvidenceItem = {
  id: string;
  kind: EvidenceKind;
  title: string;
  url?: string;
  note?: string;
  qrEnabled: boolean;
  createdAt: string; // ISO 8601
};

/**
 * Format Settings (A4 presets).
 */
export type FormatPreset = {
  id: string;
  name: string;
  fontFamily: string;
  fontSizeBody: string; // pt
  lineHeight: number;
  textAlign: "left" | "justify";
  marginTopBottomMm: number;
  marginLeftRightMm: number;
};

/**
 * The complete wrapper representing a report project bundle.
 * Passed to Export and local storage.
 */
export type ReportProjectBundle = {
  project: ReportProject;
  assets: ReportAsset[];
  evidence: EvidenceItem[];
  formatPreset: FormatPreset;
  schemaVersion: number;
};
```

---

## 2. Template Schema (Locked)

Used by the template picker to spawn report skeletons and metadata inputs.

```ts
export type TemplateMetadataFieldType = "text" | "select" | "multiselect" | "date";

export type TemplateMetadataField = {
  id: string;
  label: string;
  type: TemplateMetadataFieldType;
  required: boolean;
  options?: string[]; // Used for select/multiselect
};

export type TemplateSectionSeed = {
  title: string;
  markdown: string; // Default skeleton text
};

export type ReportTemplate = {
  id: string;
  name: string;
  description: string;
  metadataFields: TemplateMetadataField[];
  defaultSections: TemplateSectionSeed[];
  requiredSections: string[]; // List of titles required in the report
  requiredEvidence?: EvidenceKind[]; // List of evidence kinds required in the submission
  defaultFormatPresetId: string;
};
```

---

## 3. Checker Model

Used by the pre-submit checker to report quality issues and compute scores.

```ts
export type ReportIssueSeverity = "error" | "warning" | "info";

export type ReportIssue = {
  id: string;
  severity: ReportIssueSeverity;
  module: "write" | "format" | "check" | "export";
  message: string;
  suggestion: string;
  sectionId?: string;
  line?: number;
};

export type CheckerResult = {
  issues: ReportIssue[];
  readinessScore: number; // 0 to 100
};
```

---

## 4. Export Model

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
```
