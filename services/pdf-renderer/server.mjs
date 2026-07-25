import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer";

const PORT = Number(process.env.PORT || "8080");
const MAX_BODY_BYTES = 25 * 1024 * 1024;
const TOKEN = process.env.PDF_RENDERER_TOKEN || "";

/**
 * Bounded integer env parser. Invalid/out-of-range values fall back to a
 * safe default AND log a config_invalid event instead of silently producing
 * NaN (which would otherwise poison every downstream deadline computation).
 */
function parseBoundedInt(raw, min, max, fallback) {
  if (raw === undefined || raw === null || raw === "") return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    console.error(JSON.stringify({ evt: "config_invalid", raw: String(raw), min, max, fallback }));
    return fallback;
  }
  return parsed;
}

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

const MAX_CONCURRENCY = parseBoundedInt(process.env.PDF_MAX_CONCURRENCY, 1, 4, 2);
// Body/upload admission is a separate, cheaper budget than render
// concurrency — a burst of slow uploads must not exhaust the expensive
// browser-page slots (§4.4: "Upload/body admission là budget rẻ riêng").
const BODY_ADMISSION_MAX = parseBoundedInt(
  process.env.PDF_BODY_ADMISSION_MAX,
  1,
  64,
  Math.max(8, MAX_CONCURRENCY * 4),
);
const SHUTDOWN_GRACE_MS = parseBoundedInt(process.env.PDF_SHUTDOWN_GRACE_MS, 1_000, 60_000, 15_000);
const RENDER_DEADLINE_MS = parseBoundedInt(process.env.PDF_RENDER_DEADLINE_MS, 5_000, 120_000, 40_000);
let BODY_READ_TIMEOUT_MS = parseBoundedInt(process.env.PDF_BODY_READ_TIMEOUT_MS, 1_000, 60_000, 15_000);
if (BODY_READ_TIMEOUT_MS >= RENDER_DEADLINE_MS) {
  console.error(
    JSON.stringify({
      evt: "config_invalid",
      reason: "PDF_BODY_READ_TIMEOUT_MS must be < PDF_RENDER_DEADLINE_MS",
      bodyReadTimeoutMs: BODY_READ_TIMEOUT_MS,
      renderDeadlineMs: RENDER_DEADLINE_MS,
    }),
  );
  BODY_READ_TIMEOUT_MS = Math.max(1_000, Math.floor(RENDER_DEADLINE_MS / 2));
}

const disableSandbox = process.env.PUPPETEER_DISABLE_SANDBOX === "true";
const LAUNCH_ARGS = [
  "--disable-background-networking",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-extensions",
  "--disable-sync",
  "--disable-dev-shm-usage",
  "--no-first-run",
  ...(disableSandbox ? ["--no-sandbox"] : []),
];

function tokenMatches(candidate = "") {
  if (!TOKEN) return true;
  const expected = Buffer.from(TOKEN);
  const actual = Buffer.from(candidate);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

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

export function createBrowserManager({ launch } = {}) {
  const launchFn = launch ?? (() => puppeteer.launch({ headless: true, args: LAUNCH_ARGS }));
  let browser = null;
  let launchPromise = null;
  let state = "starting";
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
    warmUp() {
      return ensure().catch(() => undefined);
    },
  };
}

/**
 * Reads request body with total deadline and slowloris protection timer.
 * `deadlineAt` is the SAME handler-entry deadline used for rendering (§4.4:
 * "Deadline bắt đầu tại handler entry và bao trùm toàn request"), so a slow
 * body read eats into the same budget as the render phase rather than
 * getting its own separate allowance.
 */
function readBody(request, signal, deadlineAt) {
  return new Promise((resolve, reject) => {
    const remainingDeadline = Math.max(1, deadlineAt - Date.now());
    const timeoutMs = Math.min(BODY_READ_TIMEOUT_MS, remainingDeadline);

    const timer = setTimeout(() => {
      reject(Object.assign(new Error("body-timeout"), { statusCode: 408 }));
      request.destroy();
    }, timeoutMs);

    const onAbort = () => {
      clearTimeout(timer);
      reject(Object.assign(new Error("aborted"), { code: "ABORTED" }));
    };

    if (signal?.aborted) {
      onAbort();
      return;
    }

    signal?.addEventListener?.("abort", onAbort, { once: true });

    const chunks = [];
    let size = 0;

    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        clearTimeout(timer);
        signal?.removeEventListener?.("abort", onAbort);
        reject(Object.assign(new Error("body-too-large"), { statusCode: 413 }));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on("end", () => {
      clearTimeout(timer);
      signal?.removeEventListener?.("abort", onAbort);
      resolve(Buffer.concat(chunks).toString("utf8"));
    });

    request.on("error", (err) => {
      clearTimeout(timer);
      signal?.removeEventListener?.("abort", onAbort);
      reject(err);
    });
  });
}

/**
 * Renders one job in its own incognito BrowserContext so cookies,
 * localStorage, cache and service workers never leak between concurrent
 * jobs sharing the same Chromium process (§4.4/E: "Mỗi job dùng
 * BrowserContext riêng"). The context (and every page in it) is always
 * closed in `finally`, even on abort/timeout/error.
 */
export async function renderPdf(browser, html, signal, deadlineAt) {
  if (signal?.aborted) throw Object.assign(new Error("aborted"), { code: "ABORTED" });
  let context;
  let page;
  const onAbort = () => {
    void page?.close().catch(() => undefined);
  };
  signal?.addEventListener?.("abort", onAbort, { once: true });

  const remaining = () => Math.max(1, deadlineAt - Date.now());

  try {
    context = await browser.createBrowserContext();
    page = await context.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on("request", (outbound) => {
      const url = outbound.url();
      // Strict egress deny: only about:blank and data: URIs are allowed
      if (url === "about:blank" || url.startsWith("data:")) {
        outbound.continue();
      } else {
        outbound.abort("blockedbyclient");
      }
    });

    await page.setContent(html, { waitUntil: "load", timeout: remaining() });
    if (signal?.aborted) throw Object.assign(new Error("aborted"), { code: "ABORTED" });
    await page.emulateMediaType("print");
    return await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true, timeout: remaining() });
  } finally {
    signal?.removeEventListener?.("abort", onAbort);
    await page?.close().catch(() => undefined);
    await context?.close().catch(() => undefined);
  }
}

const metrics = { rendered: 0, rejected: 0, failed: 0 };

export function createRequestHandler({ bodyAdmission, admission, manager }) {
  return async function handle(request, response) {
    response.setHeader("Cache-Control", "no-store");

    if (request.method === "GET" && request.url === "/health") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end('{"ok":true}');
      return;
    }
    if (request.method === "GET" && request.url === "/ready") {
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

    if (manager.state === "draining") {
      metrics.rejected += 1;
      response.writeHead(503, { "Content-Type": "application/json", "Retry-After": "5" });
      response.end('{"error":"Service draining"}');
      return;
    }

    // Cheap upload admission — separate from (and higher-capacity than) the
    // render concurrency slot, so a burst of slow bodies can't starve it.
    if (!bodyAdmission.tryAcquire()) {
      metrics.rejected += 1;
      response.writeHead(503, { "Content-Type": "application/json", "Retry-After": "2" });
      response.end('{"error":"Too many uploads in flight"}');
      return;
    }

    // Deadline starts here (handler entry) and covers body read AND render.
    const startedAt = Date.now();
    const deadlineAt = startedAt + RENDER_DEADLINE_MS;

    const abortController = new AbortController();
    let completed = false;
    const onClose = () => {
      if (!completed) abortController.abort();
    };
    request.on("close", onClose);

    let html;
    try {
      html = await readBody(request, abortController.signal, deadlineAt);
    } catch (error) {
      completed = true;
      bodyAdmission.release();
      request.removeListener("close", onClose);
      if (error?.code === "ABORTED" || abortController.signal.aborted) {
        if (!response.writableEnded) response.destroy();
      } else {
        const status = error?.statusCode === 413 ? 413 : error?.statusCode === 408 ? 408 : 400;
        if (!response.writableEnded) {
          response.writeHead(status, { "Content-Type": "application/json" });
          response.end(
            JSON.stringify({
              error: status === 413 ? "Document too large" : status === 408 ? "Body read timeout" : "Bad request",
            }),
          );
        }
      }
      console.log(
        JSON.stringify({ evt: "render", phase: "body_read", durMs: Date.now() - startedAt, ok: false }),
      );
      return;
    }
    bodyAdmission.release();

    // Only NOW — after auth + body fully validated — acquire the expensive
    // render concurrency slot and fetch the browser (§4.4: "Không lấy
    // browser trước khi body hoàn tất").
    if (!admission.tryAcquire()) {
      metrics.rejected += 1;
      completed = true;
      request.removeListener("close", onClose);
      response.writeHead(503, { "Content-Type": "application/json", "Retry-After": "2" });
      response.end('{"error":"Renderer at capacity"}');
      return;
    }

    try {
      const browser = await manager.getBrowser();
      const pdf = await renderPdf(browser, html, abortController.signal, deadlineAt);
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
      if (error?.code === "ABORTED" || abortController.signal.aborted) {
        if (!response.writableEnded) response.destroy();
      } else {
        const status = error?.statusCode === 413 ? 413 : error?.statusCode === 408 ? 408 : 500;
        if (status !== 413 && status !== 408) metrics.failed += 1;
        if (!response.writableEnded) {
          response.writeHead(status, { "Content-Type": "application/json" });
          response.end(
            JSON.stringify({
              error:
                status === 413
                  ? "Document too large"
                  : status === 408
                  ? "Body read timeout"
                  : "Render failed",
            }),
          );
        }
      }
    } finally {
      request.removeListener("close", onClose);
      admission.release();
      console.log(
        JSON.stringify({
          evt: "render",
          durMs: Date.now() - startedAt,
          active: admission.active,
          bodyActive: bodyAdmission.active,
          rendered: metrics.rendered,
          rejected: metrics.rejected,
          failed: metrics.failed,
          relaunches: manager.relaunchCount,
        }),
      );
    }
  };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  assertRendererTokenSecure();
  const bodyAdmission = createAdmissionController(BODY_ADMISSION_MAX);
  const admission = createAdmissionController(MAX_CONCURRENCY);
  const manager = createBrowserManager();
  await manager.warmUp();
  const server = createServer(createRequestHandler({ bodyAdmission, admission, manager }));

  // Enforce HTTP slowloris timeouts
  server.requestTimeout = 30_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;

  server.listen(PORT, "0.0.0.0");
  console.log(
    JSON.stringify({
      evt: "listening",
      port: PORT,
      maxConcurrency: MAX_CONCURRENCY,
      bodyAdmissionMax: BODY_ADMISSION_MAX,
    }),
  );

  let shuttingDown = false;
  async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    manager.beginDraining();
    server.close();
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
