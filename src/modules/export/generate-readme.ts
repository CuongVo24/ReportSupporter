import type { ReportProjectBundle } from "@/types";
import { kindMeta } from "@/modules/evidence";

/**
 * Generates a README.md string deterministically from project metadata and evidence.
 *
 * @param bundle The report project bundle containing project details and evidence.
 */
export function generateReadme(bundle: ReportProjectBundle): string {
  const { project, evidence } = bundle;
  const metadata = project.metadata || {};

  const lines: string[] = [];

  // Project Title
  lines.push(`# ${project.title || "Untitled Project"}`);
  lines.push("");

  // Metadata Fields
  const school = typeof metadata.school === "string" ? metadata.school.trim() : "";
  const course = typeof metadata.course === "string" ? metadata.course.trim() : "";
  const lecturer = typeof metadata.lecturer === "string" ? metadata.lecturer.trim() : "";
  const date = typeof metadata.date === "string" ? metadata.date.trim() : "";

  let members: string[] = [];
  if (Array.isArray(metadata.members)) {
    members = metadata.members.map((m) => String(m).trim()).filter(Boolean);
  } else if (typeof metadata.members === "string") {
    const trimmed = metadata.members.trim();
    if (trimmed) {
      members = [trimmed];
    }
  }

  // Add Project Info section if any field exists
  if (school || course || lecturer || date || members.length > 0) {
    lines.push("## Thông tin dự án");
    if (school) {
      lines.push(`- **Trường:** ${school}`);
    }
    if (course) {
      lines.push(`- **Học phần:** ${course}`);
    }
    if (lecturer) {
      lines.push(`- **Giảng viên hướng dẫn:** ${lecturer}`);
    }
    if (date) {
      lines.push(`- **Ngày thực hiện:** ${date}`);
    }

    if (members.length > 0) {
      lines.push("");
      lines.push("### Thành viên thực hiện");
      members.forEach((member) => {
        lines.push(`- ${member}`);
      });
    }
    lines.push("");
  }

  // Add Evidence list section if any evidence exists
  if (evidence && evidence.length > 0) {
    lines.push("## Danh sách minh chứng");
    lines.push("");
    evidence.forEach((item) => {
      const kindLabel = kindMeta[item.kind]?.label || item.kind;
      const urlText = item.url ? `[${item.title || "Liên kết"}](${item.url})` : item.title;
      let line = `- **${kindLabel}:** ${urlText}`;
      if (item.note && item.note.trim()) {
        line += ` - ${item.note.trim()}`;
      }
      lines.push(line);
    });
    lines.push("");
  }

  return lines.join("\n").trim() + "\n";
}
