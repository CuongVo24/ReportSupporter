import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const stylesheet = readFileSync(resolve(process.cwd(), "src/components/ui/Toast.css"), "utf8");

describe("Toast pointer-event boundaries", () => {
  it("allows clicks through unused viewport space while preserving toast interaction", () => {
    expect(stylesheet).toMatch(/\.ws-toast-viewport\s*\{[^}]*pointer-events:\s*none;/s);
    expect(stylesheet).toMatch(/\.ws-toast-root\s*\{[^}]*pointer-events:\s*auto;/s);
  });
});
