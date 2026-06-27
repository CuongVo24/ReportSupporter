import { describe, expect, it, vi } from "vitest";
import type { AiSuggestion, GatewayState, ReportSection } from "@/types";
import { suggestWholeReportSections } from "./whole-report-ai";

describe("suggestWholeReportSections", () => {
  const sections: ReportSection[] = [
    { id: "sec-2", order: 2, title: "Kết luận", markdown: "Conclusion text", status: "draft" },
    { id: "sec-0", order: 0, title: "Trống", markdown: "   ", status: "draft" },
    { id: "sec-1", order: 1, title: "Mở đầu", markdown: "Intro text", status: "draft" },
  ];

  it("returns no suggestions and does not call gateway when disabled", async () => {
    const gateway = {
      requestSuggestion: vi.fn(),
      getGatewayState: vi.fn().mockReturnValue("disabled" as GatewayState),
    };

    const result = await suggestWholeReportSections(sections, "translate", gateway);

    expect(result).toEqual([]);
    expect(gateway.requestSuggestion).not.toHaveBeenCalled();
  });

  it("requests suggestions for non-empty sections in report order", async () => {
    const gateway = {
      requestSuggestion: vi.fn(async (action: string, input: string): Promise<AiSuggestion> => ({
        id: `${action}-${input}`,
        action: "translate",
        original: input,
        suggestion: `${input} translated`,
      })),
      getGatewayState: vi.fn().mockReturnValue("ready" as GatewayState),
    };

    const result = await suggestWholeReportSections(sections, "translate", gateway);

    expect(gateway.requestSuggestion).toHaveBeenNthCalledWith(1, "translate", "Intro text");
    expect(gateway.requestSuggestion).toHaveBeenNthCalledWith(2, "translate", "Conclusion text");
    expect(result.map((item) => item.sectionId)).toEqual(["sec-1", "sec-2"]);
  });
});
