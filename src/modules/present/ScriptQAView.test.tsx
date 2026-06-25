import { describe, it, expect, vi } from "vitest";
import { ScriptView } from "./ScriptView";
import { DefenseQAView } from "./DefenseQAView";
import type { SlideOutline, SpeakerScript, DefenseQA, Speaker } from "@/types";

describe("ScriptView Component", () => {
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

  it("should render script list with correct counts and textareas", () => {
    const onScriptChange = vi.fn();
    const element = ScriptView({
      scripts: mockScripts,
      slides: mockSlides,
      speakers: mockSpeakers,
      onScriptChange,
    });

    expect(element).toBeDefined();
    expect(element.props.className).toBe("ws-present-script-view");

    const scriptList = element.props.children[1];
    expect(scriptList.props.className).toBe("ws-present-script-list");

    const item = scriptList.props.children[0];
    expect(item.key).toBe("slide-1");
    expect(item.props.className).toBe("ws-present-script-item");

    const header = item.props.children[0];
    expect(header.props.className).toBe("ws-present-script-header");
    const speakerSpan = header.props.children[1];
    expect(speakerSpan.props.className).toBe("ws-present-slide-speaker");
    expect(speakerSpan.props.children[1]).toBe("Nguyễn Văn A");

    const textarea = item.props.children[1].props.children[1];
    expect(textarea.props.value).toBe("Sau đây xin phép trình bày phần mở đầu.");
  });
});

describe("DefenseQAView Component", () => {
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

  it("should render QAs grouped by topic", () => {
    const element = DefenseQAView({ qas: mockQAs, sections: mockSections });

    expect(element).toBeDefined();
    expect(element.props.className).toBe("ws-present-qa-view");

    const topicList = element.props.children[1];
    const topicGroup = topicList.props.children[0]; // first topic group ("scope")
    expect(topicGroup).toBeDefined();

    const items = topicGroup.props.children[1].props.children;
    expect(items).toHaveLength(1);
    expect(items[0].props.children[0].props.children[2]).toBe("Mục tiêu là gì?");
  });
});
