import { describe, expect, it, vi } from "vitest";
import { buildPptx } from "./export-pptx";
import type { SlideOutline, Speaker, SpeakerScript } from "@/types";

// Mock pptxgenjs
const mockAddSlide = vi.fn();
const mockAddText = vi.fn();
const mockWrite = vi.fn();
const mockAddNotes = vi.fn();

const mockSlideInstance = {
  addText: mockAddText,
  addNotes: mockAddNotes,
};

mockAddSlide.mockReturnValue(mockSlideInstance);
mockWrite.mockResolvedValue(new Blob(["mock-pptx-binary"]));

class MockPptx {
  author = "";
  title = "";
  addSlide = mockAddSlide;
  write = mockWrite;
}

vi.mock("pptxgenjs", () => {
  return {
    default: MockPptx,
  };
});

describe("buildPptx", () => {
  it("generates pptx slides with correct mappings", async () => {
    mockAddSlide.mockClear();
    mockAddText.mockClear();
    mockWrite.mockClear();
    mockAddNotes.mockClear();

    const mockSlides: SlideOutline[] = [
      {
        id: "slide-1",
        fromSectionId: "sec-1",
        order: 1,
        title: "Slide 1 Title",
        bullets: ["bullet 1", "bullet 2"],
        evidenceRefs: [],
        speakerId: "speaker-1",
      },
      {
        id: "slide-2",
        fromSectionId: "sec-2",
        order: 2,
        title: "Slide 2 Title",
        bullets: ["bullet 3"],
        evidenceRefs: [],
        speakerId: "speaker-2",
      },
    ];

    const mockSpeakers: Speaker[] = [
      { id: "speaker-1", name: "Alice", assignedSlideIds: [] },
      { id: "speaker-2", name: "Bob", assignedSlideIds: [] },
    ];

    const mockScripts: Record<string, SpeakerScript> = {
      "slide-1": { slideId: "slide-1", script: "Script notes 1", cues: [] },
      "slide-2": { slideId: "slide-2", script: "Script notes 2", cues: [] },
    };

    const blob = await buildPptx(mockSlides, mockSpeakers, mockScripts, {
      author: "Test Author",
      title: "Test Title",
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(mockAddSlide).toHaveBeenCalledTimes(2);

    // Verify title additions
    expect(mockAddText).toHaveBeenCalledWith("Slide 1 Title", expect.any(Object));
    expect(mockAddText).toHaveBeenCalledWith("Slide 2 Title", expect.any(Object));

    // Verify slide note assignments
    expect(mockAddNotes).toHaveBeenCalledWith("Script notes 1");
    expect(mockAddNotes).toHaveBeenCalledWith("Script notes 2");
  });
});
