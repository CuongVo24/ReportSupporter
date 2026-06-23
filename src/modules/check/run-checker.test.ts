import { describe, it, expect, vi, beforeEach } from "vitest";
import { runChecker } from "./run-checker";
import * as pipeline from "@/lib/markdown-pipeline";
import type { ReportProjectBundle } from "@/types";

describe("runChecker Engine Core & Rules", () => {
  let baseBundle: ReportProjectBundle;

  beforeEach(() => {
    vi.restoreAllMocks();
    baseBundle = {
      project: {
        id: "p1",
        title: "Báo cáo thử nghiệm",
        templateId: "software-project", // registers with requiresToc=true, requiredSections, and requiredEvidence
        metadata: {
          school: "Trường Công nghệ",
          members: ["Nguyễn Văn A", "Trần Văn B"],
          github: "https://github.com/myuser/myrepo",
          demo: "https://my-demo.com",
        },
        sections: [
          {
            id: "s1",
            order: 1,
            title: "Mở đầu",
            markdown: "# Mở đầu\nGiới thiệu dự án ở đây.",
            status: "draft" as const,
          },
          {
            id: "s2",
            order: 2,
            title: "Kết luận",
            markdown: "# Kết luận\nĐúc kết kết quả đạt được.",
            status: "draft" as const,
          },
          {
            id: "s3",
            order: 3,
            title: "Tài liệu tham khảo",
            markdown: "# Tài liệu tham khảo\n1. Tài liệu tham chiếu A.",
            status: "draft" as const,
          },
        ],
        updatedAt: new Date().toISOString(),
      },
      assets: [],
      evidence: [
        { id: "e1", kind: "github" as const, title: "Repo", url: "https://github.com/myuser/myrepo", qrEnabled: true, createdAt: "" },
        { id: "e2", kind: "video" as const, title: "Video", url: "https://youtube.com/watch?v=123", qrEnabled: true, createdAt: "" },
        { id: "e3", kind: "deploy" as const, title: "Deploy", url: "https://my-demo.com", qrEnabled: true, createdAt: "" },
      ],
      formatSettings: {
        presetId: "academic-default",
        includeToc: true,
        includeListOfFigures: false,
        includeListOfTables: false,
        captionNumbering: "continuous",
      },
      schemaVersion: 1,
    };
  });

  it("should parse each section exactly once (parse-once cache rule)", () => {
    const parseSpy = vi.spyOn(pipeline, "parseMarkdown");
    runChecker(baseBundle);
    // baseBundle has 3 sections. parseMarkdown must be called exactly 3 times
    expect(parseSpy).toHaveBeenCalledTimes(3);
  });

  it("should return identical issues on multiple runs (idempotency)", () => {
    const res1 = runChecker(baseBundle);
    const res2 = runChecker(baseBundle);
    expect(res1.issues).toEqual(res2.issues);
    expect(res1.grouped).toEqual(res2.grouped);
    expect(res1.readinessScore).toBe(res2.readinessScore);
  });

  it("should compute readinessScore based on severity issue counts", () => {
    // baseBundle is missing a member allocation table -> triggers warning (-5)
    // 100 - 5 = 95
    const res = runChecker(baseBundle);
    expect(res.readinessScore).toBe(95);

    // Make an error (e.g. remove Conclusion section) -> -15 error, -5 warning -> score 80
    const badBundle = {
      ...baseBundle,
      project: {
        ...baseBundle.project,
        sections: baseBundle.project.sections.filter((s) => s.id !== "s2"),
      },
    };
    const resBad = runChecker(badBundle);
    expect(resBad.issues.some((i) => i.id === "missing-conclusion")).toBe(true);
    expect(resBad.readinessScore).toBe(80);
  });

  it("should trigger toc-disabled if includeToc is false", () => {
    const badBundle = {
      ...baseBundle,
      formatSettings: {
        ...baseBundle.formatSettings,
        includeToc: false,
      },
    };
    const res = runChecker(badBundle);
    expect(res.issues.some((i) => i.id === "toc-disabled")).toBe(true);
  });

  it("should trigger missing-conclusion and missing-references if absent", () => {
    const badBundle = {
      ...baseBundle,
      project: {
        ...baseBundle.project,
        sections: [
          { id: "s1", order: 1, title: "Giới thiệu", markdown: "# Hello\nContent without conclusion/references", status: "draft" as const }
        ],
      },
    };
    const res = runChecker(badBundle);
    expect(res.issues.some((i) => i.id === "missing-conclusion")).toBe(true);
    expect(res.issues.some((i) => i.id === "missing-references")).toBe(true);
  });

  it("should trigger missing-member-table for software-project templates if no tables present", () => {
    const res = runChecker(baseBundle);
    expect(res.issues.some((i) => i.id === "missing-member-table")).toBe(true);

    // Adding a table inside any section should satisfy this rule
    const goodBundle = {
      ...baseBundle,
      project: {
        ...baseBundle.project,
        sections: [
          ...baseBundle.project.sections,
          {
            id: "s4",
            order: 4,
            title: "Đội ngũ",
            markdown: "| Thành viên | Vai trò |\n|---|---|\n| Nguyễn Văn A | Trưởng nhóm |",
            status: "draft" as const,
          },
        ],
      },
    };
    const resGood = runChecker(goodBundle);
    expect(resGood.issues.some((i) => i.id === "missing-member-table")).toBe(false);
  });

  it("should trigger missing-project-links for software projects if missing in metadata and AST", () => {
    const badBundle = {
      ...baseBundle,
      project: {
        ...baseBundle.project,
        metadata: {
          school: "Trường",
        },
        sections: [
          { id: "s1", order: 1, title: "Body", markdown: "# Body\nNo links whatsoever.", status: "draft" as const },
        ],
      },
    };
    const res = runChecker(badBundle);
    expect(res.issues.some((i) => i.id === "missing-project-links")).toBe(true);

    // Non-software template should skip this rule
    const labBundle = {
      ...badBundle,
      project: {
        ...badBundle.project,
        templateId: "lab-report",
      },
    };
    const resLab = runChecker(labBundle);
    expect(resLab.issues.some((i) => i.id === "missing-project-links")).toBe(false);
  });

  it("should trigger missing-required-evidence if template required kind is missing from evidence array", () => {
    const badBundle = {
      ...baseBundle,
      evidence: [], // requires github, video, deploy
    };
    const res = runChecker(badBundle);
    expect(res.issues.some((i) => i.id === "missing-required-evidence")).toBe(true);
  });

  it("should trigger broken-evidence-url-shape if url syntax is invalid", () => {
    const badBundle = {
      ...baseBundle,
      evidence: [
        { id: "e1", kind: "github" as const, title: "Git", url: "not-an-url-at-all", qrEnabled: true, createdAt: "" },
      ],
    };
    const res = runChecker(badBundle);
    expect(res.issues.some((i) => i.id === "broken-evidence-url-shape")).toBe(true);
  });
});
