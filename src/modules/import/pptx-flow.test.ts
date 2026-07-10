// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { convertImportFile } from "./registry";
import * as fs from "fs";
import * as path from "path";

describe("PPTX Import Flow Snapshot and Verification", () => {
  const fixturesDir = path.join(__dirname, "__fixtures__");

  it("should process defense-ppt.pptx successfully and verify slide headings, nested lists, and notes", async () => {
    const filePath = path.join(fixturesDir, "defense-ppt.pptx");
    const buf = fs.readFileSync(filePath);
    const file = new File([buf], "defense-ppt.pptx", {
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });

    const result = await convertImportFile(file);

    expect(result.sourceFormat).toBe("pptx");
    expect(result.fileName).toBe("defense-ppt.pptx");
    expect(result.markdown).toMatchSnapshot();

    // Verify content components from snapshot
    expect(result.markdown).toContain("## Slide 1");
    expect(result.markdown).toContain("- Tiêu đề Slide 1");
    expect(result.markdown).toContain("- Ý 1 cấp 0");
    expect(result.markdown).toContain("  - Ý 1.1 cấp 1");
    expect(result.markdown).toContain("    - Ý 1.1.1 cấp 2");
    expect(result.markdown).toContain("> Ghi chú slide 1 - Mở đầu");
  });

  it("should process defense-gslides.pptx successfully and match equivalent output content", async () => {
    const filePath = path.join(fixturesDir, "defense-gslides.pptx");
    const buf = fs.readFileSync(filePath);
    const file = new File([buf], "defense-gslides.pptx", {
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });

    const result = await convertImportFile(file);

    expect(result.sourceFormat).toBe("pptx");
    expect(result.fileName).toBe("defense-gslides.pptx");
    expect(result.markdown).toMatchSnapshot();

    // Verify equivalents
    expect(result.markdown).toContain("## Slide 1");
    expect(result.markdown).toContain("- Tiêu đề Slide 1");
    expect(result.markdown).toContain("> Ghi chú slide 1 - Mở đầu");
  });
});
