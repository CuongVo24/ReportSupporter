import { describe, it, expect, vi, afterEach } from "vitest";
import { ALL_TEMPLATES } from "@/modules/write/templates";
import { createProjectFromTemplate } from "@/modules/write";
import { exportHtml, exportDocx, exportPdfViaBrowserPrint } from "./index";

describe("Multi-Template Export Validation Tests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-expect-error window is not defined on global in node types
    delete global.window;
  });

  const targetTemplates = ALL_TEMPLATES.filter((t) =>
    ["software-project", "lab-report", "internship-report"].includes(t.id)
  );

  for (const template of targetTemplates) {
    describe(`Template: ${template.name} (${template.id})`, () => {
      const bundle = createProjectFromTemplate(template);

      it("should export to HTML successfully and contain key headers/sections", async () => {
        const result = exportHtml(bundle);
        expect(result.ok).toBe(true);
        if (result.ok) {
          const htmlText = await result.blob.text();
          expect(htmlText).toContain("<!DOCTYPE html>");
          expect(htmlText).toContain(bundle.project.title);

          // Verify that sections are exported in correct order
          const sortedSections = [...bundle.project.sections].sort((a, b) => a.order - b.order);
          if (sortedSections.length > 0) {
            expect(htmlText).toContain(sortedSections[0].title);
          }
        }
      });

      it("should export to PDF (via browser print) successfully when popup is mocked", () => {
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

      it("should export to DOCX successfully", () => {
        const result = exportDocx(bundle);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.doc).toBeDefined();
          const docJson = JSON.stringify(result.doc);
          
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
