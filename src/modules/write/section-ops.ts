import type { ReportSection } from "@/types";

export function renumberSections(sections: ReportSection[]): ReportSection[] {
  return sections.map((section, index) => ({
    ...section,
    order: index,
  }));
}

export function addSection(
  sections: ReportSection[],
  insertAt?: number,
  title?: string
): { sections: ReportSection[]; newSection: ReportSection } {
  const finalTitle = title || `Mục ${sections.length + 1}`;
  const newSection: ReportSection = {
    id: crypto.randomUUID(),
    title: finalTitle,
    order: insertAt !== undefined ? insertAt : sections.length,
    status: "draft",
    markdown: `# ${finalTitle}\n\n`,
  };

  const insertIndex = insertAt !== undefined ? insertAt : sections.length;
  const result = renumberSections([
    ...sections.slice(0, insertIndex),
    newSection,
    ...sections.slice(insertIndex),
  ]);

  const updatedNewSection = result.find((s) => s.id === newSection.id) || newSection;

  return {
    sections: result,
    newSection: updatedNewSection,
  };
}

export function duplicateSection(
  sections: ReportSection[],
  sectionToDuplicate: ReportSection
): { sections: ReportSection[]; duplicate: ReportSection } {
  const currentIndex = sections.findIndex((s) => s.id === sectionToDuplicate.id);
  const insertAt = currentIndex >= 0 ? currentIndex + 1 : sections.length;

  const duplicate: ReportSection = {
    ...sectionToDuplicate,
    id: crypto.randomUUID(),
    title: `${sectionToDuplicate.title} (bản sao)`,
    order: insertAt,
    status: "draft",
  };

  const result = renumberSections([
    ...sections.slice(0, insertAt),
    duplicate,
    ...sections.slice(insertAt),
  ]);

  const updatedDuplicate = result.find((s) => s.id === duplicate.id) || duplicate;

  return {
    sections: result,
    duplicate: updatedDuplicate,
  };
}

export function renameSection(
  sections: ReportSection[],
  id: string,
  newTitle: string
): ReportSection[] {
  return sections.map((section) => {
    if (section.id === id) {
      // Also update heading inside markdown if it matches
      let updatedMarkdown = section.markdown;
      const headingRegex = /^#\s+(.+)$/m;
      const match = section.markdown.match(headingRegex);
      if (match && match[1] === section.title) {
        updatedMarkdown = section.markdown.replace(headingRegex, `# ${newTitle}`);
      }

      return {
        ...section,
        title: newTitle,
        markdown: updatedMarkdown,
      };
    }
    return section;
  });
}

export function deleteSection(
  sections: ReportSection[],
  id: string
): ReportSection[] {
  const filtered = sections.filter((s) => s.id !== id);
  return renumberSections(filtered);
}

export function moveSection(
  sections: ReportSection[],
  id: string,
  direction: "up" | "down"
): ReportSection[] {
  const currentIndex = sections.findIndex((s) => s.id === id);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sections.length) {
    return sections;
  }

  const result = [...sections];
  const [section] = result.splice(currentIndex, 1);
  result.splice(targetIndex, 0, section);

  return renumberSections(result);
}
