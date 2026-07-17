import { z } from "zod";

/**
 * Zod schema to validate ExportJob objects at store/load boundaries.
 * Matches the canonical ExportJob type.
 */
export const exportJobSchema = z.object({
  id: z.string(),
  target: z.enum(["html", "pdf", "docx", "pptx"]),
  projectId: z.string(),
  status: z.enum(["idle", "running", "done", "error"]),
  startedAt: z.string(),
  finishedAt: z.string().optional(),
  fileName: z.string(),
  error: z
    .object({
      stage: z.enum(["merge", "parse", "format", "render-html", "render-pdf", "render-docx", "render-pptx"]),
      message: z.string(),
      recoverable: z.boolean(),
    })
    .optional(),
  phase: z.enum(["preparing", "rendering-assets", "ready", "printing"]).optional(),
  artifact: z.object({
    target: z.enum(["html", "pdf", "docx", "pptx"]),
    mediaType: z.string(),
    fileName: z.string(),
    byteLength: z.number().int().nonnegative(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/u),
    generatedAt: z.string(),
    verified: z.literal(true),
  }).optional(),
});
