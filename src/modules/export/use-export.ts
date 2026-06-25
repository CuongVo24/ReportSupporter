import { useState, useCallback } from "react";
import type { ExportJob, ExportTarget, ReportProjectBundle, ExportError } from "@/types";
import { exportHtml } from "./export-html";
import { exportPdf } from "./export-pdf";
import { exportDocx, packDocx } from "./export-docx";
import { toQrDataUrl } from "@/modules/evidence";
import { recordExport } from "./export-history";

async function executeExport(
  target: ExportTarget,
  bundle: ReportProjectBundle
): Promise<Blob> {
  let blob: Blob;

  const qrDataUrls: Record<string, string> = {};
  if (bundle.evidence && bundle.evidence.length > 0) {
    for (const item of bundle.evidence) {
      if (item.qrEnabled && item.url) {
        try {
          const dataUrl = await toQrDataUrl(item.url);
          if (dataUrl) {
            qrDataUrls[item.url] = dataUrl;
          }
        } catch {
          // ignore
        }
      }
    }
  }

  if (target === "html") {
    const res = Object.keys(qrDataUrls).length > 0
      ? exportHtml(bundle, qrDataUrls)
      : exportHtml(bundle);
    if (!res.ok) {
      throw res.error;
    }
    blob = res.blob;
  } else if (target === "pdf") {
    const res = exportPdf(bundle);
    if (!res.ok) {
      throw res.error;
    }
    blob = res.blob;
  } else if (target === "docx") {
    const res = Object.keys(qrDataUrls).length > 0
      ? exportDocx(bundle, qrDataUrls)
      : exportDocx(bundle);
    if (!res.ok) {
      throw res.error;
    }
    try {
      blob = await packDocx(res.doc);
    } catch (packErr: unknown) {
      const msg = packErr instanceof Error ? packErr.message : "Failed to pack DOCX zip archive.";
      const docxError: ExportError = {
        stage: "render-docx",
        message: msg,
        recoverable: true,
      };
      throw docxError;
    }
  } else {
    throw new Error(`Unsupported export target: ${target}`);
  }

  return blob;
}

export function useExport(currentBundle?: ReportProjectBundle) {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [exportedBlobs, setExportedBlobs] = useState<Partial<Record<ExportTarget, Blob>>>({});

  const runExport = useCallback(async (target: ExportTarget, bundle: ReportProjectBundle) => {
    const id = Math.random().toString(36).substring(2, 11);
    const safeTitle = bundle.project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "report";
    const ext = target === "pdf" ? "pdf" : target === "docx" ? "docx" : "html";
    const fileName = `${safeTitle}.${ext}`;

    const newJob: ExportJob = {
      id,
      target,
      projectId: bundle.project.id,
      status: "running",
      startedAt: new Date().toISOString(),
      fileName,
    };

    setJobs((prev) => [newJob, ...prev]);

    try {
      const blob = await executeExport(target, bundle);

      if (target !== "pdf" && typeof window !== "undefined" && typeof document !== "undefined") {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      const finishedJob: ExportJob = { ...newJob, status: "done", finishedAt: new Date().toISOString() };
      setExportedBlobs((prev) => ({ ...prev, [target]: blob }));
      setJobs((prev) =>
        prev.map((job) =>
          job.id === id
            ? finishedJob
            : job
        )
      );
      recordExport(finishedJob);
    } catch (error: unknown) {
      const exportError: ExportError =
        error && typeof error === "object" && "stage" in error && "message" in error
          ? (error as ExportError)
          : {
              stage: target === "html" ? "render-html" : target === "pdf" ? "render-pdf" : "render-docx",
              message: error instanceof Error ? error.message : "An unknown error occurred during export.",
              recoverable: true,
            };

      const failedJob: ExportJob = { ...newJob, status: "error", error: exportError, finishedAt: new Date().toISOString() };
      setJobs((prev) =>
        prev.map((job) =>
          job.id === id
            ? failedJob
            : job
        )
      );
      recordExport(failedJob);
    }
  }, []);

  const retry = useCallback(
    async (jobId: string, overrideBundle?: ReportProjectBundle) => {
      const activeBundle = overrideBundle || currentBundle;
      if (!activeBundle) return;

      const job = jobs.find((j) => j.id === jobId);
      if (!job) return;

      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: "running",
                startedAt: new Date().toISOString(),
                finishedAt: undefined,
                error: undefined,
              }
            : j
        )
      );

      try {
        const blob = await executeExport(job.target, activeBundle);

        if (job.target !== "pdf" && typeof window !== "undefined" && typeof document !== "undefined") {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = job.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }

        let finishedJob: ExportJob | undefined;
        setExportedBlobs((prev) => ({ ...prev, [job.target]: blob }));
        setJobs((prev) =>
          prev.map((j) => {
            if (j.id === jobId) {
              finishedJob = { ...j, status: "done", finishedAt: new Date().toISOString() };
              return finishedJob;
            }
            return j;
          })
        );
        if (finishedJob) {
          recordExport(finishedJob);
        }
      } catch (error: unknown) {
        const exportError: ExportError =
          error && typeof error === "object" && "stage" in error && "message" in error
            ? (error as ExportError)
            : {
                stage: job.target === "html" ? "render-html" : job.target === "pdf" ? "render-pdf" : "render-docx",
                message: error instanceof Error ? error.message : "An unknown error occurred during export.",
                recoverable: true,
              };

        let failedJob: ExportJob | undefined;
        setJobs((prev) =>
          prev.map((j) => {
            if (j.id === jobId) {
              failedJob = { ...j, status: "error", error: exportError, finishedAt: new Date().toISOString() };
              return failedJob;
            }
            return j;
          })
        );
        if (failedJob) {
          recordExport(failedJob);
        }
      }
    },
    [jobs, currentBundle]
  );

  return {
    jobs,
    runExport,
    retry,
    exportedBlobs,
  };
}
