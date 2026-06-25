import JSZip from "jszip";
import type { ReportProjectBundle, ExportTarget, SubmissionPackage, PackageManifest } from "@/types";

/**
 * Builds a submission package (evidence.zip) containing exported documents, README,
 * evidence appendix markdown, and a manifest.json file detailing the contents.
 * All file packing happens on the client using JSZip.
 * 
 * @param input Input exports, metadata bundle, README and evidence appendix strings.
 */
export async function buildSubmissionZip(input: {
  bundle: ReportProjectBundle;
  exports: Partial<Record<ExportTarget, Blob>>;
  readmeMarkdown?: string | null;
  evidenceAppendixMarkdown?: string | null;
}): Promise<SubmissionPackage> {
  const zip = new JSZip();
  const files: { name: string; target: ExportTarget | "readme" | "evidence" }[] = [];

  // 1. Add README.md if provided
  if (input.readmeMarkdown !== undefined && input.readmeMarkdown !== null) {
    zip.file("README.md", input.readmeMarkdown);
    files.push({ name: "README.md", target: "readme" });
  }

  // 2. Add evidence/appendix.md if provided
  if (input.evidenceAppendixMarkdown !== undefined && input.evidenceAppendixMarkdown !== null) {
    zip.file("evidence/appendix.md", input.evidenceAppendixMarkdown);
    files.push({ name: "evidence/appendix.md", target: "evidence" });
  }

  // 3. Add exported targets if provided
  const exportsMap = input.exports || {};
  if (exportsMap.html) {
    const buffer = await exportsMap.html.arrayBuffer();
    zip.file("report.html", buffer);
    files.push({ name: "report.html", target: "html" });
  }

  if (exportsMap.pdf) {
    const buffer = await exportsMap.pdf.arrayBuffer();
    zip.file("report.pdf", buffer);
    files.push({ name: "report.pdf", target: "pdf" });
  }

  if (exportsMap.docx) {
    const buffer = await exportsMap.docx.arrayBuffer();
    zip.file("report.docx", buffer);
    files.push({ name: "report.docx", target: "docx" });
  }

  // 4. Build manifest.json
  const manifest: PackageManifest = {
    generatedAt: new Date().toISOString(),
    projectTitle: input.bundle.project?.title || "Untitled Project",
    files,
    evidenceCount: input.bundle.evidence ? input.bundle.evidence.length : 0,
  };

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  // 5. Generate package Blob
  const blob = await zip.generateAsync({ type: "blob" });

  return {
    manifest,
    blob,
  };
}
