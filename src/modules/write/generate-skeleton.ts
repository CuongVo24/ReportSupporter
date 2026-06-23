import { createProjectFromTemplate } from "./create-project";
import type { TemplateSchema, ReportSection } from "@/types";

/**
 * Generates initial sections for a project based on a template and provided metadata,
 * reusing the existing createProjectFromTemplate mapping logic.
 */
export function generateSkeleton(
  template: TemplateSchema,
  metadata: Record<string, string | string[]>
): ReportSection[] {
  const title = typeof metadata.title === "string" ? metadata.title : template.name;
  
  const bundle = createProjectFromTemplate(template, {
    title,
    metadata,
  });
  
  return bundle.project.sections;
}

/**
 * Validates metadata fields dynamically according to the TemplateSchema specs.
 * Returns an object mapping field keys to error messages.
 */
export function validateMetadata(
  template: TemplateSchema,
  title: string,
  metadata: Record<string, string | string[]>
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!title || title.trim() === "") {
    errors.title = "Tiêu đề báo cáo không được để trống.";
  }

  template.metadataFields.forEach((field) => {
    const val = metadata[field.key];
    if (field.required) {
      if (field.type === "textList") {
        if (!Array.isArray(val) || val.length === 0) {
          errors[field.key] = `${field.label} phải có ít nhất một thành viên.`;
        }
      } else {
        if (typeof val !== "string" || val.trim() === "") {
          errors[field.key] = `${field.label} không được để trống.`;
        }
      }
    }
  });

  return errors;
}
