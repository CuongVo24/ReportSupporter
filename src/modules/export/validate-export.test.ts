import { describe, it, expect } from "vitest";
import { validateExport } from "./validate-export";
import type { ReportProjectBundle } from "@/types";

function createTestBundle(sections: { id: string; markdown: string }[], assets: ReportProjectBundle["assets"] = []): ReportProjectBundle {
  return {
    project: {
      id: "proj-1",
      title: "Validation Test Report",
      templateId: "software-project",
      metadata: {},
      sections: sections.map((s, index) => ({
        id: s.id,
        order: index,
        title: `Section ${s.id}`,
        markdown: s.markdown,
        status: "draft",
      })),
      updatedAt: "2026-06-29T00:00:00Z",
    },
    assets,
    evidence: [],
    formatSettings: {
      presetId: "academic-default",
      includeToc: true,
      includeListOfFigures: false,
      includeListOfTables: false,
      captionNumbering: "per-chapter",
    },
    schemaVersion: 1,
  };
}

describe("Pre-export validation gate rules", () => {
  it("should fail validation on non-embeddable images and succeed on data URI or correct assets", () => {
    const bundle = createTestBundle([
      {
        id: "sec-1",
        markdown: `
# Chương 1
![Ảnh chết](Figures/hinh1.png)
![Ảnh dán](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=)
![Ảnh asset đúng](asset:img-ok)
![Ảnh asset hỏng](asset:img-broken)
        `,
      }
    ], [
      { id: "img-ok", kind: "image", data: "base64", fileName: "img.png", mimeType: "image/png" }
    ]);

    const result = validateExport(bundle);
    expect(result.ok).toBe(false); // Fails because of Figures/hinh1.png and asset:img-broken
    const errors = result.issues.filter((i) => i.severity === "error");
    expect(errors).toHaveLength(2);
    expect(errors[0].code).toBe("IMG_NOT_EMBEDDED");
    expect(errors[0].message).toContain("Figures/hinh1.png");
    expect(errors[1].code).toBe("IMG_NOT_EMBEDDED");
    expect(errors[1].message).toContain("asset:img-broken");
  });

  it("should warn on empty headings and heading level jumps", () => {
    const bundle = createTestBundle([
      {
        id: "sec-1",
        markdown: `
# 
### Heading 3 (skipped heading 2)
        `,
      }
    ]);

    const result = validateExport(bundle);
    const warnings = result.issues.filter((i) => i.severity === "warning");
    
    const emptyHeadings = warnings.filter((w) => w.code === "HEADING_EMPTY");
    expect(emptyHeadings).toHaveLength(1);

    const levelJumps = warnings.filter((w) => w.code === "HEADING_LEVEL_JUMP");
    expect(levelJumps).toHaveLength(1);
    expect(levelJumps[0].message).toContain("Nhảy cấp tiêu đề");
  });

  it("should warn on empty captions and invalid Mermaid graphs", () => {
    const bundle = createTestBundle([
      {
        id: "sec-1",
        markdown: `
# Chương 1
![](data:image/png;base64,iVB)

\`\`\`mermaid
invalid syntax graph TD
\`\`\`
        `,
      }
    ]);

    const result = validateExport(bundle);
    const warnings = result.issues.filter((i) => i.severity === "warning");

    const missingCaptions = warnings.filter((w) => w.code === "CAPTION_MISSING");
    expect(missingCaptions).toHaveLength(1);

    const invalidMermaid = warnings.filter((w) => w.code === "MERMAID_INVALID");
    expect(invalidMermaid).toHaveLength(1);
  });
});
