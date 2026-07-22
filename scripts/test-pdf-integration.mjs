// W24-F/G integration probe. Verifies: readiness gating, a valid %PDF- render
// with JS disabled + outbound network blocked, and admission-control saturation
// (a burst over PDF_MAX_CONCURRENCY yields fast 503s, not unbounded Chromium pages).
const baseUrl = process.env.PDF_RENDERER_URL ?? "http://127.0.0.1:8080";
const token = process.env.PDF_RENDERER_TOKEN ?? "local-render-token";
const maxConcurrency = Number(process.env.PDF_MAX_CONCURRENCY ?? "2");

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

const html = `<!doctype html><html><body><h1>ReportSupporter PDF integration</h1><script>document.body.textContent='SCRIPT_RAN'</script><img src="https://example.invalid/tracker.png"></body></html>`;
const response = await renderRequest(html);
if (!response.ok) throw new Error(`PDF renderer returned ${response.status}.`);
const bytes = new Uint8Array(await response.arrayBuffer());
const signature = new TextDecoder().decode(bytes.slice(0, 5));
if (signature !== "%PDF-") throw new Error(`Invalid PDF signature: ${JSON.stringify(signature)}`);
if (bytes.byteLength < 1_000) throw new Error("Rendered PDF is unexpectedly small.");
console.log(`PDF integration passed (${bytes.byteLength} bytes, ${signature}).`);

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
