import { describe, it, expect } from "vitest";
import { readmeReportTemplate } from "./readme-report";
import { generateSkeleton } from "../generate-skeleton";

describe("README-to-Report Template Schema", () => {
  it("should have correct template metadata specs", () => {
    expect(readmeReportTemplate.id).toBe("readme-report");
    expect(readmeReportTemplate.name).toBe("Báo cáo từ README");
    expect(readmeReportTemplate.metadataFields.some(f => f.key === "readmeContent")).toBe(true);
  });

  it("should generate empty sections since sections are parsed dynamically from content", () => {
    const validMetadata = {
      school: "Đại học",
      members: ["A"],
      readmeContent: "# Test\nContent",
    };
    const sections = generateSkeleton(readmeReportTemplate, validMetadata);
    expect(sections).toEqual([]);
  });
});
