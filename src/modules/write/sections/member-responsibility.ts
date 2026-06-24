/**
 * Builder function to generate a GFM table for member responsibility.
 * Helps satisfy the missing-member-table checker rule.
 */
export function buildMemberResponsibility(members?: string[]): string {
  let markdown = "# Thành viên & Phân công\n\n";
  markdown += "| Thành viên | Vai trò | Nhiệm vụ |\n";
  markdown += "| --- | --- | --- |\n";

  if (members && members.length > 0) {
    for (const member of members) {
      markdown += `| ${member} | ... | ... |\n`;
    }
  } else {
    markdown += "| ... | ... | ... |\n";
  }

  return markdown;
}
