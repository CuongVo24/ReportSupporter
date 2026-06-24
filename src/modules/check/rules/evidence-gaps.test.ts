import { describe, expect, it } from "vitest";
import {
  missingProjectLinksRule,
  missingRequiredEvidenceRule,
  brokenEvidenceUrlShapeRule,
} from "./evidence-gaps";
import type { CheckContext, EvidenceItem } from "@/types";
import { parseMarkdown } from "@/lib/markdown-pipeline";
import type { Root as MdastRoot } from "mdast";

const mockCtx = (
  evidence: EvidenceItem[],
  templateId = "software-project",
  markdown = "No links",
  metadata: Record<string, string | string[]> = {}
): CheckContext => {
  const sectionAsts: Record<string, MdastRoot> = {
    sec1: parseMarkdown(markdown),
  };
  return {
    bundle: {
      project: {
        id: "p",
        title: "Test Project",
        templateId,
        metadata,
        sections: [
          {
            id: "sec1",
            order: 1,
            title: "Intro",
            markdown,
            status: "draft",
          },
        ],
        updatedAt: "",
      },
      assets: [],
      evidence,
      formatSettings: {
        presetId: "academic-default",
        includeToc: false,
        includeListOfFigures: false,
        includeListOfTables: false,
        captionNumbering: "continuous",
      },
      schemaVersion: 1,
    },
    sectionAsts,
    templateId,
  };
};

describe("missingRequiredEvidenceRule", () => {
  it("has the canonical rule id and severity (3.Check.md §5.2)", () => {
    expect(missingRequiredEvidenceRule.id).toBe("missing-required-evidence");
    expect(missingRequiredEvidenceRule.severity).toBe("error");
  });

  it("flags missing required evidence kinds defined by template schema", () => {
    const evidence: EvidenceItem[] = [
      { id: "e1", kind: "github", title: "GitHub Link", url: "https://github.com/x", qrEnabled: true, createdAt: "" },
      { id: "e2", kind: "deploy", title: "Deploy Link", url: "https://deploy.com", qrEnabled: true, createdAt: "" },
    ];
    const ctx = mockCtx(evidence, "software-project");
    const issues = missingRequiredEvidenceRule.run(ctx);
    
    // Video is required by software-project, so it should be flagged as missing
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe("missing-required-evidence");
    expect(issues[0].severity).toBe("error");
    expect(issues[0].message).toContain("video");
  });

  it("does not flag if all required kinds are provided", () => {
    const evidence: EvidenceItem[] = [
      { id: "e1", kind: "github", title: "GitHub Link", url: "https://github.com/x", qrEnabled: true, createdAt: "" },
      { id: "e2", kind: "deploy", title: "Deploy Link", url: "https://deploy.com", qrEnabled: true, createdAt: "" },
      { id: "e3", kind: "video", title: "Video Link", url: "https://youtube.com/v", qrEnabled: true, createdAt: "" },
    ];
    const ctx = mockCtx(evidence, "software-project");
    const issues = missingRequiredEvidenceRule.run(ctx);
    expect(issues).toEqual([]);
  });
});

describe("brokenEvidenceUrlShapeRule", () => {
  it("has the canonical rule id and severity (3.Check.md §5.2)", () => {
    expect(brokenEvidenceUrlShapeRule.id).toBe("broken-evidence-url-shape");
    expect(brokenEvidenceUrlShapeRule.severity).toBe("warning");
  });

  it("flags invalid URL shapes without making network requests", () => {
    const evidence: EvidenceItem[] = [
      { id: "e1", kind: "github", title: "Invalid URL", url: "abc", qrEnabled: true, createdAt: "" },
    ];
    const ctx = mockCtx(evidence);
    const issues = brokenEvidenceUrlShapeRule.run(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe("broken-evidence-url-shape");
    expect(issues[0].severity).toBe("warning");
    expect(issues[0].message).toContain("URL");
  });

  it("does not flag valid URL shapes", () => {
    const evidence: EvidenceItem[] = [
      { id: "e1", kind: "github", title: "Valid URL", url: "https://github.com/x", qrEnabled: true, createdAt: "" },
    ];
    const ctx = mockCtx(evidence);
    const issues = brokenEvidenceUrlShapeRule.run(ctx);
    expect(issues).toEqual([]);
  });
});

describe("missingProjectLinksRule", () => {
  it("has the canonical rule id and severity (3.Check.md §5.2)", () => {
    expect(missingProjectLinksRule.id).toBe("missing-project-links");
    expect(missingProjectLinksRule.severity).toBe("error");
  });

  it("flags missing project links for software-project template when none exists", () => {
    const ctx = mockCtx([], "software-project", "No links here.");
    const issues = missingProjectLinksRule.run(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe("missing-project-links");
    expect(issues[0].severity).toBe("error");
  });

  it("does not flag if link is provided in metadata, evidence, or markdown", () => {
    // 1. In metadata key containing keyword
    const ctxMeta = mockCtx([], "software-project", "No links", { sourceUrl: "https://github.com/x" });
    expect(missingProjectLinksRule.run(ctxMeta)).toEqual([]);

    // 2. In evidence kind (github or deploy)
    const evidence: EvidenceItem[] = [
      { id: "e1", kind: "github", title: "Repo", url: "https://github.com/x", qrEnabled: true, createdAt: "" },
    ];
    const ctxEv = mockCtx(evidence, "software-project");
    expect(missingProjectLinksRule.run(ctxEv)).toEqual([]);

    // 3. In Markdown content
    const ctxMd = mockCtx([], "software-project", "Check out our code at https://github.com/x/y.");
    expect(missingProjectLinksRule.run(ctxMd)).toEqual([]);
  });
});
