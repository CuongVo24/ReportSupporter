import { describe, it, expect, vi } from "vitest";
import { assistOutline } from "./assist-outline";
import type { SlideOutline, AiSuggestion, GatewayState } from "@/types";

describe("assistOutline unit tests", () => {
  const mockOutline: SlideOutline[] = [
    {
      id: "slide-1",
      fromSectionId: "sec-1",
      order: 0,
      title: "Slide 1 Title",
      bullets: ["Bullet 1", "Bullet 2"],
      evidenceRefs: [],
    },
  ];

  it("should return a no-op suggestion and not fetch when gateway is disabled", async () => {
    const mockRequestSuggestion = vi.fn();
    const mockGetGatewayState = vi.fn().mockReturnValue("disabled" as GatewayState);

    const gateway = {
      requestSuggestion: mockRequestSuggestion,
      getGatewayState: mockGetGatewayState,
    };

    const result = await assistOutline(mockOutline, gateway);

    expect(mockGetGatewayState).toHaveBeenCalled();
    expect(mockRequestSuggestion).not.toHaveBeenCalled();
    expect(result.suggestion).toBe("");
    expect(result.action).toBe("outline");
    expect(JSON.parse(result.original)).toEqual(mockOutline);
  });

  it("should return a no-op suggestion and not fetch when gateway is unconfigured", async () => {
    const mockRequestSuggestion = vi.fn();
    const mockGetGatewayState = vi.fn().mockReturnValue("unconfigured" as GatewayState);

    const gateway = {
      requestSuggestion: mockRequestSuggestion,
      getGatewayState: mockGetGatewayState,
    };

    const result = await assistOutline(mockOutline, gateway);

    expect(mockGetGatewayState).toHaveBeenCalled();
    expect(mockRequestSuggestion).not.toHaveBeenCalled();
    expect(result.suggestion).toBe("");
    expect(result.action).toBe("outline");
    expect(JSON.parse(result.original)).toEqual(mockOutline);
  });

  it("should delegate to gateway when gateway is ready", async () => {
    const mockSuggestedOutline: SlideOutline[] = [
      {
        id: "slide-1",
        fromSectionId: "sec-1",
        order: 0,
        title: "Optimized Slide 1 Title",
        bullets: ["Better Bullet 1", "Better Bullet 2"],
        evidenceRefs: [],
      },
    ];

    const mockResponse: AiSuggestion = {
      id: "test-uuid",
      action: "outline",
      original: JSON.stringify(mockOutline),
      suggestion: JSON.stringify(mockSuggestedOutline),
    };

    const mockRequestSuggestion = vi.fn().mockResolvedValue(mockResponse);
    const mockGetGatewayState = vi.fn().mockReturnValue("ready" as GatewayState);

    const gateway = {
      requestSuggestion: mockRequestSuggestion,
      getGatewayState: mockGetGatewayState,
    };

    const result = await assistOutline(mockOutline, gateway);

    expect(mockGetGatewayState).toHaveBeenCalled();
    expect(mockRequestSuggestion).toHaveBeenCalledWith("outline", JSON.stringify(mockOutline));
    expect(result).toEqual(mockResponse);
  });
});
