// W24-F unit tests — admission controller + browser lifecycle manager.
// These exercise the reliability logic without launching real Chromium by
// injecting a fake `launch`. Run with: node --test services/pdf-renderer/
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import { createAdmissionController, createBrowserManager, createRequestHandler, renderPdf } from "./server.mjs";

test("admission controller caps concurrent slots and rejects over capacity", () => {
  const admission = createAdmissionController(2);
  assert.equal(admission.tryAcquire(), true);
  assert.equal(admission.tryAcquire(), true);
  assert.equal(admission.tryAcquire(), false, "3rd request over cap must be rejected");
  assert.equal(admission.active, 2);
  admission.release();
  assert.equal(admission.tryAcquire(), true, "slot freed → next request admitted");
  assert.equal(admission.active, 2);
});

test("admission release never underflows below zero", () => {
  const admission = createAdmissionController(1);
  admission.release();
  admission.release();
  assert.equal(admission.active, 0);
});

function fakeBrowser() {
  const handlers = {};
  return {
    connected: true,
    on(event, cb) {
      handlers[event] = cb;
    },
    emit(event) {
      handlers[event]?.();
    },
    close: async () => undefined,
  };
}

test("browser manager launches once (single-flight) under concurrent getBrowser", async () => {
  let launches = 0;
  const manager = createBrowserManager({
    launch: async () => {
      launches += 1;
      return fakeBrowser();
    },
  });
  const [a, b] = await Promise.all([manager.getBrowser(), manager.getBrowser()]);
  assert.equal(launches, 1, "concurrent acquisitions share one launch");
  assert.equal(a, b);
  assert.equal(manager.isReady(), true);
});

test("readiness goes red on disconnect, then exactly one relaunch restores it", async () => {
  let launches = 0;
  let current;
  const manager = createBrowserManager({
    launch: async () => {
      launches += 1;
      current = fakeBrowser();
      return current;
    },
  });
  await manager.getBrowser();
  assert.equal(manager.isReady(), true);

  current.connected = false;
  current.emit("disconnected");
  assert.equal(manager.isReady(), false, "disconnect must fail readiness");

  const relaunched = await manager.getBrowser();
  assert.equal(launches, 2, "exactly one relaunch");
  assert.equal(relaunched.connected, true);
  assert.equal(manager.isReady(), true);
});

test("draining manager refuses new browser acquisition", async () => {
  const manager = createBrowserManager({ launch: async () => fakeBrowser() });
  await manager.getBrowser();
  manager.beginDraining();
  await assert.rejects(() => manager.getBrowser(), /draining/);
  assert.equal(manager.isReady(), false);
});

// ---------------------------------------------------------------------------
// W25-E: per-job BrowserContext isolation + admission ordering
// ---------------------------------------------------------------------------

function fakePage() {
  const listeners = {};
  return {
    closed: false,
    on(event, cb) {
      listeners[event] = cb;
    },
    setJavaScriptEnabled: async () => undefined,
    setRequestInterception: async () => undefined,
    setContent: async () => undefined,
    emulateMediaType: async () => undefined,
    pdf: async () => Buffer.from("%PDF-1.7\nfake"),
    close: async function () {
      this.closed = true;
    },
  };
}

function fakeBrowserWithContexts() {
  const contexts = [];
  return {
    contexts,
    async createBrowserContext() {
      const page = fakePage();
      const ctx = {
        closed: false,
        newPage: async () => page,
        page,
        close: async function () {
          this.closed = true;
        },
      };
      contexts.push(ctx);
      return ctx;
    },
  };
}

test("renderPdf creates a fresh BrowserContext per call and always closes it", async () => {
  const browser = fakeBrowserWithContexts();
  const deadlineAt = Date.now() + 5_000;

  const pdf1 = await renderPdf(browser, "<!doctype html><body>A</body>", undefined, deadlineAt);
  const pdf2 = await renderPdf(browser, "<!doctype html><body>B</body>", undefined, deadlineAt);

  assert.equal(browser.contexts.length, 2, "each render call gets its own BrowserContext");
  assert.notEqual(browser.contexts[0], browser.contexts[1], "contexts must not be shared/reused");
  assert.equal(browser.contexts[0].closed, true, "context 1 closed after use");
  assert.equal(browser.contexts[1].closed, true, "context 2 closed after use");
  assert.equal(browser.contexts[0].page.closed, true, "page 1 closed after use");
  assert.ok(Buffer.isBuffer(pdf1) && Buffer.isBuffer(pdf2));
});

test("renderPdf closes context and page even when page.pdf() throws", async () => {
  const browser = fakeBrowserWithContexts();
  const originalCreate = browser.createBrowserContext.bind(browser);
  let capturedCtx;
  browser.createBrowserContext = async () => {
    const ctx = await originalCreate();
    ctx.page.pdf = async () => {
      throw new Error("render blew up");
    };
    capturedCtx = ctx;
    return ctx;
  };

  await assert.rejects(
    () => renderPdf(browser, "<!doctype html><body>Boom</body>", undefined, Date.now() + 5_000),
    /render blew up/,
  );
  assert.equal(capturedCtx.closed, true, "context still closed after a render error");
  assert.equal(capturedCtx.page.closed, true, "page still closed after a render error");
});

test("renderPdf rejects immediately if the signal is already aborted, without opening a context", async () => {
  const browser = fakeBrowserWithContexts();
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    () => renderPdf(browser, "<!doctype html>", controller.signal, Date.now() + 5_000),
    /aborted/,
  );
  assert.equal(browser.contexts.length, 0, "no context/page resource opened for an already-aborted job");
});

// --- request handler admission ordering (body admission before render slot) ---

function fakeRequest({ method = "POST", url = "/render", headers = {}, chunks = [] } = {}) {
  const req = new EventEmitter();
  req.method = method;
  req.url = url;
  req.headers = headers;
  req.destroyed = false;
  req.destroy = () => {
    req.destroyed = true;
  };
  queueMicrotask(async () => {
    for (const chunk of chunks) req.emit("data", Buffer.from(chunk));
    req.emit("end");
  });
  return req;
}

function fakeResponse() {
  return {
    headers: {},
    statusCode: undefined,
    body: undefined,
    writableEnded: false,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    writeHead(status, headers) {
      this.statusCode = status;
      Object.assign(this.headers, headers || {});
      return this;
    },
    end(body) {
      this.body = body;
      this.writableEnded = true;
    },
    destroy() {
      this.writableEnded = true;
      this.destroyed = true;
    },
  };
}

function instrumentedAdmission(name, log, max = 10) {
  const inner = createAdmissionController(max);
  return {
    tryAcquire: () => {
      const ok = inner.tryAcquire();
      if (ok) log.push(`${name}:acquire`);
      return ok;
    },
    release: () => {
      log.push(`${name}:release`);
      inner.release();
    },
    get active() {
      return inner.active;
    },
    get max() {
      return inner.max;
    },
  };
}

test("body admission is acquired and released BEFORE the render slot is ever acquired", async () => {
  const log = [];
  const bodyAdmission = instrumentedAdmission("body", log);
  const admission = instrumentedAdmission("render", log);
  const browser = fakeBrowserWithContexts();
  const manager = {
    state: "ready",
    isReady: () => true,
    getBrowser: async () => {
      log.push("manager:getBrowser");
      return browser;
    },
  };

  const handle = createRequestHandler({ bodyAdmission, admission, manager });
  const req = fakeRequest({ headers: {}, chunks: ["<!doctype html><body>Hi</body>"] });
  const res = fakeResponse();

  await handle(req, res);

  assert.equal(res.statusCode, 200);
  const bodyReleaseIdx = log.indexOf("body:release");
  const renderAcquireIdx = log.indexOf("render:acquire");
  assert.notEqual(bodyReleaseIdx, -1, "body admission must be released");
  assert.notEqual(renderAcquireIdx, -1, "render admission must be acquired");
  assert.ok(
    bodyReleaseIdx < renderAcquireIdx,
    `body:release (${bodyReleaseIdx}) must happen before render:acquire (${renderAcquireIdx}); order was ${log.join(",")}`,
  );
  const getBrowserIdx = log.indexOf("manager:getBrowser");
  assert.ok(
    renderAcquireIdx < getBrowserIdx,
    "render slot must be acquired before the browser is fetched",
  );
});

test("a body-admission-at-capacity request never reaches the render slot or the browser", async () => {
  const log = [];
  const bodyAdmission = instrumentedAdmission("body", log, 1);
  bodyAdmission.tryAcquire(); // pre-fill the only body-admission slot
  log.length = 0;
  const admission = instrumentedAdmission("render", log);
  const manager = {
    state: "ready",
    isReady: () => true,
    getBrowser: async () => {
      log.push("manager:getBrowser");
      throw new Error("must not be called");
    },
  };

  const handle = createRequestHandler({ bodyAdmission, admission, manager });
  const req = fakeRequest({ chunks: ["<!doctype html>"] });
  const res = fakeResponse();
  await handle(req, res);

  assert.equal(res.statusCode, 503);
  assert.ok(!log.includes("render:acquire"), "render slot never acquired when body admission is full");
  assert.ok(!log.includes("manager:getBrowser"), "browser never fetched when body admission is full");
});
