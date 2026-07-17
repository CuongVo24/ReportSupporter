import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import puppeteer from "puppeteer";

const PORT = Number(process.env.PORT || "8080");
const MAX_BODY_BYTES = 25 * 1024 * 1024;
const TIMEOUT_MS = 30_000;
const TOKEN = process.env.PDF_RENDERER_TOKEN || "";

function tokenMatches(candidate = "") {
  if (!TOKEN) return true;
  const expected = Buffer.from(TOKEN);
  const actual = Buffer.from(candidate);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error("body-too-large"), { statusCode: 413 }));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

const browser = await puppeteer.launch({
  headless: true,
  args: [
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-sync",
    "--no-first-run",
    "--no-sandbox",
  ],
});

const server = createServer(async (request, response) => {
  response.setHeader("Cache-Control", "no-store");
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end('{"ok":true}');
    return;
  }
  if (request.method !== "POST" || request.url !== "/render") {
    response.writeHead(404).end();
    return;
  }
  if (!tokenMatches(request.headers["x-render-token"])) {
    response.writeHead(401).end();
    return;
  }

  let page;
  try {
    const html = await readBody(request);
    page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on("request", (outbound) => {
      const url = outbound.url();
      if (url === "about:blank" || url.startsWith("data:")) outbound.continue();
      else outbound.abort("blockedbyclient");
    });
    await page.setContent(html, { waitUntil: "load", timeout: TIMEOUT_MS });
    await page.emulateMediaType("print");
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      timeout: TIMEOUT_MS,
    });
    response.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.byteLength),
      "X-Content-Type-Options": "nosniff",
    });
    response.end(pdf);
  } catch (error) {
    const status = error?.statusCode === 413 ? 413 : 500;
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: status === 413 ? "Document too large" : "Render failed" }));
  } finally {
    await page?.close().catch(() => undefined);
  }
});

server.listen(PORT, "0.0.0.0");

async function shutdown() {
  server.close();
  await browser.close();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
