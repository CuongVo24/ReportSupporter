"use client";

import { useEffect, useRef, useState } from "react";
import type { ReportProjectBundle } from "@/types";
import { createThrottledSaver, saveBundle } from "./autosave";

/**
 * React hook that throttles saving workspace bundle changes to IndexedDB.
 * Flushes pending saves before the window or visibility changes.
 */
export function useDraftAutosave(bundle: ReportProjectBundle | null) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [quotaFull, setQuotaFull] = useState(false);
  const initialRef = useRef(true);
  const lastSavedRef = useRef<string | null>(null);

  const saverRef = useRef(
    createThrottledSaver<ReportProjectBundle>(async (next) => {
      try {
        await saveBundle(next);
        setQuotaFull(false);
        setStatus("saved");
      } catch {
        setQuotaFull(true);
      }
    }, 2000)
  );

  useEffect(() => {
    if (!bundle) return;

    // Normalize or exclude rapidly changing updatedAt fields to detect real content edits
    const serialized = JSON.stringify({
      ...bundle,
      project: {
        ...bundle.project,
        updatedAt: "",
      },
    });

    if (initialRef.current) {
      initialRef.current = false;
      lastSavedRef.current = serialized;
      return;
    }

    if (serialized === lastSavedRef.current) {
      return;
    }

    lastSavedRef.current = serialized;
    setStatus("saving");
    saverRef.current.schedule(bundle);
  }, [bundle]);

  // Register window flush event listeners
  useEffect(() => {
    const saver = saverRef.current;
    const flush = () => saver.flush();
    
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", flush);
    
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", flush);
      saver.flush();
    };
  }, []);

  return { status, quotaFull };
}
