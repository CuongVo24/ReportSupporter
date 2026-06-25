// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { ScriptView } from "./ScriptView";
import { DefenseQAView } from "./DefenseQAView";
import type { SlideOutline, SpeakerScript, DefenseQA, Speaker } from "@/types";

describe("ScriptView Component (RTL)", () => {
  const mockSlides: SlideOutline[] = [
    {
      id: "slide-1",
      fromSectionId: "sec-1",
      order: 0,
      title: "1. Mở đầu",
      bullets: [],
      evidenceRefs: [],
    },
  ];

  const mockSpeakers: Speaker[] = [
    {
      id: "spk-1",
      name: "Nguyễn Văn A",
      assignedSlideIds: ["slide-1"],
    },
  ];

  const mockScripts: SpeakerScript[] = [
    {
      slideId: "slide-1",
      speakerId: "spk-1",
      script: "Sau đây xin phép trình bày phần mở đầu.",
      cues: ["mở demo video"],
    },
  ];

  it("renders script list, resolves speaker name, and handles text change", () => {
    const onScriptChange = vi.fn();
    render(
      <ScriptView
        scripts={mockScripts}
        slides={mockSlides}
        speakers={mockSpeakers}
        onScriptChange={onScriptChange}
      />
    );

    // Verify slide title
    expect(screen.getByText("1. Mở đầu")).toBeDefined();

    // Verify resolved speaker name
    expect(screen.getByText(/Người nói: Nguyễn Văn A/)).toBeDefined();

    // Verify script content in textarea using label or value
    const textarea = screen.getByLabelText("Lời thuyết trình:") as HTMLTextAreaElement;
    expect(textarea.value).toBe("Sau đây xin phép trình bày phần mở đầu.");

    // Fire change event
    fireEvent.change(textarea, { target: { value: "Lời thuyết trình mới" } });
    expect(onScriptChange).toHaveBeenCalledWith("slide-1", "Lời thuyết trình mới");

    // Verify cues
    expect(screen.getByText("💡 mở demo video")).toBeDefined();

    // Verify AI button is disabled
    const aiBtn = screen.getByRole("button", { name: /Tối ưu kịch bản bằng AI/i });
    expect((aiBtn as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("DefenseQAView Component (RTL)", () => {
  const mockQAs: DefenseQA[] = [
    {
      id: "qa-1",
      topic: "scope",
      question: "Mục tiêu là gì?",
      suggestedAnswer: "Mục tiêu xây dựng workspace.",
      relatedSectionId: "sec-1",
    },
  ];

  const mockSections = [
    { id: "sec-1", order: 0, title: "Mở đầu", markdown: "", status: "draft" as const },
  ];

  it("renders QAs grouped by topic and verify AI button is disabled", () => {
    render(<DefenseQAView qas={mockQAs} sections={mockSections} />);

    // Verify topic header
    expect(screen.getByText(/Phạm vi & Mục tiêu/)).toBeDefined();

    // Verify question and suggested answer
    expect(screen.getByText(/Mục tiêu là gì\?/)).toBeDefined();
    expect(screen.getByText("Mục tiêu xây dựng workspace.")).toBeDefined();

    // Verify section link
    expect(screen.getByText("Mở đầu")).toBeDefined();

    // Verify AI button is disabled
    const aiBtn = screen.getByRole("button", { name: /Cải thiện câu trả lời bằng AI/i });
    expect((aiBtn as HTMLButtonElement).disabled).toBe(true);
  });
});
