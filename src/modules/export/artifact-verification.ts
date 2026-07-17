import JSZip from "jszip";
import type { ExportArtifact, ExportTarget } from "@/types";

export const EXPORT_MEDIA_TYPES: Record<ExportTarget, string> = {
  html: "text/html;charset=utf-8",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

function bytesStartWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}

export async function sha256Blob(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function verifyArtifactBlob(target: ExportTarget, input: Blob): Promise<Blob> {
  const mediaType = EXPORT_MEDIA_TYPES[target];
  const blob = input.type === mediaType ? input : new Blob([input], { type: mediaType });
  if (blob.size === 0) throw new Error(`${target.toUpperCase()} artifact is empty.`);

  const bytes = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
  if (target === "pdf" && !bytesStartWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    throw new Error("PDF artifact does not start with %PDF-.");
  }
  if ((target === "docx" || target === "pptx") && !bytesStartWith(bytes, [0x50, 0x4b, 0x03, 0x04])) {
    throw new Error(`${target.toUpperCase()} artifact is not a ZIP container.`);
  }
  if (target === "html") {
    const html = await blob.text();
    if (!/^\s*<!doctype html>/iu.test(html)) throw new Error("HTML artifact is not a complete document.");
    if (/<script\b/iu.test(html)) throw new Error("Offline HTML must not contain scripts.");
    if (/<(?:img|link|script)\b[^>]*(?:src|href)\s*=\s*["']https?:/iu.test(html)) {
      throw new Error("Offline HTML contains a network-loaded resource.");
    }
    if (!/<meta\b[^>]*http-equiv=["']Content-Security-Policy["']/iu.test(html)) {
      throw new Error("Offline HTML is missing its Content Security Policy.");
    }
  }
  if (target === "docx" || target === "pptx") {
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const required = target === "docx"
      ? ["[Content_Types].xml", "word/document.xml"]
      : ["[Content_Types].xml", "ppt/presentation.xml"];
    for (const entry of required) {
      if (!zip.file(entry)) throw new Error(`${target.toUpperCase()} is missing ${entry}.`);
    }
  }
  return blob;
}

export async function createVerifiedArtifact(input: {
  target: ExportTarget;
  blob: Blob;
  fileName: string;
  generatedAt?: string;
}): Promise<ExportArtifact> {
  const blob = await verifyArtifactBlob(input.target, input.blob);
  return {
    target: input.target,
    blob,
    mediaType: EXPORT_MEDIA_TYPES[input.target],
    fileName: input.fileName,
    byteLength: blob.size,
    sha256: await sha256Blob(blob),
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    verified: true,
  };
}
