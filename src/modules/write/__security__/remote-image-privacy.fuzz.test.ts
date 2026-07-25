import { describe, expect, it } from "vitest";
import { isRemoteImage, isUnembeddedImage, transformUnembeddedImages } from "../resolve-assets";
import { parseMarkdown } from "@/lib/markdown-pipeline";
import { prepareExport } from "@/modules/export/prepare-export";
import type { ReportProjectBundle } from "@/types";

describe("Remote Image Privacy & CSP Hardening (W25-G)", () => {
  describe("Image Classifier", () => {
    it("correctly identifies remote HTTP/HTTPS images", () => {
      expect(isRemoteImage("https://example.com/tracker.png")).toBe(true);
      expect(isRemoteImage("http://tracker.com/pixel.gif")).toBe(true);
      expect(isRemoteImage("data:image/png;base64,iVBORw0KGgo=")).toBe(false);
      expect(isRemoteImage("asset:img123")).toBe(false);
      expect(isRemoteImage("local/path.png")).toBe(false);
    });

    it("does not classify resolved data/blob or remote images as unembedded local images", () => {
      expect(isUnembeddedImage("data:image/png;base64,123", [])).toBe(false);
      expect(isUnembeddedImage("https://example.com/image.png", [])).toBe(false);
      expect(isUnembeddedImage("asset:valid", [{ id: "valid" }])).toBe(false);
      expect(isUnembeddedImage("asset:missing", [])).toBe(true);
      expect(isUnembeddedImage("local.png", [])).toBe(true);
    });
  });

  describe("AST Privacy Consent Placeholder", () => {
    it("transforms remote HTTP(S) image nodes into privacy consent placeholders by default", () => {
      const ast = parseMarkdown("![Tracker Image](https://example.com/tracker.png)");
      transformUnembeddedImages(ast, []);

      const jsonStr = JSON.stringify(ast);
      expect(jsonStr).toContain("ws-preview-image-remote");
      expect(jsonStr).toContain("load-remote-image");
      expect(jsonStr).toContain("🛡️ [Ảnh từ nguồn ngoài — Chưa tải]");
    });

    it("attaches no-referrer and crossorigin attributes when allowRemote is explicitly true", () => {
      const ast = parseMarkdown("![Remote Image](https://example.com/image.png)");
      transformUnembeddedImages(ast, [], { allowRemote: true });

      const jsonStr = JSON.stringify(ast);
      expect(jsonStr).toContain("no-referrer");
      expect(jsonStr).toContain("anonymous");
      expect(jsonStr).not.toContain("ws-preview-image-remote");
    });
  });

  describe("Export Pipeline Privacy Parity", () => {
    it("prepares export for bundle with remote images without stealth network calls", () => {
      const bundle: ReportProjectBundle = {
        schemaVersion: 4,
        project: {
          id: "proj1",
          title: "Test Report",
          templateId: "software-project",
          updatedAt: new Date().toISOString(),
          metadata: {},
          sections: [
            {
              id: "sec1",
              title: "Section 1",
              order: 0,
              markdown: "![Remote](https://example.com/test.png)",
              status: "done",
              revision: 1,
            },
          ],
        },
        assets: [],
        evidence: [],
        formatSettings: {
          presetId: "academic-default",
          includeToc: false,
          includeListOfFigures: false,
          includeListOfTables: false,
          captionNumbering: "continuous",
        },
      };

      const result = prepareExport(bundle);
      expect(result).toBeDefined();
      expect(result.cover).toBeDefined();
    });
  });
});
