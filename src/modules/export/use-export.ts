import { useState, useCallback } from "react";
import type { ExportJob, ExportTarget, ReportProjectBundle, ExportError, SlideOutline, Speaker, SpeakerScript } from "@/types";
import { exportHtml } from "./export-html";
import { exportPdf } from "./export-pdf";
import { exportDocx, packDocx } from "./export-docx";
import { toQrDataUrl } from "@/modules/evidence";
import { recordExport } from "./export-history";

import { runChecker } from "@/modules/check/run-checker";

async function executeExport(
  target: ExportTarget,
  bundle: ReportProjectBundle,
  extraParams?: {
    slides?: SlideOutline[];
    speakers?: Speaker[];
    scripts?: Record<string, SpeakerScript>;
  },
  onPhaseChange?: (phase: ExportJob["phase"]) => void
): Promise<Blob> {
  // Gate export if there are any P0 (severity === "error") issues
  const checkResult = runChecker(bundle);
  const errorIssues = checkResult.issues.filter((i) => i.severity === "error");
  if (errorIssues.length > 0) {
    const errorMessages = errorIssues.map((i) => i.message).join("; ");
    const exportError: ExportError = {
      stage: "parse",
      message: `Không thể xuất bản báo cáo do có lỗi nghiêm trọng (P0): ${errorMessages}`,
      recoverable: false,
    };
    throw exportError;
  }

  let blob: Blob;
  onPhaseChange?.("preparing");

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
    const res = await exportPdf(bundle, onPhaseChange);
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
  } else if (target === "pptx") {
    if (!extraParams?.slides) {
      throw new Error("Missing slides outline data for PPTX generation");
    }
    try {
      const { buildPptx } = await import("@/modules/present/export-pptx");
      blob = await buildPptx(
        extraParams.slides,
        extraParams.speakers || [],
        extraParams.scripts || {}
      );
    } catch (pptxErr: unknown) {
      const msg = pptxErr instanceof Error ? pptxErr.message : "Failed to generate PPTX document.";
      const pptxError: ExportError = {
        stage: "render-pptx",
        message: msg,
        recoverable: true,
      };
      throw pptxError;
    }
  } else {
    throw new Error(`Unsupported export target: ${target}`);
  }

  return blob;
}

export function useExport(currentBundle?: ReportProjectBundle) {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [exportedBlobs, setExportedBlobs] = useState<Partial<Record<ExportTarget, Blob>>>({});

  const runExport = useCallback(async (
    target: ExportTarget,
    bundle: ReportProjectBundle,
    extraParams?: {
      slides?: SlideOutline[];
      speakers?: Speaker[];
      scripts?: Record<string, SpeakerScript>;
    }
  ) => {
    const id = Math.random().toString(36).substring(2, 11);
    const safeTitle = bundle.project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "report";
    const ext = target === "pdf" ? "pdf" : target === "docx" ? "docx" : target === "pptx" ? "pptx" : "html";
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
      const blob = await executeExport(target, bundle, extraParams, (phase) => {
        setJobs((prev) =>
          prev.map((job) =>
            job.id === id
              ? { ...job, phase }
              : job
          )
        );
      });

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

      let finishedJob: ExportJob | null = null;
      setExportedBlobs((prev) => ({ ...prev, [target]: blob }));
      setJobs((prev) =>
        prev.map((job) => {
          if (job.id === id) {
            finishedJob = { ...job, status: "done", finishedAt: new Date().toISOString() };
            return finishedJob;
          }
          return job;
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
              stage: target === "html" ? "render-html" : target === "pdf" ? "render-pdf" : target === "docx" ? "render-docx" : "render-pptx",
              message: error instanceof Error ? error.message : "An unknown error occurred during export.",
              recoverable: true,
            };

      let failedJob: ExportJob | null = null;
      setJobs((prev) =>
        prev.map((job) => {
          if (job.id === id) {
            failedJob = { ...job, status: "error", error: exportError, finishedAt: new Date().toISOString() };
            return failedJob;
          }
          return job;
        })
      );
      if (failedJob) {
        recordExport(failedJob);
      }
    }
  }, []);

  const retry = useCallback(
    async (
      jobId: string,
      overrideBundle?: ReportProjectBundle,
      extraParams?: {
        slides?: SlideOutline[];
        speakers?: Speaker[];
        scripts?: Record<string, SpeakerScript>;
      }
    ) => {
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
        const blob = await executeExport(job.target, activeBundle, extraParams);

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
                stage: job.target === "html" ? "render-html" : job.target === "pdf" ? "render-pdf" : job.target === "docx" ? "render-docx" : "render-pptx",
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
