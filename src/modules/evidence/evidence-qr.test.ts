import { describe, it, expect } from "vitest";
import { toQrDataUrl } from "./evidence-qr";
import { prepareExport } from "@/modules/export/prepare-export";
import type { ReportProjectBundle } from "@/types";

describe("toQrDataUrl", () => {
  it("generates a valid base64 PNG data URL for a valid URL", async () => {
    const dataUrl = await toQrDataUrl("https://github.com/CuongVo24/ReportSupporter");
    expect(dataUrl).toContain("data:image/png;base64,");
    expect(dataUrl.length).toBeGreaterThan(100);
  });

  it("returns empty string for empty or whitespace URL", async () => {
    expect(await toQrDataUrl("")).toBe("");
    expect(await toQrDataUrl("   ")).toBe("");
    // @ts-expect-error - testing invalid JS inputs
    expect(await toQrDataUrl(null)).toBe("");
  });
});

describe("Export QR translation", () => {
  it("translates placeholder spans to image nodes in prepareExport", () => {
    const mockBundle: ReportProjectBundle = {
      schemaVersion: 1,
      project: {
        id: "proj1",
        title: "Test Report",
        templateId: "software",
        metadata: {},
        sections: [
          {
            id: "sec1",
            order: 1,
            title: "Introduction",
            markdown: "Introduction text",
            status: "draft",
          },
        ],
        updatedAt: "2026-06-24T00:00:00Z",
      },
      assets: [],
      formatSettings: {
        presetId: "academic-default",
        includeToc: false,
        includeListOfFigures: false,
        includeListOfTables: false,
        captionNumbering: "per-chapter",
      },
      evidence: [
        {
          id: "ev1",
          kind: "github",
          title: "Repo link",
          url: "https://github.com/CuongVo24/ReportSupporter",
          qrEnabled: true,
          createdAt: "2026-06-24T00:00:00Z",
        },
      ],
    };

    const qrDataUrls = {
      "https://github.com/CuongVo24/ReportSupporter": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    };

    const exportInput = prepareExport(mockBundle, qrDataUrls);
    
    // The appendix should be generated and parsed
    const mdastString = JSON.stringify(exportInput.formatted.mdast);
    
    // Expect the GFM table to be generated and the placeholder span replaced with an image node
    expect(mdastString).toContain('"type":"image"');
    expect(mdastString).toContain('"url":"data:image/png;base64,iVBORw0KGgoAAAANS..."');
    expect(mdastString).toContain('"alt":"QR: https://github.com/CuongVo24/ReportSupporter"');
  });
});
