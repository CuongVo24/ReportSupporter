// W25-K (S4): adversarial fixtures for extractEmbeddedAssets — the 5MB
// per-image cap (extract-assets.ts MAX_IMAGE_SIZE_BYTES) must trigger from
// the base64 *string length* before any asset object is allocated, and must
// hold across a mixed batch of markdown-syntax and inline-HTML images,
// duplicate data URLs, and many small images in one document.
import { describe, expect, it } from "vitest";
import { mulberry32, pick, pickInt } from "@/test/fuzz-utils";
import { extractEmbeddedAssets } from "../extract-assets";

const B64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// `.repeat()` builds one flat string in O(n) instead of an n-iteration JS
// loop of single-char `+=` appends — the size cap only cares about length,
// not content, so a repeated short unit is a faster, equally valid fixture
// at multi-megabyte scale.
function fakeBase64DataUrl(rand: () => number, approxBytes: number): string {
  const base64Length = Math.ceil((approxBytes * 4) / 3);
  const unit = pick(rand, B64_ALPHABET.split(""));
  return `data:image/png;base64,${unit.repeat(base64Length)}`;
}

describe("extractEmbeddedAssets — size cap", () => {
  it("skips an image just over the 5MB cap and never materializes it as an asset", async () => {
    const rand = mulberry32(1);
    const dataUrl = fakeBase64DataUrl(rand, 5 * 1024 * 1024 + 1024);
    const markdown = `![big](${dataUrl})`;

    const result = await extractEmbeddedAssets(markdown);

    expect(result.assets).toHaveLength(0);
    expect(result.warnings).toEqual([expect.objectContaining({ code: "image-skipped" })]);
    expect(result.markdown).toBe("![big](image-skipped)");
    expect(result.markdown).not.toContain("base64");
  });

  it("keeps an image just under the 5MB cap as a real asset", async () => {
    const rand = mulberry32(2);
    const dataUrl = fakeBase64DataUrl(rand, 5 * 1024 * 1024 - 1024);
    const markdown = `![ok](${dataUrl})`;

    const result = await extractEmbeddedAssets(markdown);

    expect(result.warnings).toHaveLength(0);
    expect(result.assets).toHaveLength(1);
    expect(result.markdown).toBe(`![ok](asset:${result.assets[0].id})`);
  });

  it("caps trigger consistently across a mixed batch of oversized/undersized markdown + inline-HTML images", async () => {
    const rand = mulberry32(3);
    const parts: string[] = [];
    let expectedAssets = 0;
    let expectedWarnings = 0;

    for (let i = 0; i < 15; i++) {
      const oversized = rand() > 0.5;
      const bytes = oversized
        ? 5 * 1024 * 1024 + pickInt(rand, 1, 1024 * 1024)
        : pickInt(rand, 1024, 5 * 1024 * 1024 - 2048);
      const dataUrl = fakeBase64DataUrl(rand, bytes);
      const asHtml = rand() > 0.5;
      parts.push(asHtml ? `<img src="${dataUrl}" alt="i${i}">` : `![i${i}](${dataUrl})`);
      if (oversized) expectedWarnings += 1;
      else expectedAssets += 1;
    }

    const result = await extractEmbeddedAssets(parts.join("\n\n"));

    expect(result.assets).toHaveLength(expectedAssets);
    expect(result.warnings).toHaveLength(expectedWarnings);
    expect(result.markdown).not.toContain("base64");
  });

  it("deduplicates identical data URLs into a single asset id", async () => {
    const rand = mulberry32(4);
    const dataUrl = fakeBase64DataUrl(rand, 1024);
    const markdown = `![a](${dataUrl})\n\n![b](${dataUrl})`;

    const result = await extractEmbeddedAssets(markdown);

    expect(result.assets).toHaveLength(1);
    const [firstRef, secondRef] = [...result.markdown.matchAll(/asset:([\w-]+)/g)].map((m) => m[1]);
    expect(firstRef).toBe(secondRef);
  });
});
