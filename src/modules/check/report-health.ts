import { buildWeakSectionHints } from "@/modules/present/weak-sections";
import type { CheckResult, ReportProjectBundle, SlideOutline } from "@/types";

export const REPORT_HEALTH_WEIGHTS = {
  readiness: 0.6,
  weakSections: 0.25,
  evidence: 0.15,
} as const;

export type ReportHealthBreakdown = {
  id: "readiness" | "weak-sections" | "evidence";
  label: string;
  score: number;
  weight: number;
  detail: string;
};

export type ReportHealth = {
  score: number;
  status: "green" | "yellow" | "red";
  breakdown: ReportHealthBreakdown[];
  weakestSectionId?: string;
};

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function statusFromScore(score: number): ReportHealth["status"] {
  if (score >= 85) return "green";
  if (score >= 60) return "yellow";
  return "red";
}

function contentCoverage(bundle: ReportProjectBundle) {
  const sections = bundle.project.sections;
  if (sections.length === 0) return 0;
  const filled = sections.filter((section) => section.markdown.trim().length > 0).length;
  return clampScore((filled / sections.length) * 100);
}

function buildOutlineFromSections(bundle: ReportProjectBundle): SlideOutline[] {
  return bundle.project.sections.map((section, index) => ({
    id: `health-slide-${section.id}`,
    fromSectionId: section.id,
    order: index,
    title: section.title,
    bullets: [],
    evidenceRefs: [],
  }));
}

function computeWeakSectionScore(bundle: ReportProjectBundle, checkResult?: CheckResult) {
  if (bundle.project.sections.length === 0) {
    return { score: 0, count: 0, weakestSectionId: undefined };
  }

  if (!checkResult) {
    const emptySections = bundle.project.sections.filter((section) => section.markdown.trim().length === 0);
    return {
      score: clampScore(100 - (emptySections.length / bundle.project.sections.length) * 100),
      count: emptySections.length,
      weakestSectionId: emptySections[0]?.id,
    };
  }

  const hints = buildWeakSectionHints(checkResult, buildOutlineFromSections(bundle));
  const sectionIds = new Set(
    hints
      .map((hint) => hint.sectionId)
      .filter((sectionId) => sectionId !== "global"),
  );

  return {
    score: clampScore(100 - (sectionIds.size / bundle.project.sections.length) * 100),
    count: sectionIds.size,
    weakestSectionId: hints.find((hint) => hint.sectionId !== "global")?.sectionId,
  };
}

function normalizeEvidenceText(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

function sectionHasEvidenceSignal(markdown: string, bundle: ReportProjectBundle) {
  const normalizedMarkdown = normalizeEvidenceText(markdown);
  if (!normalizedMarkdown) return false;

  return bundle.evidence.some((item) => {
    const signals = [item.url, item.title, item.note]
      .map(normalizeEvidenceText)
      .filter(Boolean);
    return signals.some((signal) => normalizedMarkdown.includes(signal));
  });
}

function computeEvidenceScore(bundle: ReportProjectBundle) {
  const filledSections = bundle.project.sections.filter((section) => section.markdown.trim().length > 0);
  const sectionCoverage = filledSections.length === 0
    ? 0
    : clampScore(
        (filledSections.filter((section) => sectionHasEvidenceSignal(section.markdown, bundle)).length /
          filledSections.length) *
          100,
      );

  return {
    score: sectionCoverage,
    coveredSections: filledSections.filter((section) => sectionHasEvidenceSignal(section.markdown, bundle)).length,
    totalSections: filledSections.length,
  };
}

export function computeReportHealth(
  bundle: ReportProjectBundle,
  checkResult?: CheckResult | null,
): ReportHealth {
  const readinessScore = clampScore(checkResult?.readinessScore ?? contentCoverage(bundle));
  const weak = computeWeakSectionScore(bundle, checkResult ?? undefined);
  const evidence = computeEvidenceScore(bundle);

  const breakdown: ReportHealthBreakdown[] = [
    {
      id: "readiness",
      label: "Độ sẵn sàng",
      score: readinessScore,
      weight: REPORT_HEALTH_WEIGHTS.readiness,
      detail: checkResult
        ? `${checkResult.issues.length} vấn đề từ lần soát gần nhất`
        : "Ước tính từ tỷ lệ mục đã có nội dung",
    },
    {
      id: "weak-sections",
      label: "Mục yếu",
      score: weak.score,
      weight: REPORT_HEALTH_WEIGHTS.weakSections,
      detail: `${weak.count} mục cần chú ý`,
    },
    {
      id: "evidence",
      label: "Minh chứng",
      score: evidence.score,
      weight: REPORT_HEALTH_WEIGHTS.evidence,
      detail: `${evidence.coveredSections}/${evidence.totalSections} mục có minh chứng`,
    },
  ];

  const score = clampScore(
    breakdown.reduce((sum, item) => sum + item.score * item.weight, 0),
  );

  return {
    score,
    status: statusFromScore(score),
    breakdown,
    weakestSectionId: weak.weakestSectionId,
  };
}
