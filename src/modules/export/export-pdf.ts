import type { ReportProjectBundle, ExportResult } from "@/types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function exportPdf(_bundle: ReportProjectBundle): ExportResult {
  return {
    ok: false,
    error: {
      stage: "render-pdf",
      message: "PDF export is not implemented until W4.",
      recoverable: false,
    },
  };
}
