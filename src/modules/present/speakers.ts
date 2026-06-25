import type { ReportProject, SlideOutline, Speaker } from "@/types";

/**
 * Parses and normalizes speaker details from project metadata.
 * Normalizes metadata.members from string | string[] format.
 */
export function buildSpeakers(project: ReportProject): Speaker[] {
  const membersVal = project.metadata?.members;
  let names: string[] = [];

  if (Array.isArray(membersVal)) {
    names = membersVal.map((m) => m.trim()).filter(Boolean);
  } else if (typeof membersVal === "string") {
    const trimmed = membersVal.trim();
    if (trimmed) {
      names = [trimmed];
    }
  }

  return names.map((name, index) => ({
    id: `sp-${index + 1}`,
    name,
    assignedSlideIds: [],
  }));
}

/**
 * Assigns slides to speakers contiguously and as evenly as possible.
 * Returns new, copies of outline and speakers without mutating inputs.
 */
export function assignSlides(
  speakers: Speaker[],
  outline: SlideOutline[]
): { speakers: Speaker[]; outline: SlideOutline[] } {
  const M = speakers.length;
  const N = outline.length;

  if (M === 0) {
    return {
      speakers: speakers.map((s) => ({ ...s, assignedSlideIds: [] })),
      outline: outline.map((slide) => ({ ...slide, speakerId: undefined })),
    };
  }

  const base = Math.floor(N / M);
  const remainder = N % M;

  const newSpeakers = speakers.map((s) => ({ ...s, assignedSlideIds: [] as string[] }));
  const newOutline = outline.map((slide) => ({ ...slide }));

  let slideIndex = 0;
  for (let i = 0; i < M; i++) {
    const count = base + (i < remainder ? 1 : 0);
    for (let j = 0; j < count; j++) {
      if (slideIndex < N) {
        const slide = newOutline[slideIndex];
        slide.speakerId = newSpeakers[i].id;
        newSpeakers[i].assignedSlideIds.push(slide.id);
        slideIndex++;
      }
    }
  }

  return {
    speakers: newSpeakers,
    outline: newOutline,
  };
}
