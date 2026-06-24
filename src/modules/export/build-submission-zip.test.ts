import { describe, it, expect } from "vitest";
import { buildSubmissionZip } from "./build-submission-zip";
import JSZip from "jszip";
import type { ReportProjectBundle } from "@/types";

// Create a mock ReportProjectBundle
const mockBundle: ReportProjectBundle = {
  project: {
    id: "test-proj",
    title: "Báo cáo thử nghiệm",
    templateId: "software-project",
    metadata: {
      school: "Đại học Công nghệ",
      members: ["Nguyễn Văn A - 123456", "Trần Thị B - 789012"],
    },
    sections: [
      { id: "sec1", order: 0, title: "Mở đầu", markdown: "Nội dung mở đầu", status: "done" },
    ],
    updatedAt: "2026-06-24T22:00:00.000Z",
  },
  assets: [],
  evidence: [
    { id: "ev1", kind: "github", title: "Mã nguồn", url: "https://github.com", qrEnabled: true, createdAt: "2026" },
    { id: "ev2", kind: "deploy", title: "Trang web", url: "https://deploy.com", qrEnabled: true, createdAt: "2026" },
  ],
  formatSettings: {
    presetId: "academic-default",
    includeToc: true,
    includeListOfFigures: true,
    includeListOfTables: true,
    captionNumbering: "continuous",
  },
  schemaVersion: 1,
};

describe("buildSubmissionZip", () => {
  const htmlBlob = new Blob(["<html>HTML Content</html>"], { type: "text/html" });
  const pdfBlob = new Blob(["%PDF-1.4 PDF Content"], { type: "application/pdf" });
  const docxBlob = new Blob(["DOCX Content"], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });

  it("should generate a complete submission package containing all targets, README, and evidence appendix", async () => {
    const readmeMarkdown = "# Project README";
    const appendixMarkdown = "# Phụ lục minh chứng";

    const result = await buildSubmissionZip({
      bundle: mockBundle,
      exports: {
        html: htmlBlob,
        pdf: pdfBlob,
        docx: docxBlob,
      },
      readmeMarkdown,
      evidenceAppendixMarkdown: appendixMarkdown,
    });

    expect(result).toHaveProperty("manifest");
    expect(result).toHaveProperty("blob");
    expect(result.blob).toBeInstanceOf(Blob);

    // Verify manifest contents
    const manifest = result.manifest;
    expect(manifest.projectTitle).toBe("Báo cáo thử nghiệm");
    expect(manifest.evidenceCount).toBe(2);
    expect(manifest.files).toHaveLength(5);
    expect(manifest.files).toContainEqual({ name: "README.md", target: "readme" });
    expect(manifest.files).toContainEqual({ name: "evidence/appendix.md", target: "evidence" });
    expect(manifest.files).toContainEqual({ name: "report.html", target: "html" });
    expect(manifest.files).toContainEqual({ name: "report.pdf", target: "pdf" });
    expect(manifest.files).toContainEqual({ name: "report.docx", target: "docx" });
    expect(new Date(manifest.generatedAt).getTime()).not.toBeNaN();

    // Load zip and inspect entries
    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    expect(zip.files["README.md"]).toBeDefined();
    expect(zip.files["evidence/appendix.md"]).toBeDefined();
    expect(zip.files["report.html"]).toBeDefined();
    expect(zip.files["report.pdf"]).toBeDefined();
    expect(zip.files["report.docx"]).toBeDefined();
    expect(zip.files["manifest.json"]).toBeDefined();

    // Verify content of entries
    const readmeText = await zip.file("README.md")?.async("string");
    expect(readmeText).toBe(readmeMarkdown);

    const appendixText = await zip.file("evidence/appendix.md")?.async("string");
    expect(appendixText).toBe(appendixMarkdown);

    const manifestText = await zip.file("manifest.json")?.async("string");
    const parsedManifest = JSON.parse(manifestText || "{}");
    expect(parsedManifest.projectTitle).toBe("Báo cáo thử nghiệm");
    expect(parsedManifest.files).toHaveLength(5);
  });

  it("should handle missing targets and omit corresponding entries without throwing", async () => {
    // Only exports docx, and has no README
    const result = await buildSubmissionZip({
      bundle: mockBundle,
      exports: {
        docx: docxBlob,
      },
      evidenceAppendixMarkdown: "# Appendix only",
    });

    expect(result.manifest.files).toHaveLength(2); // Only evidence/appendix.md and report.docx
    expect(result.manifest.files).toContainEqual({ name: "evidence/appendix.md", target: "evidence" });
    expect(result.manifest.files).toContainEqual({ name: "report.docx", target: "docx" });

    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    expect(zip.files["README.md"]).toBeUndefined();
    expect(zip.files["report.html"]).toBeUndefined();
    expect(zip.files["report.pdf"]).toBeUndefined();
    expect(zip.files["report.docx"]).toBeDefined();
    expect(zip.files["evidence/appendix.md"]).toBeDefined();
    expect(zip.files["manifest.json"]).toBeDefined();
  });

  it("should be deterministic for identical inputs, ignoring generatedAt timestamp", async () => {
    const input = {
      bundle: mockBundle,
      exports: {
        html: htmlBlob,
      },
      readmeMarkdown: "# Same README",
      evidenceAppendixMarkdown: "# Same Appendix",
    };

    const package1 = await buildSubmissionZip(input);
    const package2 = await buildSubmissionZip(input);

    const zip1 = await JSZip.loadAsync(await package1.blob.arrayBuffer());
    const zip2 = await JSZip.loadAsync(await package2.blob.arrayBuffer());

    // Get sorted keys
    const keys1 = Object.keys(zip1.files).sort();
    const keys2 = Object.keys(zip2.files).sort();
    expect(keys1).toEqual(keys2);

    // Verify all file contents except manifest.json are identical
    for (const key of keys1) {
      if (key === "manifest.json") {
        const m1 = JSON.parse(await zip1.file(key)?.async("string") || "{}");
        const m2 = JSON.parse(await zip2.file(key)?.async("string") || "{}");
        
        // Remove generatedAt before comparison
        delete m1.generatedAt;
        delete m2.generatedAt;
        expect(m1).toEqual(m2);
      } else {
        const c1 = await zip1.file(key)?.async("uint8array");
        const c2 = await zip2.file(key)?.async("uint8array");
        expect(c1).toEqual(c2);
      }
    }
  });
});
