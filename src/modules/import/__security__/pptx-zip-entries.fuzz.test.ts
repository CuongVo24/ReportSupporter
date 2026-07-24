// @vitest-environment jsdom
// W25-K (S4): documents ThreatModel T8 — pptxConverter caps *compressed
// input bytes* (maxBytes = 50MiB) but JSZip.loadAsync indexes every entry
// in the archive's central directory with no cap on entry COUNT. A zip with
// many small entries (classic zip-bomb-by-entry-count, distinct from a
// bomb-by-ratio) stays under the byte cap yet still costs unbounded parse
// work. This test proves the current (unguarded) behavior at a bounded,
// CI-safe scale — it is a regression baseline for the gap, not a fix; the
// fix is tracked as an open item in ThreatModel T8, out of scope here.
import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { pptxConverter } from "../converters/pptx";

const PRESENTATION_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst>
</p:presentation>`;

const PRESENTATION_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
</Relationships>`;

const SLIDE_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree></p:spTree></p:cSld>
</p:sld>`;

async function buildPptx(junkEntryCount: number): Promise<File> {
  const zip = new JSZip();
  zip.file("ppt/presentation.xml", PRESENTATION_XML);
  zip.file("ppt/_rels/presentation.xml.rels", PRESENTATION_RELS);
  zip.file("ppt/slides/slide1.xml", SLIDE_XML);
  for (let i = 0; i < junkEntryCount; i++) {
    zip.file(`junk/entry-${i}.txt`, "x");
  }
  const buffer = await zip.generateAsync({ type: "arraybuffer" });
  return new File([buffer], "many-entries.pptx", {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
}

describe("pptxConverter — zip entry-count gap (KNOWN GAP, documented)", () => {
  it("processes a well-under-50MiB archive with 3000 unreferenced entries with no entry-count guard", async () => {
    const file = await buildPptx(3000);
    expect(file.size).toBeLessThan(pptxConverter.maxBytes);

    const result = await pptxConverter.convert(file);
    expect(result.sourceFormat).toBe("pptx");
    // Nothing rejects the archive for its entry count — confirms the gap.
  }, 20_000);
});
