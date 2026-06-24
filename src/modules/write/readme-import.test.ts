import { describe, it, expect } from "vitest";
import { importReadme } from "./readme-import";

describe("README to Report Import", () => {
  it("should return empty array for empty or whitespace README", () => {
    expect(importReadme("")).toEqual([]);
    expect(importReadme("   \n\t  ")).toEqual([]);
  });

  it("should parse multiple headings into sections", () => {
    const readme = `
# Project Name

Some description.

## Installation

Run npm install.

## Usage

Run npm start.
`;
    const sections = importReadme(readme);

    expect(sections).toHaveLength(3);

    expect(sections[0].title).toBe("Project Name");
    expect(sections[0].markdown).toContain("# Project Name\n\nSome description.");
    expect(sections[0].order).toBe(0);

    expect(sections[1].title).toBe("Installation");
    expect(sections[1].markdown).toContain("## Installation\n\nRun npm install.");
    expect(sections[1].order).toBe(1);

    expect(sections[2].title).toBe("Usage");
    expect(sections[2].markdown).toContain("## Usage\n\nRun npm start.");
    expect(sections[2].order).toBe(2);
  });

  it("should collect leading content before first heading into a 'Mở đầu' bucket", () => {
    const readme = `
Leading unheaded text here.
More info before name.

# Main Topic

Body content.
`;
    const sections = importReadme(readme);
    expect(sections).toHaveLength(2);

    expect(sections[0].title).toBe("Mở đầu");
    expect(sections[0].markdown.trim()).toBe("Leading unheaded text here.\nMore info before name.");
    expect(sections[0].order).toBe(0);

    expect(sections[1].title).toBe("Main Topic");
    expect(sections[1].markdown).toContain("# Main Topic\n\nBody content.");
    expect(sections[1].order).toBe(1);
  });

  it("should place everything in 'Mở đầu' if there are no depth 1 or 2 headings", () => {
    const readme = `
Just plain markdown text.
### Small heading (depth 3)
Some list item.
`;
    const sections = importReadme(readme);
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe("Mở đầu");
    expect(sections[0].markdown).toContain("Just plain markdown text.");
    expect(sections[0].markdown).toContain("### Small heading");
  });

  it("should yield identical output for the same input (deterministic)", () => {
    const readme = `
# Section A
Content A
# Section B
Content B
`;
    const run1 = importReadme(readme);
    const run2 = importReadme(readme);

    expect(run1).toEqual(run2);
  });
});
