import { z } from "zod";

const STORAGE_KEY = "rs:ocr-config";

export interface OcrConfig {
  enabled: boolean;
}

const ocrConfigSchema = z.object({
  enabled: z.boolean(),
});

const DEFAULT_OCR_CONFIG: OcrConfig = {
  enabled: false,
};

/**
 * Load OCR configuration from localStorage.
 * Falls back to DEFAULT_OCR_CONFIG when absent or malformed.
 * Safe to call server-side.
 */
export function loadOcrConfig(): OcrConfig {
  if (typeof window === "undefined") return DEFAULT_OCR_CONFIG;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_OCR_CONFIG;

  try {
    const json = JSON.parse(raw);
    const result = ocrConfigSchema.safeParse(json);
    return result.success ? result.data : DEFAULT_OCR_CONFIG;
  } catch {
    return DEFAULT_OCR_CONFIG;
  }
}

/**
 * Persist OCR configuration to localStorage.
 */
export function saveOcrConfig(config: OcrConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
