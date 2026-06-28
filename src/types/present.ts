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

export const mockDefensePersonaSchema = z.object({
  id: z.string(),
  name: z.string(),
  stance: z.string(),
});

export type MockDefensePersona = z.infer<typeof mockDefensePersonaSchema>;

export const defenseQuestionSchema = z.object({
  id: z.string(),
  personaId: z.string(),
  question: z.string(),
  sectionId: z.string().optional(),
  evidenceIds: z.array(z.string()).default([]),
  supportExcerpt: z.string().optional(),
  risk: z.enum(["scope", "technical", "evidence", "result", "limitation"]),
});

export type DefenseQuestion = z.infer<typeof defenseQuestionSchema>;

export const answerVerdictSchema = z.object({
  verdict: z.enum(["answered", "evaded", "incorrect"]),
  rationale: z.string(),
  supportingSectionId: z.string().optional(),
  supportExcerpt: z.string().optional(),
  followUp: z.string().optional(),
});

export type AnswerVerdict = z.infer<typeof answerVerdictSchema>;

export const mockDefenseTurnSchema = z.object({
  question: defenseQuestionSchema,
  answer: z.string().optional(),
  verdict: answerVerdictSchema.optional(),
});

export type MockDefenseTurn = z.infer<typeof mockDefenseTurnSchema>;

export const readinessScorecardSchema = z.object({
  readiness: z.number().int().min(0).max(100),
  perPersona: z.array(z.object({
    personaId: z.string(),
    answered: z.number().int().nonnegative(),
    evaded: z.number().int().nonnegative(),
    incorrect: z.number().int().nonnegative(),
  })),
  hotQuestions: z.array(z.string()),
  weakClaims: z.array(z.string()),
});

export type ReadinessScorecard = z.infer<typeof readinessScorecardSchema>;

export const mockDefenseSessionSchema = z.object({
  id: z.string(),
  startedAt: z.string(),
  currentTurnIndex: z.number().int().nonnegative(),
  turns: z.array(mockDefenseTurnSchema),
  scorecard: readinessScorecardSchema.optional(),
});

export type MockDefenseSession = z.infer<typeof mockDefenseSessionSchema>;




