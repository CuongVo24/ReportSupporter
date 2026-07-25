import type { ImportConverter, ImportResult, ImportWarning } from "@/types";
import { htmlToMarkdown } from "../html-to-markdown";
import { stripHeadingNumbers } from "../strip-heading-number";
import { validateZipPreflight, IMPORT_LIMITS } from "../resource-policy";

/**
 * Converter for DOCX documents using Mammoth.
 * Runs on the client side, dynamic imports Mammoth to optimize main bundle size,
 * converts DOCX styles semantic-first, cleans up heading numbers,
 * and enforces zip preflight security budgets.
 */
export const docxConverter: ImportConverter = {
  format: "docx",
  extensions: [".docx"],
  mimeTypes: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  maxBytes: IMPORT_LIMITS.MAX_INPUT_BYTES,
  convert: async (file: File): Promise<ImportResult> => {
    if (file.size > IMPORT_LIMITS.MAX_INPUT_BYTES) {
      throw new Error("Dung lượng tệp vượt quá giới hạn 50MB.");
    }

    // 1. Dynamic import mammoth to keep main bundle size minimal
    const mammoth = await import("mammoth");

    // 2. Read array buffer from the File object
    const arrayBuffer = await file.arrayBuffer();

    // Preflight zip check against zip bombs & excessive entries — reads the
    // ZIP's own Central Directory directly (no JSZip parse needed for this
    // step). Any failure here (including a malformed/unreadable archive)
    // stops the import; it is never silently swallowed and handed to
    // Mammoth anyway (fail-closed, not fail-open).
    const preflight = validateZipPreflight(arrayBuffer);
    if (!preflight.valid) {
      throw new Error(preflight.error || "Tệp DOCX không đáp ứng giới hạn an toàn.");
    }

    // 3. Define style mapping options for Mammoth
    const options = {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Heading 5'] => h5:fresh",
        "p[style-name='Heading 6'] => h6:fresh",
      ],
    };

    // 4. Convert using Mammoth
    const convertInput: { arrayBuffer: ArrayBuffer; buffer?: Buffer } = { arrayBuffer };
    if (typeof Buffer !== "undefined") {
      convertInput.buffer = Buffer.from(arrayBuffer);
    }
    const convertResult = await mammoth.convertToHtml(convertInput, options);

    // 5. Convert generated HTML into safe Markdown
    let markdown = await htmlToMarkdown(convertResult.value);

    // 6. Clean up hardcoded heading numbers
    markdown = stripHeadingNumbers(markdown);

    // 7. Map Mammoth warning messages to Vietnamese translations without swallowing them
    const warnings: ImportWarning[] = convertResult.messages.map(
      (msg: { type: string; message: string }) => {
        const lower = msg.message.toLowerCase();
        let code: ImportWarning["code"] = "unsupported-element";
        let viMessage = `Không hỗ trợ phần tử: ${msg.message}`;

        if (
          lower.includes("image") ||
          lower.includes("picture") ||
          lower.includes("graphic")
        ) {
          code = "image-skipped";
          viMessage = `Bỏ qua hình ảnh trong tệp DOCX (đã giữ lại đường dẫn tạm thời): ${msg.message}`;
        }

        return {
          code,
          message: viMessage,
        };
      },
    );

    return {
      sourceFormat: "docx",
      fileName: file.name,
      markdown,
      assets: [],
      warnings,
      convertedAt: new Date().toISOString(),
    };
  },
};
