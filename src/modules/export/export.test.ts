import { describe, it, expect } from "vitest";
import { exportHtml, exportPdf, exportDocx, prepareExport } from "./index";
import { createProjectFromTemplate, softwareProjectTemplate } from "@/modules/write";
import type { ReportProjectBundle } from "@/types";

describe("Export Module", () => {
  const bundle = createProjectFromTemplate(softwareProjectTemplate);

  describe("prepareExport", () => {
    it("sorts sections by order and merges metadata", () => {
      const customBundle: ReportProjectBundle = {
        ...bundle,
        project: {
          ...bundle.project,
          metadata: {
            school: "Đại học Bách Khoa",
            course: "Công nghệ phần mềm",
            lecturer: "Nguyễn Văn A",
            members: ["Trần Văn B - 123456", "Lê Văn C - 789012"],
          },
          sections: [
            { id: "sec2", order: 2, title: "Triển khai", markdown: "# Triển khai\nContent 2", status: "draft" },
            { id: "sec1", order: 1, title: "Mở đầu", markdown: "# Mở đầu\nContent 1", status: "draft" },
          ],
        },
      };

      const result = prepareExport(customBundle);
      expect(result.cover.school).toBe("Đại học Bách Khoa");
      expect(result.cover.course).toBe("Công nghệ phần mềm");
      expect(result.cover.lecturer).toBe("Nguyễn Văn A");
      expect(result.cover.members).toEqual(["Trần Văn B - 123456", "Lê Văn C - 789012"]);

      // Verify HAST has been compiled
      expect(result.formatted.hast).toBeDefined();
      expect(result.formatted.toc.length).toBeGreaterThan(0);
    });
  });

  describe("exportHtml", () => {
    it("returns ok:true with a text/html Blob", async () => {
      const result = exportHtml(bundle);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.blob).toBeInstanceOf(Blob);
        expect(result.blob.type).toContain("text/html");
        
        const htmlText = await result.blob.text();
        expect(htmlText).toContain("<!DOCTYPE html>");
        expect(htmlText).toContain(bundle.project.title);
        expect(htmlText).toContain("Mở đầu");
        
        // Check embedded elements
        expect(htmlText).toContain("katex.min.css");
        expect(htmlText).toContain("mermaid@11.15.0");
        expect(htmlText).toContain("ws-toc-container");
      }
    });

    it("sorts sections by order in output html", async () => {
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
        const pos1 = htmlText.indexOf("Content 1");
        const pos2 = htmlText.indexOf("Content 2");
        expect(pos1).toBeGreaterThan(-1);
        expect(pos2).toBeGreaterThan(-1);
        expect(pos1).toBeLessThan(pos2);
      }
    });

    it("escapes user input HTML on cover page and sanitizes markdown body", async () => {
      const maliciousBundle: ReportProjectBundle = {
        ...bundle,
        project: {
          ...bundle.project,
          title: "Malicious <script>alert(1)</script> & Co",
          metadata: {
            school: "School with <span class='dangerous'>tag</span> & details",
          },
          sections: [
            {
              id: "sec1",
              order: 1,
              title: "Header",
              markdown: "Body content with <iframe src=javascript:alert(3)></iframe> and <script>alert(4)</script>",
              status: "draft",
            },
          ],
        },
      };

      const result = exportHtml(maliciousBundle);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const htmlText = await result.blob.text();
        // Check script tag and class span tag text are escaped on cover page
        expect(htmlText).not.toContain("<script>alert(1)</script>");
        expect(htmlText).toContain("Malicious &lt;script&gt;alert(1)&lt;/script&gt; &amp; Co");
        expect(htmlText).not.toContain("class='dangerous'");
        expect(htmlText).toContain("School with &lt;span class=&#039;dangerous&#039;&gt;tag&lt;/span&gt; &amp; details");
        
        // Check markdown body has iframe and script stripped by rehypeSanitize
        const bodyStart = htmlText.indexOf('<div class="report-body">');
        const bodyEnd = htmlText.indexOf('</div>\n\n  <!-- Mermaid');
        const bodyHtml = htmlText.substring(bodyStart, bodyEnd);
        expect(bodyHtml).not.toContain("<iframe");
        expect(bodyHtml).not.toContain("<script");
      }
    });
  });

  describe("exportPdf", () => {
    it("returns ok:false with stage:render-pdf in server environment", () => {
      const result = exportPdf(bundle);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.stage).toBe("render-pdf");
        expect(result.error.message).toContain("client environment");
        expect(result.error.recoverable).toBe(true);
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
