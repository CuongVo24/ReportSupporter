import { z } from "zod";

/**
 * Zod schema to validate ExportJob objects at store/load boundaries.
 * Matches the canonical ExportJob type.
 */
export const exportJobSchema = z.object({
  id: z.string(),
  target: z.enum(["html", "pdf", "docx"]),
  projectId: z.string(),
  status: z.enum(["idle", "running", "done", "error"]),
  startedAt: z.string(),
  finishedAt: z.string().optional(),
  fileName: z.string(),
  error: z
    .object({
      stage: z.enum(["merge", "parse", "format", "render-html", "render-pdf", "render-docx"]),
      message: z.string(),
      recoverable: z.boolean(),
    })
    .optional(),
});
