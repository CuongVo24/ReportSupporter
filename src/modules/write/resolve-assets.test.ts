import { describe, it, expect } from "vitest";
import { resolveAssetRefs } from "./resolve-assets";
import type { ReportAsset } from "@/types";

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
});
