import { describe, expect, it } from "vitest";
import { normalizeRemoteImageUrl } from "./PreviewPane";

describe("PreviewPane remote-image URL boundary", () => {
  it("accepts only bounded credential-free HTTPS URLs", () => {
    expect(normalizeRemoteImageUrl("https://images.example/report.png"))
      .toBe("https://images.example/report.png");
    expect(normalizeRemoteImageUrl("http://images.example/report.png")).toBeNull();
    expect(normalizeRemoteImageUrl("https://user:pass@images.example/report.png")).toBeNull();
    expect(normalizeRemoteImageUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeRemoteImageUrl("x".repeat(4_097))).toBeNull();
  });
});
