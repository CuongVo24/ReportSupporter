import { describe, it, expect, vi } from "vitest";
import { improveTone } from "./improve-tone";
import type { AiSuggestion, GatewayState } from "@/types";

describe("improveTone unit tests", () => {
  const mockText = "Chúng tôi viết báo cáo này để báo cáo kết quả dự án.";

  it("should return a no-op suggestion and not fetch when gateway is disabled", async () => {
    const mockRequestSuggestion = vi.fn();
    const mockGetGatewayState = vi.fn().mockReturnValue("disabled" as GatewayState);

    const gateway = {
      requestSuggestion: mockRequestSuggestion,
      getGatewayState: mockGetGatewayState,
    };

    const result = await improveTone(mockText, gateway);

    expect(mockGetGatewayState).toHaveBeenCalled();
    expect(mockRequestSuggestion).not.toHaveBeenCalled();
    expect(result.suggestion).toBe("");
    expect(result.action).toBe("tone");
    expect(result.original).toBe(mockText);
  });

  it("should return a no-op suggestion and not fetch when gateway is unconfigured", async () => {
    const mockRequestSuggestion = vi.fn();
    const mockGetGatewayState = vi.fn().mockReturnValue("unconfigured" as GatewayState);

    const gateway = {
      requestSuggestion: mockRequestSuggestion,
      getGatewayState: mockGetGatewayState,
    };

    const result = await improveTone(mockText, gateway);

    expect(mockGetGatewayState).toHaveBeenCalled();
    expect(mockRequestSuggestion).not.toHaveBeenCalled();
    expect(result.suggestion).toBe("");
    expect(result.action).toBe("tone");
    expect(result.original).toBe(mockText);
  });

  it("should delegate to gateway when gateway is ready", async () => {
    const mockResponse: AiSuggestion = {
      id: "test-tone-uuid",
      action: "tone",
      original: mockText,
      suggestion: "Báo cáo này trình bày các kết quả đạt được của dự án.",
    };

    const mockRequestSuggestion = vi.fn().mockResolvedValue(mockResponse);
    const mockGetGatewayState = vi.fn().mockReturnValue("ready" as GatewayState);

    const gateway = {
      requestSuggestion: mockRequestSuggestion,
      getGatewayState: mockGetGatewayState,
    };

    const result = await improveTone(mockText, gateway);

    expect(mockGetGatewayState).toHaveBeenCalled();
    expect(mockRequestSuggestion).toHaveBeenCalledWith("tone", mockText);
    expect(result).toEqual(mockResponse);
  });
});
