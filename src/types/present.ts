import { z } from "zod";

export const slideOutlineSchema = z.object({
  id: z.string(),
  fromSectionId: z.string(),
  order: z.number().int().nonnegative(),
  title: z.string(),
  bullets: z.array(z.string()),
  speakerId: z.string().optional(),
  evidenceRefs: z.array(z.string()),
  estimatedSeconds: z.number().int().positive().optional(),
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

