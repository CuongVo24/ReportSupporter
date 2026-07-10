import type { OcrProgress } from "@/types";

/**
 * Renders a specific page of a PDF File to an HTMLCanvasElement.
 * Dynamically imports pdfjs-dist to keep it out of the main bundle.
 */
export async function renderPdfPageToCanvas(file: File, pageNumber: number): Promise<HTMLCanvasElement> {
  const pdfjs = await import("pdfjs-dist");
  const arrayBuffer = await file.arrayBuffer();
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";
  }
  const pdfDoc = await pdfjs.getDocument({
    data: arrayBuffer,
    cMapUrl: "/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/standard_fonts/",
  }).promise;

  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 2.0 }); // 2.0 scale for clarity

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not get 2D context from canvas");
  }

  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise;

  return canvas;
}

/**
 * Runs tesseract.js OCR over a given HTMLCanvasElement.
 * Dynamically imports tesseract.js and configures it to run completely offline/locally.
 */
export async function performOcrOnCanvas(
  canvas: HTMLCanvasElement,
  onProgress?: (progress: { status: string; progress: number }) => void,
  abortSignal?: AbortSignal
): Promise<string> {
  // Lazy dynamic import of tesseract.js
  const Tesseract = await import("tesseract.js");

  const worker = await Tesseract.createWorker("vie+eng", 1, {
    workerPath: "/ocr/tesseract-worker.min.js",
    corePath: "/ocr/tesseract-core-simd.wasm.js", // Will fallback automatically if SIMD not supported
    langPath: "/ocr/",
    logger: (m) => {
      if (onProgress && m.status === "recognizing text") {
        onProgress({
          status: "Đang nhận diện chữ...",
          progress: typeof m.progress === "number" ? m.progress : 0,
        });
      }
    },
  });

  // Handle abort signal
  if (abortSignal) {
    if (abortSignal.aborted) {
      await worker.terminate();
      throw new Error("OCR cancelled");
    }
    abortSignal.addEventListener("abort", async () => {
      try {
        await worker.terminate();
      } catch {
        // Ignore termination errors on abort
      }
    });
  }

  try {
    const { data: { text } } = await worker.recognize(canvas);
    await worker.terminate();
    return text;
  } catch (err) {
    await worker.terminate();
    throw err;
  }
}

/**
 * Formats the raw OCR output text into Markdown paragraphs and guessed headings.
 */
export function formatOcrTextToMarkdown(text: string): string {
  const lines = text.split("\n");
  const formattedLines: string[] = [];

  // Add experimental label header
  formattedLines.push("> [!NOTE]");
  formattedLines.push("> *Đây là văn bản được trích xuất bằng OCR thử nghiệm (experimental). Chất lượng nhận diện chưa được kiểm chứng.*");
  formattedLines.push("");

  let currentParagraph: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentParagraph.length > 0) {
        formattedLines.push(currentParagraph.join(" "));
        formattedLines.push("");
        currentParagraph = [];
      }
      continue;
    }

    // Check if line looks like a heading (short + uppercase)
    const isShort = trimmed.length < 50;
    const isUppercase = trimmed === trimmed.toUpperCase() && /[A-ZÀ-Ỹ]/.test(trimmed);

    if (isShort && isUppercase) {
      if (currentParagraph.length > 0) {
        formattedLines.push(currentParagraph.join(" "));
        formattedLines.push("");
        currentParagraph = [];
      }
      // Guessed heading level 2
      formattedLines.push(`## ${trimmed} <!-- heading-guessed -->`);
      formattedLines.push("");
    } else {
      currentParagraph.push(trimmed);
    }
  }

  if (currentParagraph.length > 0) {
    formattedLines.push(currentParagraph.join(" "));
  }

  return formattedLines.join("\n");
}
export type { OcrProgress };
