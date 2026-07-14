import { describe, it, expect } from "vitest";
import { resolveAssetRefs, isUnembeddedImage, transformUnembeddedImages } from "./resolve-assets";
import type { ReportAsset } from "@/types";
import { renderMarkdown } from "../../lib/markdown-pipeline";

describe("resolveAssetRefs", () => {
  const assets: ReportAsset[] = [
    {
      id: "a1",
      kind: "image",
      fileName: "test.png",
      mimeType: "image/png",
      data: "data:image/png;base64,iVBORw0KGgoAAAANS",
      insertedAt: "2026-06-23T12:00:00Z",
    },
    {
      id: "a2",
      kind: "image",
      fileName: "logo.jpg",
      mimeType: "image/jpeg",
      data: "data:image/jpeg;base64,9j/4AAQSkZJRgABAQ",
      insertedAt: "2026-06-23T12:00:00Z",
    },
  ];

  it("replaces asset references with correct base64 data URLs", () => {
    const htmlInput = '<img src="asset:a1"> and <img src="image:a2">';
    const htmlOutput = resolveAssetRefs(htmlInput, assets);
    expect(htmlOutput).toBe('<img src="data:image/png;base64,iVBORw0KGgoAAAANS"> and <img src="data:image/jpeg;base64,9j/4AAQSkZJRgABAQ">');
  });

  it("leaves unmatched asset references untouched", () => {
    const htmlInput = '<img src="asset:unknown">';
    const htmlOutput = resolveAssetRefs(htmlInput, assets);
    expect(htmlOutput).toBe('<img src="asset:unknown">');
  });

  it("returns unchanged HTML if assets list is empty", () => {
    const htmlInput = '<img src="asset:a1">';
    const htmlOutput = resolveAssetRefs(htmlInput, []);
    expect(htmlOutput).toBe('<img src="asset:a1">');
  });

  it("integrates with renderMarkdown to ensure resolved data URLs are not stripped by sanitization", () => {
    const mdInput = "![test](asset:a1)";
    const resolvedMd = resolveAssetRefs(mdInput, assets);
    const htmlOutput = renderMarkdown(resolvedMd);
    expect(htmlOutput).toContain('src="data:image/png;base64,iVBORw0KGgoAAAANS"');
    expect(htmlOutput).not.toContain("asset:a1");
  });

  it("does not throw if asset ID is missing in the assets array", () => {
    const mdInput = "![test](asset:missing)";
    const resolvedMd = resolveAssetRefs(mdInput, assets);
    expect(() => renderMarkdown(resolvedMd)).not.toThrow();
  });

  describe("isUnembeddedImage", () => {
    it("classifies empty/missing URLs as unembedded", () => {
      expect(isUnembeddedImage("", assets)).toBe(true);
      expect(isUnembeddedImage("   ", assets)).toBe(true);
    });

    it("classifies remote http/https/data URLs as valid (not unembedded)", () => {
      expect(isUnembeddedImage("http://example.com/img.png", assets)).toBe(false);
      expect(isUnembeddedImage("https://example.com/img.png", assets)).toBe(false);
      expect(isUnembeddedImage("data:image/png;base64,123", assets)).toBe(false);
    });

    it("classifies resolved asset references as valid (not unembedded)", () => {
      expect(isUnembeddedImage("asset:a1", assets)).toBe(false);
      expect(isUnembeddedImage("image:a2", assets)).toBe(false);
    });

    it("classifies orphan asset references as unembedded", () => {
      expect(isUnembeddedImage("asset:unknown", assets)).toBe(true);
      expect(isUnembeddedImage("image:ghost", assets)).toBe(true);
    });

    it("classifies relative/local file paths as unembedded", () => {
      expect(isUnembeddedImage("images/fig-1.png", assets)).toBe(true);
      expect(isUnembeddedImage("../assets/logo.jpg", assets)).toBe(true);
      expect(isUnembeddedImage("/absolute/local/path.png", assets)).toBe(true);
    });
  });

  describe("transformUnembeddedImages AST transformation", () => {
    it("transforms unembedded image node into custom placeholder", () => {
      const ast = {
        type: "root",
        children: [
          {
            type: "image",
            url: "images/local.png",
            alt: "Ảnh minh họa",
          },
        ],
      };
      transformUnembeddedImages(ast, assets);

      const transformedNode = ast.children[0] as any;
      expect(transformedNode.type).toBe("paragraph");
      expect(transformedNode.data.hName).toBe("div");
      expect(transformedNode.data.hProperties.className).toBe("ws-preview-image-missing");
      expect(transformedNode.data.hProperties["data-missing-image"]).toBe("true");
      expect(transformedNode.data.hProperties["data-original-src"]).toBe("images/local.png");
      expect(transformedNode.data.hProperties["data-alt"]).toBe("Ảnh minh họa");
    });
  });
});


