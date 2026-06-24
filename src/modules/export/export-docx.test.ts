import { describe, it, expect } from "vitest";
import { Document } from "docx";
import { exportDocx, packDocx } from "./export-docx";
import { createProjectFromTemplate, softwareProjectTemplate } from "@/modules/write";

describe("export-docx Document Builder & Packer", () => {
  const bundle = createProjectFromTemplate(softwareProjectTemplate);

  it("should synchronously build a valid Document", () => {
    const result = exportDocx(bundle);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.doc).toBeInstanceOf(Document);
      const doc = result.doc as unknown as { documentWrapper: unknown };
      expect(doc.documentWrapper).toBeDefined();
    }
  });

  it("should asynchronously pack the Document into a valid ZIP Blob", async () => {
    const buildRes = exportDocx(bundle);
    expect(buildRes.ok).toBe(true);
    
    if (buildRes.ok) {
      const blob = await packDocx(buildRes.doc);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
      
      // Verify ZIP/DOCX binary signature ("PK\x03\x04")
      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer.slice(0, 4));
      
      // PK signature bytes: P = 80, K = 75, \x03 = 3, \x04 = 4
      expect(bytes[0]).toBe(80);
      expect(bytes[1]).toBe(75);
      expect(bytes[2]).toBe(3);
      expect(bytes[3]).toBe(4);
    }
  });

  it("should output cover page without '\\n' in any TextRun text and split members to individual lines", () => {
    const bundleWithMembers = JSON.parse(JSON.stringify(bundle));
    bundleWithMembers.project.metadata = {
      lecturer: "Prof. John Doe",
      members: ["Alice Smith", "Bob Jones", "Charlie Brown"],
    };

    const result = exportDocx(bundleWithMembers);
    expect(result.ok).toBe(true);

    if (result.ok) {
      const docJsonStr = JSON.stringify(result.doc);
      
      expect(docJsonStr).toContain("Prof. John Doe");
      expect(docJsonStr).toContain("Alice Smith");
      expect(docJsonStr).toContain("Bob Jones");
      expect(docJsonStr).toContain("Charlie Brown");

      expect(docJsonStr).not.toContain("Prof. John Doe\\n");
      expect(docJsonStr).not.toContain("Alice Smith\\n");
      expect(docJsonStr).not.toContain("Thành viên thực hiện:\\n");
    }
  });
});
