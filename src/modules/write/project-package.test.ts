import { describe, expect, it } from "vitest";
import { createProjectFromTemplate } from "./create-project";
import { softwareProjectTemplate } from "./templates/software-project";
import { createProjectPackage, parseProjectPackage } from "./project-package";

describe(".rsproject package", () => {
  it("round-trips bundle checksums and creates a new id on collision", async () => {
    const bundle = createProjectFromTemplate(softwareProjectTemplate);
    const pkg = await createProjectPackage(bundle);
    expect(pkg.blob.size).toBeGreaterThan(0);
    const parsed = await parseProjectPackage(pkg.blob, new Set([bundle.project.id]));
    expect(parsed.bundle.project.id).not.toBe(bundle.project.id);
    expect(parsed.bundle.assets).toEqual(bundle.assets);
    expect(parsed.manifest.files[0].sha256).toMatch(/^[a-f0-9]{64}$/u);
  });
});
