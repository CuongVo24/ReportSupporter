import { describe, it, expect } from "vitest";
import { verifyDocxLayout } from "./docx-layout-checklist";
import { createProjectFromTemplate, softwareProjectTemplate } from "@/modules/write";
import type { ReportProjectBundle } from "@/types";

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
});
