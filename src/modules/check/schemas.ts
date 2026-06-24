import { z } from "zod";

export const reportIssueSchema = z.object({
  id: z.string(),
  severity: z.enum(["error", "warning", "info"]),
  module: z.enum(["write", "format", "check", "export"]),
  message: z.string(),
  suggestion: z.string(),
  sectionId: z.string().optional(),
  line: z.number().int().positive().optional(),
});
