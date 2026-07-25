/**
 * Best-effort pre-filtering pass to strip known dangerous HTML elements and remote resources prior to PDF rendering.
 *
 * IMPORTANT: This regex-based function is a secondary, best-effort defense layer only.
 * Primary security isolation and SSRF defense MUST BE and IS enforced at the renderer container level via:
 *   1. Chromium process sandboxing / gVisor isolation (W25-E).
 *   2. Disabled JavaScript execution (setJavaScriptEnabled: false).
 *   3. Strict network egress interception (blocking http:, https:, ws:, file: outbound requests).
 */
export function stripKnownPdfHazardsBestEffort(input: string): string {
  return input
    // Strip <script> blocks
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, "")
    // Strip embedded frames and objects
    .replace(/<(?:iframe|object|embed)\b[^>]*>[\s\S]*?(?:<\/(?:iframe|object|embed)>|\/>)/giu, "")
    // Strip inline event handlers (onerror, onload, etc.)
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*')/giu, "")
    // Strip remote http/https resource URLs in img, link, svg, and CSS url(...)
    .replace(/(<(?:img|link)\b[^>]*(?:src|href)\s*=\s*)["']https?:\/\/[^"']*["']/giu, "$1\"\"")
    .replace(/url\(\s*["']?https?:\/\/[^"')]+\s*["']?\)/giu, "url()");
}

/** Legacy alias kept for backwards compatibility across imports */
export const sanitizePdfHtml = stripKnownPdfHazardsBestEffort;
