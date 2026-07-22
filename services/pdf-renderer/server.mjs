import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer";

const PORT = Number(process.env.PORT || "8080");
const MAX_BODY_BYTES = 25 * 1024 * 1024;
const TOKEN = process.env.PDF_RENDERER_TOKEN || "";

// W24-F: bounded capacity envelope. Default conservative (2); clamp to 1..4 so a
// misconfigured env can never uncap the renderer. Do NOT raise without burst/heap
// evidence (see contract lock).
function readConcurrency(raw) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) return 2;
  return Math.min(4, Math.max(1, parsed));
}
// W24-H: a production renderer must not start open (empty token) or with the
// local default token — either would leave the render endpoint unauthenticated.
const LOCAL_DEFAULT_PDF_TOKEN = "local-render-token";
function assertRendererTokenSecure() {
  if (process.env.NODE_ENV !== "production") return;
  const token = (process.env.PDF_RENDERER_TOKEN || "").trim();
  if (!token) {
    throw new Error("PDF_RENDERER_TOKEN rỗng trong production — renderer sẽ mở cho mọi request. Cấp token bí mật.");
  }
  if (token === LOCAL_DEFAULT_PDF_TOKEN) {
    throw new Error("PDF_RENDERER_TOKEN đang là token mặc định local trong production. Cấp token riêng.");
  }
}

const MAX_CONCURRENCY = readConcurrency(process.env.PDF_MAX_CONCURRENCY);
const SHUTDOWN_GRACE_MS = Number(process.env.PDF_SHUTDOWN_GRACE_MS || "15000");
// W24-G: ONE total deadline for setContent+pdf combined (not two independent
// 30s timeouts). Must be < gateway deadline (default 45s) < client (50s).
const RENDER_DEADLINE_MS = Number(process.env.PDF_RENDER_DEADLINE_MS || "40000");

const LAUNCH_ARGS = [
  "--disable-background-networking",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-extensions",
  "--disable-sync",
  "--no-first-run",
  "--no-sandbox",
];

function tokenMatches(candidate = "") {
  if (!TOKEN) return true;
  const expected = Buffer.from(TOKEN);
  const actual = Buffer.from(candidate);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// ---------------------------------------------------------------------------
// Admission controller — a process-wide semaphore. Requests are admitted BEFORE
// the body is read or a page is created; over-capacity requests are rejected fast.
// No unbounded queue: tryAcquire either grants a slot or returns false.
// ---------------------------------------------------------------------------
export function createAdmissionController(max) {
  let active = 0;
  return {
    tryAcquire() {
      if (active >= max) return false;
      active += 1;
      return true;
    },
    release() {
      if (active > 0) active -= 1;
    },
    get active() {
      return active;
    },
    get max() {
      return max;
    },
  };
}

// ---------------------------------------------------------------------------
// Browser lifecycle manager — single-flight launch + state machine. Replaces the
// immutable `const browser`. On disconnect, readiness goes red and exactly one
// relaunch runs (guarded by launchPromise). getBrowser retries at most once, and
// only BEFORE any render work has started.
// ---------------------------------------------------------------------------
export function createBrowserManager({ launch } = {}) {
  const launchFn = launch ?? (() => puppeteer.launch({ headless: true, args: LAUNCH_ARGS }));
  let browser = null;
  let launchPromise = null;
  let state = "starting"; // starting | ready | disconnected | draining
  let relaunchCount = 0;

  function attach(instance) {
    browser = instance;
    state = "ready";
    instance.on("disconnected", () => {
      if (state === "draining") return;
      browser = null;
      launchPromise = null;
      state = "disconnected";
    });
  }

  async function ensure() {
    if (state === "draining") throw Object.assign(new Error("draining"), { code: "DRAINING" });
    if (browser && browser.connected !== false && state === "ready") return browser;
    if (!launchPromise) {
      relaunchCount += 1;
      launchPromise = Promise.resolve()
        .then(launchFn)
        .then((instance) => {
          attach(instance);
          return instance;
        })
        .catch((error) => {
          launchPromise = null;
          state = "disconnected";
          throw error;
        });
    }
    return launchPromise;
  }

  return {
    // Retry once before render if the first acquire hands back a dead browser.
    async getBrowser() {
      let instance = await ensure();
      if (instance.connected === false) instance = await ensure();
      return instance;
    },
    isReady() {
      return state === "ready" && browser !== null && browser.connected !== false;
    },
    beginDraining() {
      state = "draining";
    },
    async close() {
      state = "draining";
      const instance = browser;
      browser = null;
      launchPromise = null;
      await instance?.close?.().catch(() => undefined);
    },
    get state() {
      return state;
    },
    get relaunchCount() {
      return relaunchCount;
    },
    // First launch is kicked off eagerly at boot.
    warmUp() {
      return ensure().catch(() => undefined);
    },
  };
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

async function renderPdf(browser, html, signal) {
  if (signal?.aborted) throw Object.assign(new Error("aborted"), { code: "ABORTED" });
  let page;
  // Close the page immediately if the client disconnects mid-render so the slot
  // and Chromium resources are released without waiting for the deadline.
  const onAbort = () => { void page?.close().catch(() => undefined); };
  signal?.addEventListener?.("abort", onAbort, { once: true });
  // Single shared budget across setContent + pdf.
  const deadlineAt = Date.now() + RENDER_DEADLINE_MS;
  const remaining = () => Math.max(1, deadlineAt - Date.now());
  try {
    page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on("request", (outbound) => {
      const url = outbound.url();
      if (url === "about:blank" || url.startsWith("data:")) outbound.continue();
      else outbound.abort("blockedbyclient");
    });
    await page.setContent(html, { waitUntil: "load", timeout: remaining() });
    if (signal?.aborted) throw Object.assign(new Error("aborted"), { code: "ABORTED" });
    await page.emulateMediaType("print");
    return await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true, timeout: remaining() });
  } finally {
    signal?.removeEventListener?.("abort", onAbort);
    await page?.close().catch(() => undefined);
  }
}

// Aggregate-only metrics. Never log HTML/PDF/token/URL.
const metrics = { rendered: 0, rejected: 0, failed: 0 };

export function createRequestHandler({ admission, manager }) {
  return async function handle(request, response) {
    response.setHeader("Cache-Control", "no-store");

    if (request.method === "GET" && request.url === "/health") {
      // Liveness: the process is up and serving.
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end('{"ok":true}');
      return;
    }
    if (request.method === "GET" && request.url === "/ready") {
      // Readiness: browser connected AND not draining. No false-ready.
      const ready = manager.isReady();
      response.writeHead(ready ? 200 : 503, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ ready, active: admission.active, max: admission.max }));
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

    // Admission BEFORE readBody/newPage: over-capacity is rejected fast, cheaply.
    if (manager.state === "draining") {
      metrics.rejected += 1;
      response.writeHead(503, { "Content-Type": "application/json", "Retry-After": "5" });
      response.end('{"error":"Service draining"}');
      return;
    }
    if (!admission.tryAcquire()) {
      metrics.rejected += 1;
      response.writeHead(503, { "Content-Type": "application/json", "Retry-After": "2" });
      response.end('{"error":"Renderer at capacity"}');
      return;
    }

    const startedAt = Date.now();
    // Bridge the client connection lifecycle to an AbortController: if the client
    // disconnects before we finish, abort the in-flight render (page closes, slot
    // frees). Cancellation is its own outcome — it never triggers a browser relaunch.
    const abortController = new AbortController();
    let completed = false;
    const onClose = () => { if (!completed) abortController.abort(); };
    request.on("close", onClose);
    try {
      const browser = await manager.getBrowser();
      const html = await readBody(request);
      const pdf = await renderPdf(browser, html, abortController.signal);
      completed = true;
      metrics.rendered += 1;
      if (!response.writableEnded) {
        response.writeHead(200, {
          "Content-Type": "application/pdf",
          "Content-Length": String(pdf.byteLength),
          "X-Content-Type-Options": "nosniff",
        });
        response.end(pdf);
      }
    } catch (error) {
      completed = true;
      // Client-abort: don't write after the socket is gone, don't count as failure.
      if (error?.code === "ABORTED" || abortController.signal.aborted) {
        if (!response.writableEnded) response.destroy();
      } else {
        const status = error?.statusCode === 413 ? 413 : 500;
        if (status !== 413) metrics.failed += 1;
        if (!response.writableEnded) {
          response.writeHead(status, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ error: status === 413 ? "Document too large" : "Render failed" }));
        }
      }
    } finally {
      request.removeListener("close", onClose);
      admission.release();
      // Aggregate log line only — no user content.
      console.log(
        JSON.stringify({
          evt: "render",
          durMs: Date.now() - startedAt,
          active: admission.active,
          rendered: metrics.rendered,
          rejected: metrics.rejected,
          failed: metrics.failed,
          relaunches: manager.relaunchCount,
        }),
      );
    }
  };
}

// --- Bootstrap (only when run directly, so the factories stay unit-testable) ---
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  assertRendererTokenSecure(); // fail fast before binding the port
  const admission = createAdmissionController(MAX_CONCURRENCY);
  const manager = createBrowserManager();
  await manager.warmUp();
  const server = createServer(createRequestHandler({ admission, manager }));
  server.listen(PORT, "0.0.0.0");
  console.log(JSON.stringify({ evt: "listening", port: PORT, maxConcurrency: MAX_CONCURRENCY }));

  let shuttingDown = false;
  async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    manager.beginDraining(); // stop admitting new jobs
    server.close();
    // Wait for in-flight jobs within a bounded grace window, then force close.
    const deadline = Date.now() + SHUTDOWN_GRACE_MS;
    while (admission.active > 0 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    await manager.close();
    process.exit(0);
  }
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
