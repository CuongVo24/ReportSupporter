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
