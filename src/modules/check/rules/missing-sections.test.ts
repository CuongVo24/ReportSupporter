import { describe, it, expect } from "vitest";
import { runChecker } from "../run-checker";
import { DEFAULT_FORMAT_SETTINGS } from "@/types";
import type { ReportProjectBundle } from "@/types";

describe("Missing Sections Check Rules (Template-Aware)", () => {
  // Helper to create a base mock bundle
  const createMockBundle = (templateId: string, sections: { title: string, markdown: string }[]): ReportProjectBundle => ({
    project: {
      id: "proj-1",
      title: "Báo cáo test",
      templateId,
      metadata: {
        school: "Trường Đại học",
        members: ["Nguyễn Văn A"],
      },
      sections: sections.map((s, idx) => ({
        id: `sec-${idx}`,
        order: idx,
        title: s.title,
        markdown: s.markdown,
        status: "draft",
      })),
      updatedAt: new Date().toISOString(),
    },
    assets: [],
    evidence: [],
    formatSettings: {
      ...DEFAULT_FORMAT_SETTINGS,
      includeToc: true,
    },
    schemaVersion: 1,
  });

  describe("toc-disabled rule", () => {
    it("should trigger toc-disabled for software-project when includeToc is false", () => {
      const bundle = createMockBundle("software-project", [{ title: "Mở đầu", markdown: "# Mở đầu\n" }]);
      bundle.formatSettings.includeToc = false; // software-project requires TOC
      const result = runChecker(bundle);
      expect(result.issues.some(i => i.id === "toc-disabled")).toBe(true);
    });

    it("should NOT trigger toc-disabled for lab-report when includeToc is false", () => {
      const bundle = createMockBundle("lab-report", [{ title: "Mở đầu", markdown: "# Mở đầu\n" }]);
      bundle.formatSettings.includeToc = false; // lab-report does not require TOC
      const result = runChecker(bundle);
      expect(result.issues.some(i => i.id === "toc-disabled")).toBe(false);
    });

    it("should trigger toc-disabled for internship-report when includeToc is false", () => {
      const bundle = createMockBundle("internship-report", [{ title: "Mở đầu", markdown: "# Mở đầu\n" }]);
      bundle.formatSettings.includeToc = false; // internship-report requires TOC
      const result = runChecker(bundle);
      expect(result.issues.some(i => i.id === "toc-disabled")).toBe(true);
    });
  });

  describe("missing-conclusion rule", () => {
    it("should trigger missing-conclusion for software-project when Conclusion section is missing", () => {
      const bundle = createMockBundle("software-project", [
        { title: "Mở đầu", markdown: "# Mở đầu\n" },
      ]);
      const result = runChecker(bundle);
      expect(result.issues.some(i => i.id === "missing-conclusion")).toBe(true);
    });

    it("should NOT trigger missing-conclusion for software-project when Conclusion section is present", () => {
      const bundle = createMockBundle("software-project", [
        { title: "Mở đầu", markdown: "# Mở đầu\n" },
        { title: "Kết luận", markdown: "# Kết luận\nĐúc kết kết quả.\n" },
      ]);
      const result = runChecker(bundle);
      expect(result.issues.some(i => i.id === "missing-conclusion")).toBe(false);
    });

    it("should NOT trigger missing-conclusion for internship-report even when Conclusion heading is missing", () => {
      const bundle = createMockBundle("internship-report", [
        { title: "Tổng quan về Công ty", markdown: "# Tổng quan về Công ty\n" },
      ]);
      // internship-report does NOT require "Kết luận"
      const result = runChecker(bundle);
      expect(result.issues.some(i => i.id === "missing-conclusion")).toBe(false);
    });
  });

  describe("missing-references rule", () => {
    it("should trigger missing-references for software-project when References section is missing", () => {
      const bundle = createMockBundle("software-project", [
        { title: "Mở đầu", markdown: "# Mở đầu\n" },
      ]);
      const result = runChecker(bundle);
      expect(result.issues.some(i => i.id === "missing-references")).toBe(true);
    });

    it("should NOT trigger missing-references for software-project when References section is present", () => {
      const bundle = createMockBundle("software-project", [
        { title: "Mở đầu", markdown: "# Mở đầu\n" },
        { title: "Tài liệu tham khảo", markdown: "# Tài liệu tham khảo\n1. Sách A\n" },
      ]);
      const result = runChecker(bundle);
      expect(result.issues.some(i => i.id === "missing-references")).toBe(false);
    });

    it("should NOT trigger missing-references for internship-report even when References heading is missing", () => {
      const bundle = createMockBundle("internship-report", [
        { title: "Tổng quan về Công ty", markdown: "# Tổng quan về Công ty\n" },
      ]);
      // internship-report requiredSections are: "Tổng quan về Công ty", "Nội dung Công việc", "Tự đánh giá", "Đánh giá của người hướng dẫn"
      // "Tài liệu tham khảo" is in sections but NOT in requiredSections.
      const result = runChecker(bundle);
      expect(result.issues.some(i => i.id === "missing-references")).toBe(false);
    });
  });

  describe("missing-member-table rule", () => {
    it("should trigger missing-member-table for software-project if no table is present", () => {
      const bundle = createMockBundle("software-project", [
        { title: "Mở đầu", markdown: "# Mở đầu\n" },
      ]);
      const result = runChecker(bundle);
      expect(result.issues.some(i => i.id === "missing-member-table")).toBe(true);
    });

    it("should NOT trigger missing-member-table for software-project if a GFM table is present", () => {
      const bundle = createMockBundle("software-project", [
        { title: "Mở đầu", markdown: "# Mở đầu\n" },
        { title: "Phân công", markdown: "| Thành viên | Vai trò |\n|---|---|\n| Sinh viên A | Dev |\n" },
      ]);
      const result = runChecker(bundle);
      expect(result.issues.some(i => i.id === "missing-member-table")).toBe(false);
    });

    it("should NOT trigger missing-member-table for individual template (with no members textList spec)", () => {
      const bundle = createMockBundle("individual-report", [
        { title: "Mở đầu", markdown: "# Mở đầu\n" },
      ]);
      const result = runChecker(bundle);
      expect(result.issues.some(i => i.id === "missing-member-table")).toBe(false);
    });
  });

  describe("Idempotency / Deterministic behavior", () => {
    it("should yield identical issues on multiple runs with the same input", () => {
      const bundle = createMockBundle("software-project", [
        { title: "Mở đầu", markdown: "# Mở đầu\n" },
      ]);
      const run1 = runChecker(bundle);
      const run2 = runChecker(bundle);
      expect(run1.issues).toEqual(run2.issues);
    });
  });
});
