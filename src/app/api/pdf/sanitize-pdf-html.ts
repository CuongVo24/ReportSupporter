/**
 * Best-effort pre-filtering pass to strip known dangerous HTML elements and remote resources prior to PDF rendering.
 *
 * IMPORTANT: This regex-based function is a secondary, best-effort defense layer only.
 * Primary security isolation and SSRF defense are enforced at the renderer level via
 * (see services/pdf-renderer/server.mjs + docker-compose.pdf.yml, W25-E):
 *   1. Chromium's own process sandbox (not disabled unless PUPPETEER_DISABLE_SANDBOX=true)
 *      plus container hardening: cap_drop: ALL, no-new-privileges, read-only rootfs,
 *      non-root user. This is NOT gVisor/runsc — no such runtime is configured; do not
 *      claim it here without an actual deployment change that adds it.
 *   2. Disabled JavaScript execution (setJavaScriptEnabled: false).
 *   3. Request interception blocking every outbound URL except about:blank/data:
 *      (app-level, defense-in-depth) PLUS a Docker `internal: true` network with no
 *      route to the real internet (container-level, the actual egress-deny boundary).
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
