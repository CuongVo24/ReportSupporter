import { describe, expect, it } from "vitest";
import {
  resolveConverter,
  convertImportFile,
  getSupportedExtensions,
  getSupportedFormats,
} from "./registry";

describe("Converter Registry", () => {
  it("resolves markdown converter correctly by extension", () => {
    const file = { name: "test-report.md", type: "" };
    const converter = resolveConverter(file);
    expect(converter).not.toBeNull();
    expect(converter?.format).toBe("markdown");
  });

  it("resolves markdown converter by MIME type if extension is missing/unknown but MIME matches", () => {
    const file = { name: "test-file", type: "text/markdown" };
    const converter = resolveConverter(file);
    expect(converter).not.toBeNull();
    expect(converter?.format).toBe("markdown");
  });

  it("resolves by extension even when MIME is incorrect (extension wins)", () => {
    const file = { name: "test.md", type: "text/plain" };
    const converter = resolveConverter(file);
    expect(converter).not.toBeNull();
    expect(converter?.format).toBe("markdown");
  });

  it("returns correct supported extensions and formats", () => {
    const extensions = getSupportedExtensions();
    expect(extensions).toContain(".md");
    expect(extensions).toContain(".markdown");

    const formats = getSupportedFormats();
    expect(formats).toContain("MARKDOWN");
  });

  it("fails convertImportFile when extension/format is unsupported", async () => {
    const file = new File(["some text"], "test.txt", { type: "text/plain" });
    await expect(convertImportFile(file)).rejects.toThrow("Định dạng file không được hỗ trợ");
  });

  it("fails convertImportFile when file size exceeds maxBytes with file-too-large code", async () => {
    // Mock the size property to avoid allocating 51MB in memory
    const file = {
      name: "large.md",
      type: "text/markdown",
      size: 51 * 1024 * 1024,
      text: async () => "# content",
    } as File;
    
    try {
      await convertImportFile(file);
      expect(true).toBe(false); // Fail the test if it didn't throw
    } catch (err) {
      const errorObj = err as Error & { code?: string };
      expect(errorObj.code).toBe("file-too-large");
      expect(errorObj.message).toContain("vượt quá giới hạn dung lượng");
    }
  });

  it("converts valid markdown file successfully", async () => {
    const file = new File(["# My Markdown Doc\nThis is content."], "doc.md", { type: "text/markdown" });
    const result = await convertImportFile(file);
    expect(result.sourceFormat).toBe("markdown");
    expect(result.fileName).toBe("doc.md");
    expect(result.markdown).toBe("# My Markdown Doc\nThis is content.");
    expect(result.assets).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});
