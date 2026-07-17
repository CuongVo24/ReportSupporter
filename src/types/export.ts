// Export types - see Design/Modules/Other/CanonicalTypes.md §8
import type { ReportIssueSeverity } from "./report";

export type ExportTarget = "html" | "pdf" | "docx" | "pptx";

export type ExportStatus = "idle" | "running" | "done" | "error";

export type ExportError = {
  stage: "merge" | "parse" | "format" | "render-html" | "render-pdf" | "render-docx" | "render-pptx";
  message: string;
  recoverable: boolean;
};

export type ExportArtifact = {
  target: ExportTarget;
  blob: Blob;
  mediaType: string;
  fileName: string;
  byteLength: number;
  sha256: string;
  generatedAt: string;
  verified: boolean;
};
export type ExportArtifactMetadata = Omit<ExportArtifact, "blob">;

export type ExportResult =
  | { ok: true; artifact: ExportArtifact; blob: Blob }
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
  artifact?: ExportArtifactMetadata;
  phase?: "preparing" | "rendering-assets" | "ready" | "printing";
};

export type PackageManifest = {
  generatedAt: string;
  projectTitle: string;
  files: {
    name: string;
    target: ExportTarget | "readme" | "evidence";
    byteLength: number;
    sha256: string;
    mediaType: string;
  }[];
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
