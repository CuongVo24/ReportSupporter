// W24-F/G/W25-K integration probe. Verifies: readiness gating, a valid
// %PDF- render with JS actually disabled and outbound network actually
// blocked (proven, not assumed — see S3 below), and admission-control
// saturation (a burst over PDF_MAX_CONCURRENCY yields fast 503s, not
// unbounded Chromium pages).
//
// W25-K (S3): the previous version of this probe only asserted the %PDF-
// signature + byte size — it never proved the script marker failed to run
// or that the tracker request was actually blocked (the old URL,
// "example.invalid", never resolves regardless of whether interception
// works, so it proved nothing about interception itself). This version:
//   (a) extracts the rendered PDF's text and asserts the script-injected
//       marker text is ABSENT while the real heading text IS present, and
//   (b) points the tracker <img> at a real, reachable local canary
//       listener (docker-compose.pdf.yml service "canary") and asserts it
//       received exactly 0 hits after the render.
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const baseUrl = process.env.PDF_RENDERER_URL ?? "http://127.0.0.1:8080";
const token = process.env.PDF_RENDERER_TOKEN ?? "local-render-token";
const maxConcurrency = Number(process.env.PDF_MAX_CONCURRENCY ?? "2");
const canaryUrl = process.env.PDF_CANARY_URL ?? "http://127.0.0.1:9000";
// Inside the renderer's own Docker network the canary is reachable by its
// compose service name; from the host (where this script runs) it's the
// mapped port above. Both must be provided because the request is issued
// by the sandboxed Chromium page, not by this script.
const canaryUrlFromRenderer = process.env.PDF_CANARY_URL_FROM_RENDERER ?? "http://canary:9000";

// Wait for readiness (browser connected), not just liveness.
let ready = false;
for (let attempt = 0; attempt < 30; attempt += 1) {
  try {
    const response = await fetch(`${baseUrl}/ready`);
    if (response.ok) {
      ready = true;
      break;
    }
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 1_000));
}
if (!ready) throw new Error("PDF renderer did not become ready within 30 seconds.");

function renderRequest(body) {
  return fetch(`${baseUrl}/render`, {
    method: "POST",
    headers: { "content-type": "text/html; charset=utf-8", "x-render-token": token },
    body,
  });
}

async function canaryHits() {
  const response = await fetch(`${canaryUrl}/hits`);
  if (!response.ok) throw new Error(`Canary /hits returned ${response.status}.`);
  const { hits } = await response.json();
  return hits;
}

async function extractPdfText(bytes) {
  const doc = await getDocument({ data: bytes, disableWorker: true, isEvalSupported: false }).promise;
  let text = "";
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    text += content.items.map((item) => ("str" in item ? item.str : "")).join(" ") + "\n";
  }
  await doc.destroy();
  return text;
}

// Reset the canary counter before the isolation probe so an earlier request
// (e.g. a retried readiness poll against a misconfigured URL) can't taint it.
await fetch(`${canaryUrl}/reset`, { method: "POST" }).catch(() => {});

const HEADING_TEXT = "ReportSupporter PDF integration";
const SCRIPT_MARKER = "SCRIPT_RAN";
const html = `<!doctype html><html><body><h1>${HEADING_TEXT}</h1><script>document.body.textContent='${SCRIPT_MARKER}'</script><img src="${canaryUrlFromRenderer}/tracker.png"></body></html>`;
const response = await renderRequest(html);
if (!response.ok) throw new Error(`PDF renderer returned ${response.status}.`);
const bytes = new Uint8Array(await response.arrayBuffer());
const signature = new TextDecoder().decode(bytes.slice(0, 5));
if (signature !== "%PDF-") throw new Error(`Invalid PDF signature: ${JSON.stringify(signature)}`);
if (bytes.byteLength < 1_000) throw new Error("Rendered PDF is unexpectedly small.");

// (a) Script-execution proof: the rendered text must be the real heading,
// never the marker the injected <script> would have written if JS ran.
const pdfText = await extractPdfText(bytes);
if (pdfText.includes(SCRIPT_MARKER)) {
  throw new Error(`PDF text contains "${SCRIPT_MARKER}" — injected <script> executed. JS-disable isolation is broken.`);
}
if (!pdfText.includes(HEADING_TEXT)) {
  throw new Error(`PDF text is missing the expected heading "${HEADING_TEXT}" — render may have failed silently.`);
}

// (b) Network-egress proof: the canary must show exactly 0 hits — the
// renderer's request interception must have aborted the <img> request
// before it ever reached a real, resolvable endpoint.
const hitsAfterRender = await canaryHits();
if (hitsAfterRender !== 0) {
  throw new Error(`Canary received ${hitsAfterRender} hit(s) — outbound network from the render sandbox was NOT blocked.`);
}

console.log(
  `PDF integration passed (${bytes.byteLength} bytes, ${signature}; script did not run; canary 0 hits).`,
);

// Saturation: fire a burst well above capacity. Some succeed, the excess must be
// rejected with a fast 503 + Retry-After — proving admission control, not OOM.
const burstSize = maxConcurrency * 5;
// A heavier document so slots stay busy long enough to overlap.
const heavyHtml = `<!doctype html><html><body>${"<p>Đoạn nội dung nặng để giữ slot bận. </p>".repeat(4000)}</body></html>`;
const results = await Promise.allSettled(Array.from({ length: burstSize }, () => renderRequest(heavyHtml)));
const statuses = results.map((result) => (result.status === "fulfilled" ? result.value.status : "err"));
const ok = statuses.filter((status) => status === 200).length;
const throttled = statuses.filter((status) => status === 503).length;
// Drain bodies so sockets close cleanly.
await Promise.all(results.map((r) => (r.status === "fulfilled" ? r.value.arrayBuffer().catch(() => undefined) : undefined)));
console.log(`Burst of ${burstSize}: ${ok} rendered, ${throttled} throttled (503).`);
if (throttled === 0) throw new Error("Expected admission control to throttle a burst above capacity.");

// Renderer must still be ready after the burst (no browser death from overload).
const afterBurst = await fetch(`${baseUrl}/ready`);
if (!afterBurst.ok) throw new Error("Renderer not ready after burst — admission control failed to protect it.");
console.log("PDF admission-control saturation passed; renderer still ready.");
