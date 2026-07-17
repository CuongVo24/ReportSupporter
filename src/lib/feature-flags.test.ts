import { describe, expect, it } from "vitest";
import { FEATURE_FLAGS, isFeatureEnabled } from "./feature-flags";

describe("feature flags", () => {
  it("keeps shipped rollout stages enabled by default", () => {
    expect(Object.values(FEATURE_FLAGS).every(Boolean)).toBe(true);
    expect(isFeatureEnabled("pwa")).toBe(true);
  });
});
