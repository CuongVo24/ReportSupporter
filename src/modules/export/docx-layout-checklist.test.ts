import { describe, it, expect, vi } from "vitest";
import { verifyDocxLayout } from "./docx-layout-checklist";
import { createProjectFromTemplate, softwareProjectTemplate } from "@/modules/write";
import type { ReportProjectBundle, FormattedReport } from "@/types";
import * as prepareExportModule from "./prepare-export";
import type { Root as MdastRoot, Content as MdastContent } from "mdast";

describe("verifyDocxLayout", () => {
  it("should pass checks on a standard software project template", () => {
    const bundle = createProjectFromTemplate(softwareProjectTemplate);
    const checks = verifyDocxLayout(bundle);

    expect(checks).toBeInstanceOf(Array);
    
    const sizeCheck = checks.find((c) => c.id === "page-setup-size");
    const marginsCheck = checks.find((c) => c.id === "page-setup-margins");
    const hierarchyCheck = checks.find((c) => c.id === "heading-hierarchy");
    const parityCheck = checks.find((c) => c.id === "caption-numbering-parity");
    const tableFormatCheck = checks.find((c) => c.id === "table-format");
    const pageBreaksCheck = checks.find((c) => c.id === "chapter-page-breaks");

    expect(sizeCheck?.ok).toBe(true);
    expect(marginsCheck?.ok).toBe(true);
    expect(hierarchyCheck?.ok).toBe(true);
    expect(parityCheck?.ok).toBe(true);
    expect(tableFormatCheck?.ok).toBe(true);
    expect(pageBreaksCheck?.ok).toBe(true);
  });

  it("should fail heading hierarchy check when headings skip levels", () => {
    const bundle = createProjectFromTemplate(softwareProjectTemplate);
    if (bundle.project.sections[0]) {
      bundle.project.sections[0].markdown = "# Chapter 1\n\n### Skip to H3";
    }

    const checks = verifyDocxLayout(bundle);
    const hierarchyCheck = checks.find((c) => c.id === "heading-hierarchy");
    expect(hierarchyCheck?.ok).toBe(false);
    expect(hierarchyCheck?.detail).toContain("Nhảy cấp tiêu đề");
  });

  it("should identify custom margins and verify them correctly", () => {
    const bundle = createProjectFromTemplate(softwareProjectTemplate);
    bundle.formatSettings.presetId = "custom";
    const customBundle: ReportProjectBundle = {
      ...bundle,
      formatSettings: {
        ...bundle.formatSettings,
        presetId: "custom",
      },
    };

    const checks = verifyDocxLayout(customBundle);
    const marginsCheck = checks.find((c) => c.id === "page-setup-margins");
    expect(marginsCheck?.ok).toBe(true);
  });

  it("should fail caption parity check when a loose prefix match would false-pass", () => {
    const bundle = createProjectFromTemplate(softwareProjectTemplate);
    
    // Spy on prepareExport to inject a controlled mdast and registry
    const mockReturn = {
      bundle: {} as unknown as ReportProjectBundle,
      cover: null,
      formatted: {
        projectId: "test",
        toc: [],
        hast: { type: "root", children: [] } as unknown as FormattedReport["hast"],
        mdast: {
          type: "root",
          children: [
            {
              type: "paragraph",
              children: [{ type: "text", value: "Hình 12: Alt 12" }],
              data: { hProperties: { className: "fig-caption" } },
            } as unknown as MdastContent,
          ],
        } as unknown as MdastRoot,
        preset: { page: "A4" } as unknown as FormattedReport["preset"],
        figures: [
          {
            id: "fig-1",
            kind: "figure",
            number: 1,
            label: "Hình 1",
            text: "Alt 12",
            sectionId: "default",
          },
        ],
        tables: [],
      } as unknown as FormattedReport,
    };

    const spy = vi.spyOn(prepareExportModule, "prepareExport").mockReturnValue(
      mockReturn as unknown as ReturnType<typeof prepareExportModule.prepareExport>
    );

    try {
      const checks = verifyDocxLayout(bundle);
      const parityCheck = checks.find((c) => c.id === "caption-numbering-parity");
      expect(parityCheck?.ok).toBe(false);
      expect(parityCheck?.detail).toContain("Thiếu nhãn caption cho Hình 1");
    } finally {
      spy.mockRestore();
    }
  });
});
