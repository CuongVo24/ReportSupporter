import { describe, expect, it } from "vitest";
import { mapWithConcurrencySettled } from "./concurrency";

describe("mapWithConcurrencySettled", () => {
  it("preserves result order and never exceeds the concurrency limit", async () => {
    let active = 0;
    let peak = 0;

    const results = await mapWithConcurrencySettled([30, 5, 20, 1], 2, async (delay) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, delay));
      active -= 1;
      return delay;
    });

    expect(peak).toBe(2);
    expect(results).toEqual([
      { status: "fulfilled", value: 30 },
      { status: "fulfilled", value: 5 },
      { status: "fulfilled", value: 20 },
      { status: "fulfilled", value: 1 },
    ]);
  });

  it("captures individual failures without stopping the remaining work", async () => {
    const results = await mapWithConcurrencySettled([1, 2, 3], 2, async (value) => {
      if (value === 2) throw new Error("failed");
      return value * 2;
    });

    expect(results[0]).toEqual({ status: "fulfilled", value: 2 });
    expect(results[1].status).toBe("rejected");
    expect(results[2]).toEqual({ status: "fulfilled", value: 6 });
  });
});
