import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createThrottledSaver } from "./autosave";

describe("createThrottledSaver", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("coalesces rapid schedules into a single trailing save", () => {
    const save = vi.fn();
    const saver = createThrottledSaver<string>(save, 2000);

    saver.schedule("a");
    saver.schedule("b");
    saver.schedule("c");
    expect(save).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2000);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("c");
  });

  it("flush() saves the pending value immediately", () => {
    const save = vi.fn();
    const saver = createThrottledSaver<string>(save, 2000);

    saver.schedule("x");
    saver.flush();
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("x");
  });

  it("flush() with nothing pending does not save", () => {
    const save = vi.fn();
    const saver = createThrottledSaver<string>(save, 2000);

    saver.flush();
    expect(save).not.toHaveBeenCalled();
  });
});
