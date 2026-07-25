import type { ImportConverter, ImportResult, ImportWarning } from "@/types";
import {
  parsePresentationOrder,
  parseSlideXml,
  parseNotesPathFromRels,
  parseNotesSlideXml,
} from "../pptx/slide-xml";
import { validateZipPreflight, IMPORT_LIMITS } from "../resource-policy";

/**
 * Converter for PPTX presentations using JSZip and slide-xml parser.
 * Slide to H2 title, body to nested GFM list, notes to blockquote.
 * Enforces resource preflight budgets & slide caps.
 */
export const pptxConverter: ImportConverter = {
  format: "pptx",
  extensions: [".pptx"],
  mimeTypes: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  maxBytes: IMPORT_LIMITS.MAX_INPUT_BYTES,
  convert: async (file: File, onProgress?: (progress: number) => void): Promise<ImportResult> => {
    if (file.size > IMPORT_LIMITS.MAX_INPUT_BYTES) {
      throw new Error("Dung lượng tệp vượt quá giới hạn 50MB.");
    }

    const arrayBuffer = await file.arrayBuffer();

    // Dynamic import of JSZip
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Preflight zip check against zip bombs & excessive entries
    const preflight = validateZipPreflight(zip);
    if (!preflight.valid) {
      throw new Error(preflight.error || "Tệp PPTX không đáp ứng giới hạn an toàn.");
    }

    // Read presentation order definitions
    const presentationXmlFile = zip.file("ppt/presentation.xml");
    if (!presentationXmlFile) {
      throw new Error("Tệp PPTX không hợp lệ (thiếu ppt/presentation.xml).");
    }
    const presentationXml = await presentationXmlFile.async("string");

    const relsXmlFile = zip.file("ppt/_rels/presentation.xml.rels");
    if (!relsXmlFile) {
      throw new Error("Tệp PPTX không hợp lệ (thiếu ppt/_rels/presentation.xml.rels).");
    }
    const relsXml = await relsXmlFile.async("string");

    const slidePaths = parsePresentationOrder(presentationXml, relsXml);
    if (slidePaths.length === 0) {
      throw new Error("Tệp PPTX không chứa slide nào.");
    }

    if (slidePaths.length > IMPORT_LIMITS.MAX_PPTX_SLIDES) {
      throw new Error(
        `Tệp PPTX vượt quá giới hạn tối đa ${IMPORT_LIMITS.MAX_PPTX_SLIDES} slide (${slidePaths.length} slide).`,
      );
    }

    const mdBlocks: string[] = [];
    const warnings: ImportWarning[] = [];
    const totalSlides = slidePaths.length;

    for (let i = 0; i < totalSlides; i++) {
      const slidePath = slidePaths[i];
      const slideFile = zip.file(slidePath);
      if (!slideFile) {
        if (onProgress) {
          onProgress(Math.round(((i + 1) / totalSlides) * 100));
        }
        continue;
      }

      const slideXml = await slideFile.async("string");
      const parsedSlide = parseSlideXml(slideXml);

      // Try to parse notes slide relationships
      let notesText: string | undefined;

      const pathParts = slidePath.split("/");
      const slideName = pathParts[pathParts.length - 1];
      const relsDir = pathParts.slice(0, -1).join("/") + "/_rels";
      const slideRelsPath = `${relsDir}/${slideName}.rels`;

      const slideRelsFile = zip.file(slideRelsPath);
      if (slideRelsFile) {
        const slideRelsXml = await slideRelsFile.async("string");
        const notesPath = parseNotesPathFromRels(slideRelsXml, slidePath);
        if (notesPath) {
          const notesFile = zip.file(notesPath);
          if (notesFile) {
            const notesXml = await notesFile.async("string");
            notesText = parseNotesSlideXml(notesXml);
          }
        }
      }

      // Generate Markdown for this slide
      let slideMd = "";
      const slideTitle = parsedSlide.title || `Slide ${i + 1}`;
      slideMd += `## ${slideTitle}\n\n`;

      if (parsedSlide.paragraphs.length > 0) {
        for (const p of parsedSlide.paragraphs) {
          // Limit level nesting max 3 levels (indentLevel 0, 1, 2)
          const lvl = Math.min(2, Math.max(0, p.indentLevel));
          const indent = "  ".repeat(lvl);
          slideMd += `${indent}- ${p.text}\n`;
        }
        slideMd += "\n";
      }

      if (notesText) {
        // Output notes inside blockquote
        const notesLines = notesText.split("\n").map((line) => `> ${line}`);
        slideMd += `${notesLines.join("\n")}\n\n`;
      }

      mdBlocks.push(slideMd.trim());

      if (onProgress) {
        onProgress(Math.round(((i + 1) / totalSlides) * 100));
      }
    }

    return {
      sourceFormat: "pptx",
      fileName: file.name,
      markdown: mdBlocks.join("\n\n"),
      assets: [],
      warnings,
      convertedAt: new Date().toISOString(),
    };
  },
};
