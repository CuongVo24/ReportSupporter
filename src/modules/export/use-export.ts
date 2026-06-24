import { useState, useCallback } from "react";
import type { ExportJob, ExportTarget, ReportProjectBundle, ExportError } from "@/types";
import { exportHtml } from "./export-html";
import { exportPdf } from "./export-pdf";
import { exportDocx, packDocx } from "./export-docx";

async function executeExport(
  target: ExportTarget,
  bundle: ReportProjectBundle
): Promise<Blob> {
  let blob: Blob;

  if (target === "html") {
    const res = exportHtml(bundle);
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
    const res = exportDocx(bundle);
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

      setJobs((prev) =>
        prev.map((job) =>
          job.id === id
            ? { ...job, status: "done", finishedAt: new Date().toISOString() }
            : job
        )
      );
    } catch (error: unknown) {
      const exportError: ExportError =
        error && typeof error === "object" && "stage" in error && "message" in error
          ? (error as ExportError)
          : {
              stage: target === "html" ? "render-html" : target === "pdf" ? "render-pdf" : "render-docx",
              message: error instanceof Error ? error.message : "An unknown error occurred during export.",
              recoverable: true,
            };

      setJobs((prev) =>
        prev.map((job) =>
          job.id === id
            ? { ...job, status: "error", error: exportError, finishedAt: new Date().toISOString() }
            : job
        )
      );
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

        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId
              ? { ...j, status: "done", finishedAt: new Date().toISOString() }
              : j
          )
        );
      } catch (error: unknown) {
        const exportError: ExportError =
          error && typeof error === "object" && "stage" in error && "message" in error
            ? (error as ExportError)
            : {
                stage: job.target === "html" ? "render-html" : job.target === "pdf" ? "render-pdf" : "render-docx",
                message: error instanceof Error ? error.message : "An unknown error occurred during export.",
                recoverable: true,
              };

        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId
              ? { ...j, status: "error", error: exportError, finishedAt: new Date().toISOString() }
              : j
          )
        );
      }
    },
    [jobs, currentBundle]
  );

  return {
    jobs,
    runExport,
    retry,
  };
}
