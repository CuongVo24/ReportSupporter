import { describe, it, expect } from "vitest";
import { ALL_TEMPLATES, getTemplate } from "./index";

describe("Template Registry", () => {
  it("should have a non-empty list of templates", () => {
    expect(ALL_TEMPLATES).toBeInstanceOf(Array);
    expect(ALL_TEMPLATES.length).toBeGreaterThan(0);
  });

  it("should have unique template IDs", () => {
    const ids = ALL_TEMPLATES.map((t) => t.id);
    const uniqueIds = Array.from(new Set(ids));
    expect(ids.length).toBe(uniqueIds.length);
  });

  it("should retrieve a template by ID using getTemplate", () => {
    const template = getTemplate("software-project");
    expect(template).toBeDefined();
    expect(template?.id).toBe("software-project");
    expect(template?.name).toBe("Báo cáo đồ án phần mềm");
  });

  it("should return undefined for a non-existent template ID", () => {
    const template = getTemplate("non-existent-template-id");
    expect(template).toBeUndefined();
  });

  it("should verify that all templates have valid structures", () => {
    for (const t of ALL_TEMPLATES) {
      expect(t.id).toBeTypeOf("string");
      expect(t.name).toBeTypeOf("string");
      expect(t.description).toBeTypeOf("string");
      expect(t.metadataFields).toBeInstanceOf(Array);
      expect(t.sections).toBeInstanceOf(Array);
      expect(t.requiredSections).toBeInstanceOf(Array);
      expect(t.requiredEvidenceKinds).toBeInstanceOf(Array);
      expect(t.requiresToc).toBeTypeOf("boolean");
    }
  });
});
