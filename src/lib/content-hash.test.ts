import { describe, expect, it } from "vitest";
import { contentHash } from "./content-hash";

describe("contentHash", () => {
  it("is deterministic and changes with report content", () => {
    expect(contentHash("same content")).toBe(contentHash("same content"));
    expect(contentHash("same content")).not.toBe(contentHash("changed content"));
  });
});
