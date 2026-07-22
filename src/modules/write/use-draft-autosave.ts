"use client";

import { useEffect, useRef, useState } from "react";
import type { ReportProjectBundle } from "@/types";
import { createThrottledSaver, saveBundle } from "./autosave";
import { putRecoveryItemRecord } from "@/lib/idb-client";

/**
 * React hook that throttles saving workspace bundle changes to IndexedDB.
 * Flushes pending saves before the window or visibility changes.
 */
export function useDraftAutosave(bundle: ReportProjectBundle | null) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [quotaFull, setQuotaFull] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialRef = useRef(true);
  const lastObservedBundleRef = useRef<ReportProjectBundle | null>(null);
  const latestBundleRef = useRef<ReportProjectBundle | null>(bundle);
  const latestRevisionRef = useRef(0);

  const saverRef = useRef(
    createThrottledSaver<{ bundle: ReportProjectBundle; revision: number }>(async (next) => {
      try {
        await saveBundle(next.bundle);
        if (next.revision === latestRevisionRef.current) {
          setQuotaFull(false);
          setError(null);
          setStatus("saved");
        }
      } catch (saveError: unknown) {
        if (next.revision === latestRevisionRef.current) {
          const isQuotaError = saveError instanceof DOMException && saveError.name === "QuotaExceededError";
          setQuotaFull(isQuotaError);
          setError(saveError instanceof Error ? saveError.message : "Không thể lưu bản thảo.");
          setStatus("error");
          try {
            // W24-M (S4): when the DB is out of quota, do NOT amplify pressure by
            // writing the full bundle (incl. multi-MiB assets) back into the same
            // full store. Persist only a light marker; the in-memory draft stays
            // intact and the UI exposes retry. Non-quota errors (transient) keep
            // the full payload so recovery can restore exact content.
            await putRecoveryItemRecord({
              id: `autosave-error-${next.bundle.project.id}`,
              kind: "autosave-error",
              projectId: next.bundle.project.id,
              title: "Autosave chưa ghi được dữ liệu",
              detail: saveError instanceof Error ? saveError.message : "Lỗi lưu bản thảo không xác định.",
              createdAt: new Date().toISOString(),
              payload: isQuotaError ? undefined : next.bundle,
            });
          } catch {
            // Storage may be completely full; UI still exposes retry and quota state.
          }
        }
      }
    }, 2000)
  );

  useEffect(() => {
    if (!bundle) return;
    latestBundleRef.current = bundle;

    if (initialRef.current) {
      initialRef.current = false;
      lastObservedBundleRef.current = bundle;
      return;
    }

    if (bundle === lastObservedBundleRef.current) return;

    lastObservedBundleRef.current = bundle;
    const revision = ++latestRevisionRef.current;
    setError(null);
    setStatus("saving");
    saverRef.current.schedule({ bundle, revision });
  }, [bundle]);

  const retrySave = () => {
    const latestBundle = latestBundleRef.current;
    if (!latestBundle) return;
    const revision = ++latestRevisionRef.current;
    setError(null);
    setStatus("saving");
    saverRef.current.schedule({ bundle: latestBundle, revision });
    void saverRef.current.flush();
  };

  // Register window flush event listeners
  useEffect(() => {
    const saver = saverRef.current;
    const flush = () => {
      void saver.flush();
    };
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const flushForServiceWorkerUpdate = () => {
      void saver.flush().finally(() => window.dispatchEvent(new Event("rs:autosave-flushed")));
    };
    
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", flushWhenHidden);
    window.addEventListener("rs:flush-autosave", flushForServiceWorkerUpdate);
    
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", flushWhenHidden);
      window.removeEventListener("rs:flush-autosave", flushForServiceWorkerUpdate);
      void saver.flush();
    };
  }, []);

  return { status, quotaFull, error, retrySave };
}
