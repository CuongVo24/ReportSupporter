import type { ReportIssue } from "@/types";

/**
 * Computes a readiness score from 0 to 100 based on issue counts and severities:
 * - Start at 100
 * - error: -15
 * - warning: -5
 * - info: -1
 * Clamped at 0.
 */
export function computeReadiness(issues: ReportIssue[]): number {
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === "error") {
      score -= 15;
    } else if (issue.severity === "warning") {
      score -= 5;
    } else if (issue.severity === "info") {
      score -= 1;
    }
  }
  return Math.max(0, score);
}

/**
 * Maps the readiness score to a color band classification:
 * - Green (>= 85): Ready / Sẵn sàng
 * - Yellow (60-84): Needs review / Cần xem lại
 * - Red (< 60): Not ready / Chưa nên nộp
 */
export function scoreBand(score: number): "green" | "yellow" | "red" {
  if (score >= 85) {
    return "green";
  }
  if (score >= 60) {
    return "yellow";
  }
  return "red";
}
