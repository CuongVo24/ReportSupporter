import { describe, it, expect } from "vitest";
import { kindMeta } from "./kind-meta";

describe("kindMeta Metadata", () => {
  it("contains exactly 9 kinds with label and icon properties", () => {
    const keys = Object.keys(kindMeta);
    expect(keys).toHaveLength(9);
    
    for (const key of keys) {
      const meta = kindMeta[key as keyof typeof kindMeta];
      expect(meta).toBeDefined();
      expect(typeof meta.label).toBe("string");
      expect(meta.label.length).toBeGreaterThan(0);
      expect(typeof meta.icon).toBe("string");
      expect(meta.icon.length).toBeGreaterThan(0);
    }
  });
});
