import { useState, useCallback } from "react";
import type { ExportArtifact, ExportJob, ExportTarget, ReportProjectBundle, ExportError, SlideOutline, Speaker, SpeakerScript } from "@/types";
import { recordExport } from "./export-history";

import { runChecker } from "@/modules/check/run-checker";
import { slugify } from "@/lib/slugify";
import { createVerifiedArtifact } from "./artifact-verification";

async function executeExport(
  target: ExportTarget,
  bundle: ReportProjectBundle,
  extraParams?: {
    slides?: SlideOutline[];
    speakers?: Speaker[];
    scripts?: Record<string, SpeakerScript>;
  },
  onPhaseChange?: (phase: ExportJob["phase"]) => void
): Promise<ExportArtifact> {
  if (target === "pptx") {
    // PPTX has its own separate validation constraints (not blocked by body P0 errors)
    if (!extraParams?.slides || extraParams.slides.length === 0) {
      const exportError: ExportError = {
        stage: "parse",
        message: "Không thể xuất PowerPoint do chưa có nội dung slide. Vui lòng tạo slide trước.",
        recoverable: false,
      };
      throw exportError;
    }
  } else {
    // Gate report exports (html, pdf, docx) if there are any P0 (severity === "error") issues in the body
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
  }

  let artifact: ExportArtifact;
  onPhaseChange?.("preparing");

  const qrDataUrls: Record<string, string> = {};
  if (bundle.evidence && bundle.evidence.length > 0) {
    const { toQrDataUrl } = await import("@/modules/evidence/evidence-qr");
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
    const { exportHtml } = await import("./export-html");
    const res = Object.keys(qrDataUrls).length > 0
      ? await exportHtml(bundle, qrDataUrls)
      : await exportHtml(bundle);
    if (!res.ok) {
      throw res.error;
    }
    artifact = res.artifact;
  } else if (target === "pdf") {
    const { exportPdf } = await import("./export-pdf");
    const res = await exportPdf(
      bundle,
      onPhaseChange,
      Object.keys(qrDataUrls).length > 0 ? qrDataUrls : undefined,
    );
    if (!res.ok) {
      throw res.error;
    }
    artifact = res.artifact;
  } else if (target === "docx") {
    const { exportDocx, packDocx } = await import("./export-docx");
    const res = Object.keys(qrDataUrls).length > 0
      ? exportDocx(bundle, qrDataUrls)
      : exportDocx(bundle);
    if (!res.ok) {
      throw res.error;
    }
    try {
      const blob = await packDocx(res.doc);
      artifact = await createVerifiedArtifact({
        target: "docx",
        blob,
        fileName: `${slugify(bundle.project.title) || "report"}.docx`,
      });
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
      const blob = await buildPptx(
        extraParams.slides,
        extraParams.speakers || [],
        extraParams.scripts || {}
      );
      artifact = await createVerifiedArtifact({
        target: "pptx",
        blob,
        fileName: `${slugify(bundle.project.title) || "report"}.pptx`,
      });
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

  return artifact;
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
    const safeTitle = slugify(bundle.project.title) || "report";
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

    setJobs((prev) => [newJob, ...prev].slice(0, 100));

    let currentPhase: ExportJob["phase"] = undefined;
    try {
      const artifact = await executeExport(target, bundle, extraParams, (phase) => {
        currentPhase = phase;
        setJobs((prev) =>
          prev.map((job) =>
            job.id === id
              ? { ...job, phase }
              : job
          )
        );
      });

      if (typeof window !== "undefined" && typeof document !== "undefined") {
        const url = URL.createObjectURL(artifact.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        globalThis.setTimeout(() => URL.revokeObjectURL(url), 0);
      }

      setExportedBlobs((prev) => ({ ...prev, [target]: artifact.blob }));
      const artifactMetadata = {
        target: artifact.target, mediaType: artifact.mediaType, fileName: artifact.fileName,
        byteLength: artifact.byteLength, sha256: artifact.sha256, generatedAt: artifact.generatedAt,
        verified: artifact.verified,
      };
      const finishedJob: ExportJob = {
        ...newJob,
        phase: currentPhase,
        status: "done",
        artifact: artifactMetadata,
        finishedAt: new Date().toISOString(),
      };
      await recordExport(finishedJob);
      setJobs((prev) =>
        prev.map((job) => (job.id === id ? finishedJob : job))
      );
    } catch (error: unknown) {
      const exportError: ExportError =
        error && typeof error === "object" && "stage" in error && "message" in error
          ? (error as ExportError)
          : {
              stage: target === "html" ? "render-html" : target === "pdf" ? "render-pdf" : target === "docx" ? "render-docx" : "render-pptx",
              message: error instanceof Error ? error.message : "An unknown error occurred during export.",
              recoverable: true,
            };

      const failedJob: ExportJob = { ...newJob, phase: currentPhase, status: "error", error: exportError, finishedAt: new Date().toISOString() };
      await recordExport(failedJob);
      setJobs((prev) =>
        prev.map((job) => (job.id === id ? failedJob : job))
      );
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

      let currentPhase: ExportJob["phase"] = undefined;
      try {
        const artifact = await executeExport(job.target, activeBundle, extraParams, (phase) => {
          currentPhase = phase;
          setJobs((prev) =>
            prev.map((j) => (j.id === jobId ? { ...j, phase } : j))
          );
        });

        if (typeof window !== "undefined" && typeof document !== "undefined") {
          const url = URL.createObjectURL(artifact.blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = job.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }

        const targetJob = jobs.find((j) => j.id === jobId);
        const artifactMetadata = {
          target: artifact.target, mediaType: artifact.mediaType, fileName: artifact.fileName,
          byteLength: artifact.byteLength, sha256: artifact.sha256, generatedAt: artifact.generatedAt,
          verified: artifact.verified,
        };
        const finishedJob: ExportJob = {
          ...(targetJob || job),
          phase: currentPhase || targetJob?.phase || job.phase,
          status: "done",
          artifact: artifactMetadata,
          finishedAt: new Date().toISOString()
        };
        setExportedBlobs((prev) => ({ ...prev, [job.target]: artifact.blob }));
        await recordExport(finishedJob);
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? finishedJob : j))
        );
      } catch (error: unknown) {
        const exportError: ExportError =
          error && typeof error === "object" && "stage" in error && "message" in error
            ? (error as ExportError)
            : {
                stage: job.target === "html" ? "render-html" : job.target === "pdf" ? "render-pdf" : job.target === "docx" ? "render-docx" : "render-pptx",
                message: error instanceof Error ? error.message : "An unknown error occurred during export.",
                recoverable: true,
              };

        const targetJob = jobs.find((j) => j.id === jobId);
        const failedJob: ExportJob = {
          ...(targetJob || job),
          phase: currentPhase || targetJob?.phase || job.phase,
          status: "error",
          error: exportError,
          finishedAt: new Date().toISOString()
        };
        await recordExport(failedJob);
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? failedJob : j))
        );
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
