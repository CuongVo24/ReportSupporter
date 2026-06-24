import type { ReportProjectBundle, ExportResult } from "@/types";
import { prepareExport } from "./prepare-export";
import { buildPrintableHtml } from "./print-preview";

/**
 * Triggers PDF export via the browser's native print surface.
 * Reuses the formatted HTML structure from Group A to guarantee formatting parity.
 * Note: Headers, footers, and page numbers are browser best-effort.
 */
export function exportPdfViaBrowserPrint(bundle: ReportProjectBundle): ExportResult {
  // 1. Client-only guard (no-window context)
  if (typeof window === "undefined") {
    return {
      ok: false,
      error: {
        stage: "render-pdf",
        message: "PDF export via browser print can only run in a client environment.",
        recoverable: true,
      },
    };
  }

  try {
    // 2. Prepare printable HTML content
    const input = prepareExport(bundle);
    const htmlContent = buildPrintableHtml(input);

    // 3. Open a new window print surface
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      return {
        ok: false,
        error: {
          stage: "render-pdf",
          message: "Popup blocked. Please allow popups to export PDF.",
          recoverable: true,
        },
      };
    }

    // 4. Write content and trigger native browser print dialog
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };

    // Fallback if onload event fails to fire
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch {
        // ignore errors if print was already triggered or window closed
      }
    }, 500);

    // Return the HTML Blob of the printed document as a representation of output
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    return { ok: true, blob };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to trigger browser print.";
    return {
      ok: false,
      error: {
        stage: "render-pdf",
        message,
        recoverable: true,
      },
    };
  }
}

/**
 * Server-side Puppeteer PDF rendering engine stub.
 * Disabled by default in MVP. Does not import the puppeteer package.
 */
export function renderPdfWithPuppeteer(_bundle: ReportProjectBundle): ExportResult {
  void _bundle;
  return {
    ok: false,
    error: {
      stage: "render-pdf",
      message: "Puppeteer hardening disabled in MVP.",
      recoverable: false,
    },
  };
}

/**
 * PDF Exporter entry point. Defaults to exportPdfViaBrowserPrint in MVP.
 */
export function exportPdf(bundle: ReportProjectBundle): ExportResult {
  return exportPdfViaBrowserPrint(bundle);
}

