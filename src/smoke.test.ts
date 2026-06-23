import { describe, it, expect } from "vitest";
import { BOOTSTRAP_OK } from "@/app-info";

describe("bootstrap smoke", () => {
  it("runs vitest and resolves the @/ alias", () => {
    expect(BOOTSTRAP_OK).toBe(true);
  });
});
