import type { ReportProjectBundle } from "@/types";
import { validateExport } from "./validate-export";
import { runChecker } from "@/modules/check/run-checker";

export interface PreflightIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  sectionId?: string;
  guidance?: string;
}

export interface PreflightResult {
  ok: boolean;
  hasP0: boolean;
  issues: PreflightIssue[];
}

/**
 * Single source of truth for the pre-flight publish gate.
 * Merges `validateExport` (caption/format warnings) and `runChecker` (P0 evidence
 * blockers) into one classified result so the confirm dialog and the export gate
 * always agree: P0 present → blocked; warnings only → bypassable.
 * Neither `validateExport` nor `runChecker` rules are modified — only surfaced.
 */
export function buildPreflightResult(bundle: ReportProjectBundle): PreflightResult {
  const valResult = validateExport(bundle);
  const checkResult = runChecker(bundle);
  const p0Issues = checkResult.issues.filter((i) => i.severity === "error");

  const checkerPreflightIssues: PreflightIssue[] = p0Issues.map((ci) => ({
    severity: "error",
    code: "CHECKER_P0",
    message: ci.message,
    sectionId: ci.sectionId,
    guidance: ci.suggestion,
  }));

  const valPreflightIssues: PreflightIssue[] = valResult.issues.map((vi) => ({
    ...vi,
    guidance: undefined,
  }));

  // P0 errors first, then warnings
  const allIssues = [...checkerPreflightIssues, ...valPreflightIssues];
  const hasP0 = checkerPreflightIssues.length > 0;

  return {
    ok: !hasP0 && valResult.ok,
    hasP0,
    issues: allIssues,
  };
}
