import { describe, it, expect, beforeAll } from "vitest";
import { createImageAsset } from "./use-image-insert";

describe("createImageAsset", () => {
  beforeAll(() => {
    // Mock FileReader for Node environment
    class MockFileReader {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      result: string = "data:image/png;base64,mockdata";
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 10);
      }
    }
    global.FileReader = MockFileReader as unknown as typeof FileReader;
  });

  it("creates a valid ReportAsset and ref string for an image", async () => {
    const file = {
      name: "avatar.png",
      size: 500 * 1024,
      type: "image/png",
    } as File;

    const result = await createImageAsset(file, 1 * 1024 * 1024);
    
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.asset.kind).toBe("image");
      expect(result.asset.fileName).toBe("avatar.png");
      expect(result.asset.mimeType).toBe("image/png");
      expect(result.asset.data).toBe("data:image/png;base64,mockdata");
      expect(result.ref).toBe(`![avatar.png](asset:${result.asset.id})`);
    }
  });

  it("rejects image files exceeding maxBytes", async () => {
    const file = {
      name: "large.png",
      size: 2 * 1024 * 1024,
      type: "image/png",
    } as File;

    const result = await createImageAsset(file, 1 * 1024 * 1024);
    
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("vượt quá giới hạn dung lượng");
    }
  });

  it("rejects non-image files", async () => {
    const file = {
      name: "document.pdf",
      size: 100 * 1024,
      type: "application/pdf",
    } as File;

    const result = await createImageAsset(file, 1 * 1024 * 1024);
    
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("không phải là ảnh hợp lệ");
    }
  });
});
