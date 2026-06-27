import { describe, expect, it, vi } from "vitest";
import { generateOutline } from "./generate-outline";

describe("generateOutline", () => {
  it("calls gateway requestSuggestion with outline action and returns sections", async () => {
    const mockGateway = {
      requestSuggestion: vi.fn().mockResolvedValue({
        id: "test-id",
        action: "outline",
        original: "my theme",
        suggestion: "# Section 1\n\nSome introductory text.\n\n## Section 1.1\n\nSubtext.",
      }),
    };

    const sections = await generateOutline("my theme", mockGateway);

    expect(mockGateway.requestSuggestion).toHaveBeenCalledWith("outline", "my theme");
    expect(sections.length).toBe(2);
    expect(sections[0].title).toBe("Section 1");
    expect(sections[1].title).toBe("Section 1.1");
  });

  it("returns empty array if suggestion body is empty", async () => {
    const mockGateway = {
      requestSuggestion: vi.fn().mockResolvedValue({
        id: "test-id",
        action: "outline",
        original: "my theme",
        suggestion: "",
      }),
    };

    const sections = await generateOutline("my theme", mockGateway);
    expect(sections).toEqual([]);
  });
});
