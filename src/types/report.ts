// Document/project/checker types — see Design/Modules/Other/CanonicalTypes.md §1, §4, §6.
import type { EvidenceItem } from "./evidence";
import type { FormatSettings } from "./format";

export type ReportSection = {
  id: string;
  order: number;
  title: string;
  markdown: string;
  status: "draft" | "review" | "done";
};

export type ReportProject = {
  id: string;
  title: string;
  templateId: string;
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
  module: "write" | "format" | "check" | "export";
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

