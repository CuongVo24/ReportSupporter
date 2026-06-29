import { describe, it, expect, vi, afterEach } from "vitest";
import { exportPdfViaBrowserPrint, renderPdfWithPuppeteer, exportPdf } from "./export-pdf";
import { createProjectFromTemplate, softwareProjectTemplate } from "@/modules/write";

describe("export-pdf", () => {
  const bundle = createProjectFromTemplate(softwareProjectTemplate);

  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-expect-error window is not defined on global in node types
    delete global.window;
    // @ts-expect-error document is not defined on global in node types
    delete global.document;
  });

  describe("exportPdfViaBrowserPrint", () => {
    it("should return a recoverable error when running in server-side/no-window environment", async () => {
      // Ensure window is undefined
      // @ts-expect-error window is not defined on global in node types
      delete global.window;

      const result = await exportPdfViaBrowserPrint(bundle);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.stage).toBe("render-pdf");
        expect(result.error.message).toContain("client environment");
        expect(result.error.recoverable).toBe(true);
      }
    });

    it("should successfully trigger browser print through a hidden iframe", async () => {
      // Mock global window
      global.window = {} as unknown as typeof window;

      const mockIframeDoc = {
        open: vi.fn(),
        write: vi.fn(),
        close: vi.fn(),
        head: {
          appendChild: vi.fn(),
        },
        querySelectorAll: vi.fn().mockReturnValue([]),
        title: "",
      };

      const mockIframe = {
        style: {},
        contentWindow: {
          document: mockIframeDoc,
          focus: vi.fn(),
          print: vi.fn(),
        },
      };

      const mockCreateElement = vi.fn().mockImplementation((tag) => {
        if (tag === "iframe") return mockIframe;
        return {};
      });

      const mockQuerySelectorAll = vi.fn().mockReturnValue([]);

      // Mock global document
      global.document = {
        createElement: mockCreateElement,
        querySelectorAll: mockQuerySelectorAll,
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
        },
      } as unknown as typeof document;

      const result = await exportPdfViaBrowserPrint(bundle);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.blob).toBeInstanceOf(Blob);
        expect(result.blob.type).toBe("text/html;charset=utf-8");
      }

      expect(mockCreateElement).toHaveBeenCalledWith("iframe");
      expect(mockIframeDoc.open).toHaveBeenCalled();
      expect(mockIframeDoc.write).toHaveBeenCalled();
      expect(mockIframeDoc.close).toHaveBeenCalled();
      expect(mockIframe.contentWindow.print).toHaveBeenCalled();
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
    it("should point to exportPdfViaBrowserPrint", async () => {
      // In no-window, it should behave like exportPdfViaBrowserPrint
      const result = await exportPdf(bundle);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.stage).toBe("render-pdf");
        expect(result.error.recoverable).toBe(true);
      }
    });
  });
});
