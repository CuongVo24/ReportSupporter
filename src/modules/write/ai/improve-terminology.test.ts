import { describe, expect, it, vi } from "vitest";
import type { AiSuggestion, GatewayState } from "@/types";
import { improveTerminology } from "./improve-terminology";

describe("improveTerminology", () => {
  const text = "App này giúp làm báo cáo và check lỗi.";

  it("returns no-op and does not call gateway when unconfigured", async () => {
    const gateway = {
      requestSuggestion: vi.fn(),
      getGatewayState: vi.fn().mockReturnValue("unconfigured" as GatewayState),
    };

    const result = await improveTerminology(text, gateway);

    expect(gateway.requestSuggestion).not.toHaveBeenCalled();
    expect(result.action).toBe("terminology");
    expect(result.original).toBe(text);
    expect(result.suggestion).toBe("");
  });

  it("delegates to gateway when ready", async () => {
    const response: AiSuggestion = {
      id: "terminology-1",
      action: "terminology",
      original: text,
      suggestion: "Ứng dụng này hỗ trợ tạo báo cáo và kiểm tra lỗi.",
    };
    const gateway = {
      requestSuggestion: vi.fn().mockResolvedValue(response),
      getGatewayState: vi.fn().mockReturnValue("ready" as GatewayState),
    };

    const result = await improveTerminology(text, gateway);

    expect(gateway.requestSuggestion).toHaveBeenCalledWith("terminology", text);
    expect(result).toEqual(response);
  });
});
