import { describe, expect, it } from "vitest";
import { validateProductionConfig } from "../production-config";

describe("Production Config Ranges & Deadline Hierarchy (W25-J)", () => {
  it("rejects invalid non-integer or out-of-range deadline numbers", () => {
    const report = validateProductionConfig({
      PDF_RENDER_DEADLINE_MS: "invalid-abc",
    });

    expect(report.ok).toBe(false);
    const prob = report.problems.find((p) => p.variable === "PDF_RENDER_DEADLINE_MS");
    expect(prob).toBeDefined();
    expect(prob?.code).toBe("numeric_config_invalid");
  });

  it("rejects deadline hierarchy violations (when render >= gateway or gateway >= client)", () => {
    const report = validateProductionConfig({
      PDF_RENDER_DEADLINE_MS: "50000",
      PDF_GATEWAY_DEADLINE_MS: "40000", // Invalid: gateway <= render
      PDF_CLIENT_DEADLINE_MS: "60000",
    });

    expect(report.ok).toBe(false);
    const prob = report.problems.find((p) => p.code === "deadline_hierarchy_invalid");
    expect(prob).toBeDefined();
  });

  it("rejects PDF_RENDERER_URL containing user credentials in URL", () => {
    const report = validateProductionConfig({
      PDF_RENDERER_URL: "http://user:secret123@pdf-renderer:8080",
    });

    expect(report.ok).toBe(false);
    const prob = report.problems.find((p) => p.code === "pdf_url_credentials");
    expect(prob).toBeDefined();
  });

  it("accepts valid deadline hierarchy (render < gateway < client)", () => {
    const report = validateProductionConfig({
      PDF_RENDER_DEADLINE_MS: "40000",
      PDF_GATEWAY_DEADLINE_MS: "45000",
      PDF_CLIENT_DEADLINE_MS: "50000",
      TRUSTED_PROXY_MODE: "none",
    }, { production: false });

    expect(report.ok).toBe(true);
  });
});
