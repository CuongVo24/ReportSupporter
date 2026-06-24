import { describe, it, expect, vi, afterEach } from "vitest";
import { exportPdfViaBrowserPrint, renderPdfWithPuppeteer, exportPdf } from "./export-pdf";
import { createProjectFromTemplate, softwareProjectTemplate } from "@/modules/write";

describe("export-pdf", () => {
  const bundle = createProjectFromTemplate(softwareProjectTemplate);

  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-expect-error window is not defined on global in node types
    delete global.window;
  });

  describe("exportPdfViaBrowserPrint", () => {
    it("should return a recoverable error when running in server-side/no-window environment", () => {
      // Ensure window is undefined
      // @ts-expect-error window is not defined on global in node types
      delete global.window;

      const result = exportPdfViaBrowserPrint(bundle);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.stage).toBe("render-pdf");
        expect(result.error.message).toContain("client environment");
        expect(result.error.recoverable).toBe(true);
      }
    });

    it("should return a recoverable error when browser popup is blocked", () => {
      // Mock client environment with a blocked popup window.open returning null
      const mockWindow = {
        open: vi.fn().mockReturnValue(null),
      };
      // @ts-expect-error window is not defined on global in node types
      global.window = mockWindow;

      const result = exportPdfViaBrowserPrint(bundle);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.stage).toBe("render-pdf");
        expect(result.error.message).toContain("Popup blocked");
        expect(result.error.recoverable).toBe(true);
      }
      expect(mockWindow.open).toHaveBeenCalledWith("", "_blank");
    });

    it("should successfully trigger browser print when popup window opens", () => {
      const mockDocument = {
        open: vi.fn(),
        write: vi.fn(),
        close: vi.fn(),
      };
      const mockOpenedWindow = {
        document: mockDocument,
        focus: vi.fn(),
        print: vi.fn(),
        onload: null as ((this: Window, ev: Event) => unknown) | null,
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

      expect(mockWindow.open).toHaveBeenCalledWith("", "_blank");
      expect(mockDocument.open).toHaveBeenCalled();
      expect(mockDocument.write).toHaveBeenCalled();
      expect(mockDocument.close).toHaveBeenCalled();
    });
  });

  describe("renderPdfWithPuppeteer", () => {
    it("should return a non-recoverable stub error", () => {
      const result = renderPdfWithPuppeteer(bundle);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.stage).toBe("render-pdf");
        expect(result.error.message).toContain("Puppeteer hardening disabled");
        expect(result.error.recoverable).toBe(false);
      }
    });
  });

  describe("exportPdf alias", () => {
    it("should point to exportPdfViaBrowserPrint", () => {
      // In no-window, it should behave like exportPdfViaBrowserPrint
      const result = exportPdf(bundle);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.stage).toBe("render-pdf");
        expect(result.error.recoverable).toBe(true);
      }
    });
  });
});
