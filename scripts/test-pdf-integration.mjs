const baseUrl = process.env.PDF_RENDERER_URL ?? "http://127.0.0.1:8080";
const token = process.env.PDF_RENDERER_TOKEN ?? "local-render-token";

let healthy = false;
for (let attempt = 0; attempt < 30; attempt += 1) {
  try {
    const response = await fetch(`${baseUrl}/health`);
    if (response.ok) {
      healthy = true;
      break;
    }
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 1_000));
}
if (!healthy) throw new Error("PDF renderer did not become healthy within 30 seconds.");

const html = `<!doctype html><html><body><h1>ReportSupporter PDF integration</h1><script>document.body.textContent='SCRIPT_RAN'</script><img src="https://example.invalid/tracker.png"></body></html>`;
const response = await fetch(`${baseUrl}/render`, {
  method: "POST",
  headers: { "content-type": "text/html; charset=utf-8", "x-render-token": token },
  body: html,
});
if (!response.ok) throw new Error(`PDF renderer returned ${response.status}.`);
const bytes = new Uint8Array(await response.arrayBuffer());
const signature = new TextDecoder().decode(bytes.slice(0, 5));
if (signature !== "%PDF-") throw new Error(`Invalid PDF signature: ${JSON.stringify(signature)}`);
if (bytes.byteLength < 1_000) throw new Error("Rendered PDF is unexpectedly small.");
console.log(`PDF integration passed (${bytes.byteLength} bytes, ${signature}).`);
