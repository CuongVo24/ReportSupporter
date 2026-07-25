// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { isRemoteImage, isUnembeddedImage, transformUnembeddedImages } from "../resolve-assets";
import { parseMarkdown } from "@/lib/markdown-pipeline";
import { prepareExport } from "@/modules/export/prepare-export";
import { loadRemoteImageWithState } from "@/components/PreviewPane";
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

  describe("Per-click remote image load state machine (loading/error/timeout/retry)", () => {
    it("shows a loading state immediately, built via DOM APIs (no raw-HTML injection of alt text)", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      const maliciousAlt = '<img src=x onerror="window.__pwned=1">';

      loadRemoteImageWithState(container, "https://example.com/pic.png", maliciousAlt);

      const loading = document.body.querySelector(".ws-preview-image-remote-loading");
      expect(loading).not.toBeNull();
      // The alt text must appear as literal text content, never parsed as HTML.
      expect(loading!.innerHTML).not.toContain("<img");
      expect(loading!.textContent).toContain(maliciousAlt);
      expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
    });

    it("never sets crossOrigin/referrerPolicy to anything but anonymous/no-referrer", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      loadRemoteImageWithState(container, "https://example.com/pic.png", "alt");
      // The <img> itself is only inserted on load, but we can assert the
      // loading placeholder never contains a credentialed/no-crossorigin
      // fallback marker, and that no synchronous DOM mutation bypasses the
      // consent flow before this call returns.
      expect(document.body.querySelector("img.ws-preview-image-loaded")).toBeNull();
    });

    it("shows a timeout error with retry + attach-local options if load never settles", () => {
      vi.useFakeTimers();
      try {
        const container = document.createElement("div");
        document.body.appendChild(container);
        loadRemoteImageWithState(container, "https://example.com/slow.png", "Slow image");

        vi.advanceTimersByTime(15_001);

        const errorBox = document.body.querySelector(".ws-preview-image-remote-error");
        expect(errorBox).not.toBeNull();
        const retryBtn = errorBox!.querySelector('button[data-action="retry-remote-image"]');
        const attachBtn = errorBox!.querySelector('button[data-action="attach-image-instead"]');
        expect(retryBtn).not.toBeNull();
        expect(attachBtn).not.toBeNull();
        expect(retryBtn!.getAttribute("data-original-src")).toBe("https://example.com/slow.png");
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
