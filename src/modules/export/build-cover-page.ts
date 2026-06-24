import type { CoverPageData } from "./types";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Builds an HTML cover-page fragment from metadata fields.
 * Includes title, school, course, lecturer, members list, and date.
 */
export function buildCoverPage(cover: CoverPageData): string {
  const schoolHtml = cover.school ? `<div class="cover-school">${escapeHtml(cover.school)}</div>` : "";
  const dividerHtml = cover.school ? `<div class="cover-divider"></div>` : "";
  const titleHtml = `<h1 class="cover-title">${escapeHtml(cover.title)}</h1>`;
  const courseHtml = cover.course ? `<div class="cover-course">Học phần: ${escapeHtml(cover.course)}</div>` : "";
  
  const lecturerHtml = cover.lecturer
    ? `<div class="cover-info-row"><strong>Giảng viên hướng dẫn:</strong> ${escapeHtml(cover.lecturer)}</div>`
    : "";

  let membersHtml = "";
  if (cover.members && cover.members.length > 0) {
    const listItems = cover.members.map((m) => `<li>${escapeHtml(m)}</li>`).join("");
    membersHtml = `
      <div class="cover-info-row">
        <strong>Thành viên thực hiện:</strong>
        <ul class="cover-members-list">
          ${listItems}
        </ul>
      </div>
    `;
  }

  const dateHtml = cover.date ? `<div class="cover-date">${escapeHtml(cover.date)}</div>` : "";

  return `
<div class="cover-page">
  ${schoolHtml}
  ${dividerHtml}
  <div class="cover-title-container">
    ${titleHtml}
  </div>
  ${courseHtml}
  <div class="cover-info">
    ${lecturerHtml}
    ${membersHtml}
  </div>
  ${dateHtml}
</div>
<div class="page-break"></div>
  `.trim();
}
