// Document/project/checker types — see Design/Modules/Other/CanonicalTypes.md §1, §4, §6.
import type { EvidenceItem } from "./evidence";
import type { FormatSettings } from "./format";

export type ReportSection = {
  id: string;
  order: number;
  title: string;
  markdown: string;
  status: "draft" | "review" | "done";
  /** Monotonic content version used to reject stale async results. */
  revision: number;
};

export type ReportProject = {
  id: string;
  title: string;
  templateId: string;
  /**
   * Explicit lifecycle marker for the first-run project setup flow.
   * Legacy persisted projects are normalized to `complete` during loading.
   */
  initializationState?: "pending" | "complete";
  metadata: Record<string, string | string[]>;
  sections: ReportSection[];
  updatedAt: string; // ISO 8601
};

export type ReportAsset = {
  id: string;
  kind: "image";
  fileName: string;
  mimeType: string;
  data: string; // base64 data URL
  insertedAt: string; // ISO 8601
};

export type SnippetKind = "image" | "table" | "code" | "math" | "mermaid" | "callout";

export type ReportIssueSeverity = "error" | "warning" | "info";

export type ReportIssue = {
  id: string; // checker rule id (user-visible prefix)
  severity: ReportIssueSeverity;
  module: "write" | "format" | "check" | "export" | "import";
  message: string;
  suggestion: string;
  sectionId?: string;
  line?: number;
};

export type ReportProjectBundle = {
  project: ReportProject;
  assets: ReportAsset[];
  evidence: EvidenceItem[];
  formatSettings: FormatSettings;
  schemaVersion: number;
};

export type ProjectSummary = {
  id: string;
  title: string;
  templateId: string;
  sectionCount: number;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
  deletedAt?: string;
};

export type ProjectRecord = {
  summary: ProjectSummary;
  bundle: ReportProjectBundle;
};

export type RecoveryItemKind = "invalid-draft" | "orphaned-snapshot" | "autosave-error";

export type RecoveryItem = {
  id: string;
  kind: RecoveryItemKind;
  projectId?: string;
  title: string;
  detail: string;
  createdAt: string;
  payload?: unknown;
};

export type ProjectPackageManifest = {
  format: "report-supporter-project";
  version: 1;
  projectId: string;
  exportedAt: string;
  includesSnapshots: boolean;
  files: Array<{ path: string; byteLength: number; sha256: string }>;
};

// --- Checker types verbatim from CanonicalTypes.md §6 ---
import type { Root as MdastRoot } from "mdast";
import type { FormattedReport } from "./pipeline";

/**
 * A single rule in the checker engine.
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
  readinessScore: number; // 0..100
  ranAt: string;          // ISO 8601
};
