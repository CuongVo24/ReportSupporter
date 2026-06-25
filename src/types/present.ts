import { z } from "zod";

export const slideOutlineSchema = z.object({
  id: z.string(),
  fromSectionId: z.string(),
  order: z.number().int().nonnegative(),
  title: z.string(),
  bullets: z.array(z.string()),
  speakerId: z.string().optional(),
  evidenceRefs: z.array(z.string()),
  brokenEvidenceNotes: z.array(z.string()).optional(),
});

export type SlideOutline = z.infer<typeof slideOutlineSchema>;

export const presentationTimelineSchema = z.object({
  totalSeconds: z.number().int().nonnegative(),
  slots: z.array(
    z.object({
      slideId: z.string(),
      speakerId: z.string().optional(),
      seconds: z.number().int().positive(),
    })
  ),
  overLimit: z.boolean(),
});

export type PresentationTimeline = z.infer<typeof presentationTimelineSchema>;

export const speakerSchema = z.object({
  id: z.string(),
  name: z.string(),
  assignedSlideIds: z.array(z.string()),
});

export type Speaker = z.infer<typeof speakerSchema>;

export const speakerScriptSchema = z.object({
  slideId: z.string(),
  speakerId: z.string().optional(),
  script: z.string(),
  cues: z.array(z.string()),
});

export type SpeakerScript = z.infer<typeof speakerScriptSchema>;

export const defenseQASchema = z.object({
  id: z.string(),
  question: z.string(),
  suggestedAnswer: z.string(),
  relatedSectionId: z.string().optional(),
  topic: z.enum(["scope", "tech", "result", "limitation", "future"]),
});

export type DefenseQA = z.infer<typeof defenseQASchema>;

export const weakSectionHintSchema = z.object({
  sectionId: z.string(),
  slideId: z.string().optional(),
  severity: z.enum(["error", "warning", "info"]),
  reason: z.string(),
  suggestion: z.string(),
});

export type WeakSectionHint = z.infer<typeof weakSectionHintSchema>;





