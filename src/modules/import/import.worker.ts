import { docxConverter } from "./converters/docx";
import { xlsxConverter } from "./converters/xlsx";
import { pptxConverter } from "./converters/pptx";
import { buildHeadingMap } from "./pdf/heading-heuristic";
import { convertPdfPagesToMarkdown } from "./pdf/paragraph-merge";


self.onmessage = async (e: MessageEvent) => {
  const { id, format, fileName, arrayBuffer, pages } = e.data;

  try {
    if (format === "docx") {
      const mockFile = {
        name: fileName,
        arrayBuffer: async () => arrayBuffer,
      } as File;
      const result = await docxConverter.convert(mockFile);
      self.postMessage({ id, type: "success", result });
    } else if (format === "xlsx") {
      const mockFile = {
        name: fileName,
        arrayBuffer: async () => arrayBuffer,
      } as File;
      const result = await xlsxConverter.convert(mockFile, (pct) => {
        self.postMessage({
          id,
          type: "progress",
          progress: { stage: "Đang đọc các dòng của bảng...", percent: pct },
        });
      });
      self.postMessage({ id, type: "success", result });
    } else if (format === "pptx") {
      if (typeof DOMParser === "undefined") {
        // Signal fallback to main thread due to missing DOMParser in Web Worker
        self.postMessage({
          id,
          type: "error",
          error: "FALLBACK_TO_MAIN_THREAD",
        });
        return;
      }
      const mockFile = {
        name: fileName,
        arrayBuffer: async () => arrayBuffer,
      } as File;
      const result = await pptxConverter.convert(mockFile, (pct) => {
        self.postMessage({
          id,
          type: "progress",
          progress: { stage: "Đang xử lý slides...", percent: pct },
        });
      });
      self.postMessage({ id, type: "success", result });
    } else if (format === "pdf") {
      // Run Heuristic steps in worker
      self.postMessage({
        id,
        type: "progress",
        progress: { stage: "Đang phân tích cấu trúc cột & tiêu đề (Heuristics)...", percent: 50 },
      });
      const { bodySize, headingMap } = buildHeadingMap(pages);
      const { markdown, warnings, assets } = convertPdfPagesToMarkdown(pages, bodySize, headingMap);

      self.postMessage({
        id,
        type: "progress",
        progress: { stage: "Hoàn tất heuristics...", percent: 100 },
      });

      self.postMessage({
        id,
        type: "success",
        result: {
          sourceFormat: "pdf",
          fileName,
          markdown,
          assets,
          warnings,
          convertedAt: new Date().toISOString(),
        },
      });
    } else {
      throw new Error(`Định dạng không được hỗ trợ trong Worker: ${format}`);
    }
  } catch (err: unknown) {
    const error = err as Error;
    self.postMessage({
      id,
      type: "error",
      error: error.message || String(error),
    });
  }
};
