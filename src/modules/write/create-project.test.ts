import { describe, it, expect } from "vitest";
import { createProjectFromTemplate, softwareProjectTemplate } from "@/modules/write";
import { DEFAULT_FORMAT_SETTINGS, SCHEMA_VERSION, storedBundleSchema } from "@/types";

describe("createProjectFromTemplate", () => {
  const bundle = createProjectFromTemplate(softwareProjectTemplate);

  it("maps every seed section with its order and status=draft", () => {
    expect(bundle.project.sections).toHaveLength(softwareProjectTemplate.sections.length);
    bundle.project.sections.forEach((section, i) => {
      const seed = softwareProjectTemplate.sections[i];
      expect(section.status).toBe("draft");
      expect(section.order).toBe(seed.order);
      expect(section.title).toBe(seed.title);
      expect(section.markdown).toBe(seed.starterMarkdown);
    });
    const orders = bundle.project.sections.map((s) => s.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("starts an empty bundle with default settings", () => {
    expect(bundle.assets).toEqual([]);
    expect(bundle.evidence).toEqual([]);
    expect(bundle.formatSettings).toEqual(DEFAULT_FORMAT_SETTINGS);
    expect(bundle.schemaVersion).toBe(SCHEMA_VERSION);
    expect(bundle.project.templateId).toBe(softwareProjectTemplate.id);
  });

  it("round-trips through storedBundleSchema (type ↔ schema parity)", () => {
    expect(() => storedBundleSchema.parse(bundle)).not.toThrow();
  });

  it("seed carries no hard-coded chapter numbers", () => {
    for (const seed of softwareProjectTemplate.sections) {
      expect(seed.title).not.toMatch(/^\s*\d+[.)]/);
      expect(seed.starterMarkdown).not.toMatch(/^#+\s*\d+[.)]/m);
    }
  });
});
