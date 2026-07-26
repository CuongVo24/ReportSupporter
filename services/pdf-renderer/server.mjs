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
export function parseBoundedInt(raw, min, max, fallback) {
  if (raw === undefined || raw === null || raw === "") return fallback;
  const normalized = String(raw).trim();
  const parsed = /^\d+$/u.test(normalized) ? Number(normalized) : Number.NaN;
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    if (process.env.NODE_ENV !== "test") {
      throw new Error(`Invalid integer renderer config: expected ${min}..${max}.`);
    }
    console.error(JSON.stringify({ evt: "config_invalid", raw: String(raw), min, max, fallback }));
    return fallback;
  }
  return parsed;
}

const LOCAL_DEFAULT_PDF_TOKEN = "local-render-token";
export function assertRendererTokenSecure() {
  // Only explicit test runs may skip auth entirely. Any other environment
  // (production, staging, plain `node server.mjs` with NODE_ENV unset) must
  // fail boot on an empty/default token rather than silently fail open.
  if (process.env.NODE_ENV === "test") return;
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
const MAX_OUTPUT_BYTES = parseBoundedInt(
  process.env.PDF_MAX_OUTPUT_BYTES,
  1 * 1024 * 1024,
  100 * 1024 * 1024,
  50 * 1024 * 1024,
);
let BODY_READ_TIMEOUT_MS = parseBoundedInt(process.env.PDF_BODY_READ_TIMEOUT_MS, 1_000, 60_000, 15_000);
if (BODY_READ_TIMEOUT_MS >= RENDER_DEADLINE_MS) {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("PDF_BODY_READ_TIMEOUT_MS must be < PDF_RENDER_DEADLINE_MS.");
  }
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
    const chunks = [];
    let size = 0;
    let idleTimer;
    let settled = false;

    const cleanup = () => {
      clearTimeout(idleTimer);
      signal?.removeEventListener?.("abort", onAbort);
      request.removeListener("data", onData);
      request.removeListener("end", onEnd);
      request.removeListener("error", onError);
      request.removeListener("aborted", onRequestAborted);
    };
    const fail = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      const remaining = deadlineAt - Date.now();
      if (remaining <= 0) {
        fail(Object.assign(new Error("body-total-timeout"), { code: "DEADLINE", statusCode: 408 }));
        request.destroy();
        return;
      }
      idleTimer = setTimeout(() => {
        fail(Object.assign(new Error("body-idle-timeout"), { code: "BODY_IDLE", statusCode: 408 }));
        request.destroy();
      }, Math.min(BODY_READ_TIMEOUT_MS, remaining));
    };
    const onAbort = () => {
      const reason = signal?.reason;
      fail(
        reason instanceof Error
          ? reason
          : Object.assign(new Error("aborted"), { code: "ABORTED" }),
      );
    };
    const onRequestAborted = () => {
      fail(Object.assign(new Error("aborted"), { code: "ABORTED" }));
    };
    const onData = (chunk) => {
      if (settled) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        fail(Object.assign(new Error("body-too-large"), { statusCode: 413 }));
        request.destroy();
        return;
      }
      chunks.push(chunk);
      resetIdleTimer();
    };
    const onEnd = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(Buffer.concat(chunks).toString("utf8"));
    };
    const onError = (error) => fail(error);

    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener?.("abort", onAbort, { once: true });
    request.on("data", onData);
    request.on("end", onEnd);
    request.on("error", onError);
    request.on("aborted", onRequestAborted);
    resetIdleTimer();
  });
}

/**
 * Races `promise` against the overall render deadline. A hung/slow browser
 * launch (e.g. Chromium fails to start) must not block a request forever —
 * it has to fail at the SAME deadline that already bounds body-read and
 * page rendering, not get its own unbounded wait (§4.3: "deadline là timer
 * thật ... phải bao phủ ... dependency acquisition").
 */
export function withDeadline(promise, deadlineAt, message, signal) {
  const remainingMs = Math.max(1, deadlineAt - Date.now());
  let timer;
  let onAbort;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(Object.assign(new Error(message), { code: "BROWSER_DEADLINE", statusCode: 503 }));
    }, remainingMs);
    if (signal) {
      onAbort = () => {
        reject(
          signal.reason instanceof Error
            ? signal.reason
            : Object.assign(new Error("aborted"), { code: "ABORTED" }),
        );
      };
      if (signal.aborted) onAbort();
      else signal.addEventListener("abort", onAbort, { once: true });
    }
  });
  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timer);
    if (onAbort) signal?.removeEventListener("abort", onAbort);
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
  const bounded = (promise, phase) => withDeadline(promise, deadlineAt, phase, signal);

  try {
    context = await bounded(browser.createBrowserContext(), "context-deadline");
    page = await bounded(context.newPage(), "page-deadline");
    await bounded(page.setJavaScriptEnabled(false), "javascript-policy-deadline");
    await bounded(page.setRequestInterception(true), "request-policy-deadline");
    page.on("request", (outbound) => {
      const url = outbound.url();
      // Strict egress deny: only about:blank and data: URIs are allowed
      if (url === "about:blank" || url.startsWith("data:")) {
        outbound.continue();
      } else {
        outbound.abort("blockedbyclient");
      }
    });

    await bounded(page.setContent(html, { waitUntil: "load", timeout: remaining() }), "content-deadline");
    if (signal?.aborted) throw Object.assign(new Error("aborted"), { code: "ABORTED" });
    await bounded(page.emulateMediaType("print"), "media-deadline");
    return await bounded(
      page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true, timeout: remaining() }),
      "pdf-deadline",
    );
  } finally {
    signal?.removeEventListener?.("abort", onAbort);
    await page?.close().catch(() => undefined);
    await context?.close().catch(() => undefined);
  }
}

const metrics = { rendered: 0, rejected: 0, failed: 0 };

export function createRequestHandler({ bodyAdmission, admission, manager, activeJobs = new Set() }) {
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
    const contentType = String(request.headers["content-type"] ?? "").toLowerCase();
    if (!contentType.startsWith("text/html")) {
      response.writeHead(415, { "Content-Type": "application/json" });
      response.end('{"error":"Content-Type must be text/html"}');
      return;
    }
    const declaredLength = Number(request.headers["content-length"] ?? "0");
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      response.writeHead(413, { "Content-Type": "application/json" });
      response.end('{"error":"Document too large"}');
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
    activeJobs.add(abortController);
    let responseCompleted = false;
    let bodyAdmissionHeld = true;
    let renderAdmissionHeld = false;
    const deadlineError = Object.assign(new Error("render-deadline"), {
      code: "DEADLINE",
      statusCode: 408,
    });
    const deadlineTimer = setTimeout(() => abortController.abort(deadlineError), RENDER_DEADLINE_MS);
    const onRequestAborted = () => {
      abortController.abort(Object.assign(new Error("client-aborted-upload"), { code: "ABORTED" }));
    };
    const onResponseClose = () => {
      if (!responseCompleted && !response.writableEnded) {
        abortController.abort(Object.assign(new Error("client-disconnected"), { code: "ABORTED" }));
      }
    };
    request.on("aborted", onRequestAborted);
    response.on?.("close", onResponseClose);
    const releaseBodyAdmission = () => {
      if (!bodyAdmissionHeld) return;
      bodyAdmissionHeld = false;
      bodyAdmission.release();
    };
    const cleanupJob = () => {
      clearTimeout(deadlineTimer);
      request.removeListener("aborted", onRequestAborted);
      response.removeListener?.("close", onResponseClose);
      activeJobs.delete(abortController);
    };

    let html;
    try {
      html = await readBody(request, abortController.signal, deadlineAt);
    } catch (error) {
      releaseBodyAdmission();
      cleanupJob();
      if (error?.code === "ABORTED" || abortController.signal.aborted) {
        if (error?.code === "DEADLINE" || abortController.signal.reason?.code === "DEADLINE") {
          if (!response.writableEnded) {
            response.writeHead(408, { "Content-Type": "application/json" });
            response.end('{"error":"Render deadline exceeded"}');
          }
        } else if (!response.writableEnded) response.destroy();
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
    releaseBodyAdmission();

    // Only NOW — after auth + body fully validated — acquire the expensive
    // render concurrency slot and fetch the browser (§4.4: "Không lấy
    // browser trước khi body hoàn tất").
    if (!admission.tryAcquire()) {
      metrics.rejected += 1;
      cleanupJob();
      response.writeHead(503, { "Content-Type": "application/json", "Retry-After": "2" });
      response.end('{"error":"Renderer at capacity"}');
      return;
    }
    renderAdmissionHeld = true;

    try {
      const browser = await withDeadline(
        manager.getBrowser(),
        deadlineAt,
        "browser-acquisition-timeout",
        abortController.signal,
      );
      const pdf = await renderPdf(browser, html, abortController.signal, deadlineAt);
      if (pdf.byteLength > MAX_OUTPUT_BYTES) {
        throw Object.assign(new Error("pdf-output-too-large"), { statusCode: 413 });
      }
      metrics.rendered += 1;
      if (!response.writableEnded) {
        response.writeHead(200, {
          "Content-Type": "application/pdf",
          "Content-Length": String(pdf.byteLength),
          "X-Content-Type-Options": "nosniff",
        });
        response.end(pdf);
        responseCompleted = true;
      }
    } catch (error) {
      if (error?.code === "ABORTED" || abortController.signal.aborted) {
        if (error?.code === "DEADLINE" || abortController.signal.reason?.code === "DEADLINE") {
          if (!response.writableEnded) {
            response.writeHead(408, { "Content-Type": "application/json" });
            response.end('{"error":"Render deadline exceeded"}');
            responseCompleted = true;
          }
        } else if (!response.writableEnded) response.destroy();
      } else {
        const status =
          error?.statusCode === 413
            ? 413
            : error?.statusCode === 408
            ? 408
            : error?.statusCode === 503
            ? 503
            : 500;
        if (status !== 413 && status !== 408 && status !== 503) metrics.failed += 1;
        if (!response.writableEnded) {
          if (status === 503) response.setHeader("Retry-After", "2");
          response.writeHead(status, { "Content-Type": "application/json" });
          response.end(
            JSON.stringify({
              error:
                status === 413
                  ? "Document too large"
                  : status === 408
                  ? "Body read timeout"
                  : status === 503
                  ? "Renderer unavailable"
                  : "Render failed",
            }),
          );
          responseCompleted = true;
        }
      }
    } finally {
      cleanupJob();
      releaseBodyAdmission();
      if (renderAdmissionHeld) admission.release();
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
  const activeJobs = new Set();
  await manager.warmUp();
  const server = createServer(createRequestHandler({ bodyAdmission, admission, manager, activeJobs }));

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
    while ((admission.active > 0 || bodyAdmission.active > 0) && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    for (const controller of activeJobs) {
      controller.abort(Object.assign(new Error("shutdown"), { code: "ABORTED" }));
    }
    await manager.close();
    process.exit(0);
  }
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
