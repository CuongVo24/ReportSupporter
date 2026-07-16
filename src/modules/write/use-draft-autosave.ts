"use client";

import { useEffect, useRef, useState } from "react";
import type { ReportProjectBundle } from "@/types";
import { createThrottledSaver, saveBundle } from "./autosave";

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
          setError(saveError instanceof Error ? saveError.message : "KhÃ´ng thá»ƒ lÆ°u báº£n tháº£o.");
          setStatus("error");
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
    
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", flushWhenHidden);
    
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", flushWhenHidden);
      void saver.flush();
    };
  }, []);

  return { status, quotaFull, error, retrySave };
}
