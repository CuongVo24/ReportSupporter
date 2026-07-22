// W24-F unit tests — admission controller + browser lifecycle manager.
// These exercise the reliability logic without launching real Chromium by
// injecting a fake `launch`. Run with: node --test services/pdf-renderer/
import assert from "node:assert/strict";
import { test } from "node:test";
import { createAdmissionController, createBrowserManager } from "./server.mjs";

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
