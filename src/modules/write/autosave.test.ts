import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createThrottledSaver, loadBundle } from "./autosave";

const idbMocks = vi.hoisted(() => ({
  getRawBundle: vi.fn(),
  putRawBundle: vi.fn(),
}));

vi.mock("@/lib/idb-client", () => idbMocks);

describe("createThrottledSaver", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("coalesces rapid schedules into a single trailing save", async () => {
    const save = vi.fn();
    const saver = createThrottledSaver<string>(save, 2000);

    saver.schedule("a");
    saver.schedule("b");
    saver.schedule("c");
    expect(save).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2000);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("c");
  });

  it("flush() saves the pending value immediately and is awaitable", async () => {
    const save = vi.fn();
    const saver = createThrottledSaver<string>(save, 2000);

    saver.schedule("x");
    await saver.flush();
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("x");
  });

  it("flush() with nothing pending does not save", async () => {
    const save = vi.fn();
    const saver = createThrottledSaver<string>(save, 2000);

    await saver.flush();
    expect(save).not.toHaveBeenCalled();
  });

  it("serializes saves so a later write cannot finish before an earlier write", async () => {
    const releases: Array<() => void> = [];
    const save = vi.fn(() => new Promise<void>((resolve) => releases.push(resolve)));
    const saver = createThrottledSaver<string>(save, 2000);

    saver.schedule("first");
    const firstFlush = saver.flush();
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenCalledTimes(1);

    saver.schedule("second");
    const secondFlush = saver.flush();
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenCalledTimes(1);

    releases[0]();
    await firstFlush;
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenCalledTimes(2);
    releases[1]();
    await secondFlush;
  });
});

describe("loadBundle", () => {
  it("distinguishes a missing draft from an invalid one", async () => {
    idbMocks.getRawBundle.mockResolvedValueOnce(undefined);
    await expect(loadBundle()).resolves.toEqual({ status: "missing" });

    const raw = { schemaVersion: "corrupted" };
    idbMocks.getRawBundle.mockResolvedValueOnce(raw);
    const result = await loadBundle();

    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.raw).toBe(raw);
      expect(result.issues.length).toBeGreaterThan(0);
    }
  });
});
