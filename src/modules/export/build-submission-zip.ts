import JSZip from "jszip";
import type { ExportTarget, PackageManifest, ReportProjectBundle, SubmissionPackage } from "@/types";
import { createVerifiedArtifact, sha256Blob } from "./artifact-verification";

const FILE_NAMES: Record<ExportTarget, string> = {
  html: "report.html",
  pdf: "report.pdf",
  docx: "report.docx",
  pptx: "report.pptx",
};

export async function buildSubmissionZip(input: {
  bundle: ReportProjectBundle;
  exports: Partial<Record<ExportTarget, Blob>>;
  readmeMarkdown: string;
  evidenceAppendixMarkdown: string;
}): Promise<SubmissionPackage> {
  const zip = new JSZip();
  const files: PackageManifest["files"] = [];

  const addText = async (name: string, target: "readme" | "evidence", contents: string) => {
    const blob = new Blob([contents], { type: "text/markdown;charset=utf-8" });
    zip.file(name, contents);
    files.push({
      name,
      target,
      byteLength: blob.size,
      sha256: await sha256Blob(blob),
      mediaType: blob.type,
    });
  };

  if (input.readmeMarkdown) await addText("README.md", "readme", input.readmeMarkdown);
  if (input.evidenceAppendixMarkdown) {
    await addText("evidence/appendix.md", "evidence", input.evidenceAppendixMarkdown);
  }

  for (const target of ["html", "pdf", "docx", "pptx"] as const) {
    const blob = input.exports[target];
    if (!blob) continue;
    const artifact = await createVerifiedArtifact({ target, blob, fileName: FILE_NAMES[target] });
    if (!artifact.verified) throw new Error(`${target.toUpperCase()} artifact has not been verified.`);
    zip.file(FILE_NAMES[target], await artifact.blob.arrayBuffer());
    files.push({
      name: FILE_NAMES[target],
      target,
      byteLength: artifact.byteLength,
      sha256: artifact.sha256,
      mediaType: artifact.mediaType,
    });
  }

  const manifest: PackageManifest = {
    generatedAt: new Date().toISOString(),
    projectTitle: input.bundle.project.title || "Untitled Project",
    files,
    evidenceCount: input.bundle.evidence.length,
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  const blob = await zip.generateAsync({ type: "blob", mimeType: "application/zip" });
  const signature = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  if (signature.join(",") !== "80,75,3,4") throw new Error("Submission package is not a valid ZIP archive.");
  return { manifest, blob };
}
