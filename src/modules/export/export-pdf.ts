import type { ExportError, ExportJob, ExportResult, ReportProjectBundle } from "@/types";
import { slugify } from "@/lib/slugify";
import { prepareExport } from "./prepare-export";
import { buildPrintableHtml } from "./print-preview";
import { createVerifiedArtifact } from "./artifact-verification";
import { exportHtml } from "./export-html";

export type PrintPreviewResult = { ok: true } | { ok: false; error: ExportError };

/** Opens the browser print UI. This is a local preview action, not an export artifact. */
export async function openPrintPreview(bundle: ReportProjectBundle): Promise<PrintPreviewResult> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      ok: false,
      error: {
        stage: "render-pdf",
        message: "Print Preview chỉ hoạt động trong trình duyệt.",
        recoverable: true,
      },
    };
  }

  let iframe: HTMLIFrameElement | null = null;
  try {
    iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.inset = "auto 0 0 auto";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);
    const frameWindow = iframe.contentWindow;
    const frameDocument = frameWindow?.document;
    if (!frameWindow || !frameDocument) throw new Error("Không thể tạo bề mặt Print Preview.");
    frameDocument.open();
    frameDocument.write(buildPrintableHtml(prepareExport(bundle)));
    frameDocument.close();
    frameDocument.title = bundle.project.title;
    for (const style of document.querySelectorAll("style, link[rel='stylesheet']")) {
      frameDocument.head.appendChild(style.cloneNode(true));
    }
    await Promise.all(Array.from(frameDocument.images).map((image) => image.decode?.().catch(() => undefined)));
    await new Promise<void>((resolve) => (window.requestAnimationFrame ?? setTimeout)(() => resolve()));
    frameWindow.focus();
    frameWindow.print();
    window.setTimeout(() => iframe?.remove(), 2_000);
    return { ok: true };
  } catch (error: unknown) {
    iframe?.remove();
    return {
      ok: false,
      error: {
        stage: "render-pdf",
        message: error instanceof Error ? error.message : "Không thể mở Print Preview.",
        recoverable: true,
      },
    };
  }
}

/** @deprecated Use openPrintPreview. Kept for one release while callers migrate. */
export const exportPdfViaBrowserPrint = openPrintPreview;

/** Generate a real PDF binary through the first-party renderer service with render capability tickets. */
export async function exportPdf(
  bundle: ReportProjectBundle,
  onPhaseChange?: (phase: ExportJob["phase"]) => void,
  qrDataUrls?: Record<string, string>,
): Promise<ExportResult> {
  try {
    onPhaseChange?.("preparing");
    const htmlResult = await exportHtml(bundle, qrDataUrls);
    if (!htmlResult.ok) return htmlResult;
    const html = await htmlResult.artifact.blob.text();
    onPhaseChange?.("rendering-assets");

    // 1. Issue short-lived PDF capability ticket from server
    let ticket: string | undefined;
    try {
      const ticketRes = await fetch("/api/pdf/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
        signal: AbortSignal.timeout(10_000),
      });
      if (ticketRes.ok) {
        const ticketData = await ticketRes.json();
        ticket = ticketData.ticket;
      }
    } catch {
      // Fallback: PDF route will verify ticket and return clear error if missing
    }

    // 2. Post to /api/pdf with capability ticket
    const response = await fetch("/api/pdf", {
      method: "POST",
      headers: {
        "Content-Type": "text/html;charset=utf-8",
        ...(ticket ? { "x-pdf-ticket": ticket } : {}),
      },
      body: html,
      signal: AbortSignal.timeout(50_000),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: unknown };
      if (response.status === 503 || response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const suffix = retryAfter ? ` sau khoảng ${retryAfter}s` : " sau ít phút";
        throw new Error(
          typeof body.error === "string"
            ? body.error
            : `Dịch vụ tạo PDF đang bận, hãy thử lại${suffix}. Bạn vẫn có thể dùng Print Preview cục bộ.`,
        );
      }
      throw new Error(
        typeof body.error === "string"
          ? body.error
          : "Dịch vụ tạo PDF hiện không khả dụng. Bạn vẫn có thể dùng Print Preview cục bộ.",
      );
    }
    const artifact = await createVerifiedArtifact({
      target: "pdf",
      blob: await response.blob(),
      fileName: `${slugify(bundle.project.title) || "report"}.pdf`,
    });
    onPhaseChange?.("ready");
    return { ok: true, artifact, blob: artifact.blob };
  } catch (error: unknown) {
    return {
      ok: false,
      error: {
        stage: "render-pdf",
        message: error instanceof Error ? error.message : "Không thể tạo PDF.",
        recoverable: true,
      },
    };
  }
}

export function renderPdfWithPuppeteer(_bundle: ReportProjectBundle): ExportResult {
  void _bundle;
  return {
    ok: false,
    error: {
      stage: "render-pdf",
      message: "Puppeteer chạy trong Docker renderer, không chạy trong bundle trình duyệt.",
      recoverable: false,
    },
  };
}
