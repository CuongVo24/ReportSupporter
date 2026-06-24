import type { EvidenceItem } from "@/types";
import { evidenceItemSchema } from "@/types";

export function validateEvidence(input: unknown):
  | { ok: true; item: EvidenceItem }
  | { ok: false; errors: Record<string, string> } {
  
  const parseResult = evidenceItemSchema.safeParse(input);
  if (!parseResult.success) {
    const errors: Record<string, string> = {};
    for (const issue of parseResult.error.issues) {
      const field = issue.path[0] as string;
      if (field) {
        errors[field] = issue.message;
      }
    }
    
    // Customize title error message if title is missing
    if (errors.title) {
      errors.title = "Tiêu đề minh chứng không được để trống";
    }
    
    return { ok: false, errors };
  }

  const item = parseResult.data as EvidenceItem;

  // Custom validation to check if title is only spaces
  if (!item.title || item.title.trim() === "") {
    return {
      ok: false,
      errors: { title: "Tiêu đề minh chứng không được để trống" },
    };
  }

  // Custom validation for url shape if present
  if (item.url && item.url.trim() !== "") {
    try {
      const parsedUrl = new URL(item.url);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return {
          ok: false,
          errors: { url: "Định dạng liên kết phải sử dụng giao thức http hoặc https" },
        };
      }
    } catch {
      return {
        ok: false,
        errors: { url: "Định dạng liên kết không hợp lệ" },
      };
    }
  }

  return { ok: true, item };
}
