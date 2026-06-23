import { describe, it, expect } from "vitest";
import { exportHtml, exportPdf, exportDocx } from "./index";
import { createProjectFromTemplate, softwareProjectTemplate } from "@/modules/write";
import type { ReportProjectBundle } from "@/types";

describe("Export Module Stubs", () => {
  // Generate a realistic project bundle for testing
  const bundle = createProjectFromTemplate(softwareProjectTemplate);

  describe("exportHtml", () => {
    it("returns ok:true with a text/html Blob", async () => {
      const result = exportHtml(bundle);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.blob).toBeInstanceOf(Blob);
        expect(result.blob.type).toContain("text/html");
        
        // Read blob content to check HTML structure
        const htmlText = await result.blob.text();
        expect(htmlText).toContain("<!DOCTYPE html>");
        expect(htmlText).toContain(bundle.project.title);
        expect(htmlText).toContain("Thông tin dự án");
        
        // Verify sections are present
        bundle.project.sections.forEach(sec => {
          const escapedTitle = sec.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          expect(htmlText).toContain(escapedTitle);
        });
      }
    });

    it("sorts sections by order", async () => {
      // Create a bundle with sections out of order
      const outOfOrderBundle: ReportProjectBundle = {
        ...bundle,
        project: {
          ...bundle.project,
          sections: [
            { id: "sec2", order: 2, title: "Section 2", markdown: "Content 2", status: "draft" },
            { id: "sec1", order: 1, title: "Section 1", markdown: "Content 1", status: "draft" },
          ],
        },
      };

      const result = exportHtml(outOfOrderBundle);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const htmlText = await result.blob.text();
        const pos1 = htmlText.indexOf("Section 1");
        const pos2 = htmlText.indexOf("Section 2");
        expect(pos1).toBeGreaterThan(-1);
        expect(pos2).toBeGreaterThan(-1);
        expect(pos1).toBeLessThan(pos2);
      }
    });

    it("escapes user input HTML correctly to prevent markup injection", async () => {
      const maliciousBundle: ReportProjectBundle = {
        ...bundle,
        project: {
          ...bundle.project,
          title: "Malicious <script>alert(1)</script> & Co",
          metadata: {
            "Custom Field": "Value with <span class='dangerous'>tag</span> & details",
          },
          sections: [
            {
              id: "sec1",
              order: 1,
              title: "Header <img src=x onerror=alert(2)>",
              markdown: "Body content with <iframe src=javascript:alert(3)></iframe>",
              status: "draft",
            },
          ],
        },
      };

      const result = exportHtml(maliciousBundle);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const htmlText = await result.blob.text();
        // Check script, img, iframe, span tag text are escaped and not raw tags
        expect(htmlText).not.toContain("<script>");
        expect(htmlText).toContain("Malicious &lt;script&gt;alert(1)&lt;/script&gt; &amp; Co");
        expect(htmlText).not.toContain("<span");
        expect(htmlText).toContain("Value with &lt;span class=&#039;dangerous&#039;&gt;tag&lt;/span&gt; &amp; details");
        expect(htmlText).not.toContain("<img");
        expect(htmlText).toContain("Header &lt;img src=x onerror=alert(2)&gt;");
        expect(htmlText).not.toContain("<iframe");
        expect(htmlText).toContain("Body content with &lt;iframe src=javascript:alert(3)&gt;&lt;/iframe&gt;");
      }
    });
  });

  describe("exportPdf", () => {
    it("returns ok:false with stage:render-pdf and not implemented message", () => {
      const result = exportPdf(bundle);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.stage).toBe("render-pdf");
        expect(result.error.message).toContain("not implemented until W4");
        expect(result.error.recoverable).toBe(false);
      }
    });
  });

  describe("exportDocx", () => {
    it("returns ok:false with stage:render-docx and not implemented message", () => {
      const result = exportDocx(bundle);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.stage).toBe("render-docx");
        expect(result.error.message).toContain("not implemented until W4");
        expect(result.error.recoverable).toBe(false);
      }
    });
  });
});
