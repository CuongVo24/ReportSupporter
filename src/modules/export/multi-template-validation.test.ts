import { describe, it, expect, vi, afterEach } from "vitest";
import { ALL_TEMPLATES } from "@/modules/write/templates";
import { createProjectFromTemplate } from "@/modules/write";
import {
  exportHtml,
  exportDocx,
  exportPdfViaBrowserPrint,
  packDocx,
  prepareExport,
  buildPrintableHtml,
} from "./index";
import fs from "fs";
import path from "path";

describe("Multi-Template Export Validation Tests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-expect-error window is not defined on global in node types
    delete global.window;
  });

  const targetTemplates = ALL_TEMPLATES.filter((t) =>
    ["software-project", "lab-report", "internship-report"].includes(t.id)
  );

  const samplesDir = path.resolve(process.cwd(), "Design/Reports/Month3/W12/samples");
  if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
  }

  for (const template of targetTemplates) {
    describe(`Template: ${template.name} (${template.id})`, () => {
      // Create a bundle with metadata to assert cover page parity
      const bundle = createProjectFromTemplate(template, {
        title: `Báo cáo mẫu ${template.name}`,
        metadata: {
          school: "Trường Đại học Bách Khoa Hà Nội",
          course: "Kiểm thử Phần mềm nâng cao",
          lecturer: "TS. Nguyễn Văn A",
          members: ["Nguyễn Văn An - 20261111", "Trần Thị Bình - 20262222"],
          date: "25/06/2026",
        }
      });

      // Inject an image and a table to verify caption numbering (continuous/per-chapter)
      if (bundle.project.sections.length > 0) {
        const firstSec = bundle.project.sections[0];
        firstSec.markdown = `# ${firstSec.title}\n\n![Mô tả hình minh họa](https://example.com/figure.png)\n\nBảng 1: Bảng dữ liệu mẫu kiểm thử\n| Cột 1 | Cột 2 |\n|---|---|\n| Giá trị A | Giá trị B |\n`;
      }

      it("should export to HTML successfully and contain key headers/sections", async () => {
        const result = exportHtml(bundle);
        expect(result.ok).toBe(true);
        if (result.ok) {
          const htmlText = await result.blob.text();
          expect(htmlText).toContain("<!DOCTYPE html>");
          expect(htmlText).toContain(bundle.project.title);

          // Assert Cover Page Parity
          expect(htmlText).toContain("Trường Đại học Bách Khoa Hà Nội");
          expect(htmlText).toContain("TS. Nguyễn Văn A");
          expect(htmlText).toContain("Nguyễn Văn An - 20261111");

          // Assert Page-Break Parity
          expect(htmlText).toContain("class=\"page-break\"");

          // Assert Caption Numbering Parity
          expect(htmlText).toContain("Hình 1: Mô tả hình minh họa");
          expect(htmlText).toContain("Bảng 1: Bảng dữ liệu mẫu kiểm thử");

          // Write actual HTML file for demo evidence
          fs.writeFileSync(path.join(samplesDir, `${template.id}.html`), htmlText);

          // Verify that sections are exported in correct order
          const sortedSections = [...bundle.project.sections].sort((a, b) => a.order - b.order);
          if (sortedSections.length > 0) {
            expect(htmlText).toContain(sortedSections[0].title);
          }
        }
      });

      it("should export to PDF (via browser print) successfully when popup is mocked", async () => {
        // Save printable HTML representation to PDF sample file for testing verification
        const input = prepareExport(bundle);
        const printableHtml = buildPrintableHtml(input);

        // Assert Cover Page Parity in printable HTML
        expect(printableHtml).toContain("Trường Đại học Bách Khoa Hà Nội");
        expect(printableHtml).toContain("TS. Nguyễn Văn A");
        expect(printableHtml).toContain("Nguyễn Văn An - 20261111");

        // Assert Page-Break Parity in printable HTML
        expect(printableHtml).toContain("class=\"page-break\"");

        // Assert Caption Numbering Parity in printable HTML
        expect(printableHtml).toContain("Hình 1: Mô tả hình minh họa");
        expect(printableHtml).toContain("Bảng 1: Bảng dữ liệu mẫu kiểm thử");

        try {
          fs.writeFileSync(path.join(samplesDir, `${template.id}.print.html`), printableHtml);
        } catch (err) {
          console.error("Failed to write PDF HTML preview:", err);
        }

        const mockDocument = {
          open: vi.fn(),
          write: vi.fn(),
          close: vi.fn(),
        };
        const mockOpenedWindow = {
          document: mockDocument,
          focus: vi.fn(),
          print: vi.fn(),
          onload: null,
        };
        const mockWindow = {
          open: vi.fn().mockReturnValue(mockOpenedWindow),
        };
        // @ts-expect-error window is not defined on global in node types
        global.window = mockWindow;

        const result = exportPdfViaBrowserPrint(bundle);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.blob).toBeInstanceOf(Blob);
          expect(result.blob.type).toBe("text/html;charset=utf-8");
        }
      });

      it("should export to DOCX successfully", async () => {
        const result = exportDocx(bundle);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.doc).toBeDefined();

          // Pack and write DOCX file for demo evidence
          const docxBlob = await packDocx(result.doc);
          const arrayBuffer = await docxBlob.arrayBuffer();
          fs.writeFileSync(path.join(samplesDir, `${template.id}.docx`), Buffer.from(arrayBuffer));

          const docJson = JSON.stringify(result.doc);
          
          // Assert Cover Page Parity in DOCX representation
          expect(docJson).toContain("TRƯỜNG ĐẠI HỌC BÁCH KHOA HÀ NỘI");
          expect(docJson).toContain("TS. Nguyễn Văn A");
          expect(docJson).toContain("Nguyễn Văn An - 20261111");

          // Assert Caption Numbering Parity in DOCX representation
          expect(docJson).toContain("Hình 1: Mô tả hình minh họa");
          expect(docJson).toContain("Bảng 1: Bảng dữ liệu mẫu kiểm thử");

          // Verify that template specific elements (metadata title or section titles) are present in DOCX
          const sortedSections = [...bundle.project.sections].sort((a, b) => a.order - b.order);
          if (sortedSections.length > 0) {
            // DOCX output contains the titles in the JSON representation
            expect(docJson).toContain(sortedSections[0].title);
          }
        }
      });
    });
  }
});
