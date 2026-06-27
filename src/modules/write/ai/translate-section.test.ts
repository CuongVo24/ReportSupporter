import { describe, expect, it, vi } from "vitest";
import type { AiSuggestion, GatewayState, ReportSection } from "@/types";
import { translateSection } from "./translate-section";

describe("translateSection", () => {
  const section: ReportSection = {
    id: "sec-1",
    order: 0,
    title: "Abstract",
    markdown: "This project presents a reporting workspace.",
    status: "draft",
  };

  it("returns no-op and does not call gateway when disabled", async () => {
    const gateway = {
      requestSuggestion: vi.fn(),
      getGatewayState: vi.fn().mockReturnValue("disabled" as GatewayState),
    };

    const result = await translateSection(section, gateway);

    expect(gateway.requestSuggestion).not.toHaveBeenCalled();
    expect(result.action).toBe("translate");
    expect(result.original).toBe(section.markdown);
    expect(result.suggestion).toBe("");
  });

  it("delegates to gateway when ready", async () => {
    const response: AiSuggestion = {
      id: "translate-1",
      action: "translate",
      original: section.markdown,
      suggestion: "Dự án này trình bày một workspace tạo báo cáo.",
    };
    const gateway = {
      requestSuggestion: vi.fn().mockResolvedValue(response),
      getGatewayState: vi.fn().mockReturnValue("ready" as GatewayState),
    };

    const result = await translateSection(section, gateway);

    expect(gateway.requestSuggestion).toHaveBeenCalledWith("translate", section.markdown);
    expect(result).toEqual(response);
  });
});
