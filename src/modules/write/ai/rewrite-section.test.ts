import { describe, it, expect, vi } from "vitest";
import { rewriteSection } from "./rewrite-section";
import type { ReportSection, AiSuggestion, GatewayState } from "@/types";

describe("rewriteSection unit tests", () => {
  const mockSection: ReportSection = {
    id: "sec-1",
    order: 0,
    title: "Chương 1: Mở đầu",
    markdown: "Nội dung mở đầu báo cáo.",
    status: "draft",
  };

  it("should return a no-op suggestion and not fetch when gateway is disabled", async () => {
    const mockRequestSuggestion = vi.fn();
    const mockGetGatewayState = vi.fn().mockReturnValue("disabled" as GatewayState);

    const gateway = {
      requestSuggestion: mockRequestSuggestion,
      getGatewayState: mockGetGatewayState,
    };

    const result = await rewriteSection(mockSection, gateway);

    expect(mockGetGatewayState).toHaveBeenCalled();
    expect(mockRequestSuggestion).not.toHaveBeenCalled();
    expect(result.suggestion).toBe("");
    expect(result.action).toBe("rewrite");
    expect(result.original).toBe(mockSection.markdown);
  });

  it("should return a no-op suggestion and not fetch when gateway is unconfigured", async () => {
    const mockRequestSuggestion = vi.fn();
    const mockGetGatewayState = vi.fn().mockReturnValue("unconfigured" as GatewayState);

    const gateway = {
      requestSuggestion: mockRequestSuggestion,
      getGatewayState: mockGetGatewayState,
    };

    const result = await rewriteSection(mockSection, gateway);

    expect(mockGetGatewayState).toHaveBeenCalled();
    expect(mockRequestSuggestion).not.toHaveBeenCalled();
    expect(result.suggestion).toBe("");
    expect(result.action).toBe("rewrite");
    expect(result.original).toBe(mockSection.markdown);
  });

  it("should delegate to gateway when gateway is ready", async () => {
    const mockResponse: AiSuggestion = {
      id: "test-rewrite-uuid",
      action: "rewrite",
      original: mockSection.markdown,
      suggestion: "Nội dung mở đầu dự án cải thiện.",
    };

    const mockRequestSuggestion = vi.fn().mockResolvedValue(mockResponse);
    const mockGetGatewayState = vi.fn().mockReturnValue("ready" as GatewayState);

    const gateway = {
      requestSuggestion: mockRequestSuggestion,
      getGatewayState: mockGetGatewayState,
    };

    const result = await rewriteSection(mockSection, gateway);

    expect(mockGetGatewayState).toHaveBeenCalled();
    expect(mockRequestSuggestion).toHaveBeenCalledWith("rewrite", mockSection.markdown);
    expect(result).toEqual(mockResponse);
  });
});
