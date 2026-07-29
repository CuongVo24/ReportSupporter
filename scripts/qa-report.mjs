import fs from "node:fs";
import path from "node:path";
import {
  CATALOG_PATH,
  FIXTURE_MANIFEST_PATH,
  computeReleaseDecision,
  expandCatalog,
  parseCsv,
  percent,
  readJson,
  resultKey,
  sha256File,
  summarizeResults,
  writeJson,
} from "./qa-core.mjs";
import { validateQaPackage } from "./qa-validate.mjs";

function runDirectory() {
  const index = process.argv.indexOf("--run");
  if (index === -1 || !process.argv[index + 1]) throw new Error("Usage: npm run qa:report -- --run <run-dir>");
  return path.resolve(process.argv[index + 1]);
}

const runDir = runDirectory();
const validation = validateQaPackage({ runDir });
if (validation.errors.length > 0) {
  validation.errors.forEach((error) => console.error(`QA report validation: ${error}`));
  process.exit(1);
}

const run = readJson(path.join(runDir, "run.json"));
const allResults = parseCsv(fs.readFileSync(path.join(runDir, "case-results.csv"), "utf8"));
const defectList = readJson(path.join(runDir, "defects.json"));
const evidenceIndex = readJson(path.join(runDir, "evidence-index.json"));
const instances = expandCatalog(readJson(CATALOG_PATH));
const instancesByKey = new Map(instances.map((instance) => [resultKey(instance), instance]));
const scopedResultKeys = new Set(
  instances
    .filter((instance) => run.scope === "full" || instance.suites.includes(run.scope))
    .map(resultKey),
);
const results = allResults.filter((result) => scopedResultKeys.has(resultKey(result)));
const summary = summarizeResults(results, instancesByKey);
const release = computeReleaseDecision({
  summary,
  defects: defectList.defects,
  canonicalCiPass: run.canonicalCi.pass === true,
  securityGatesPass: run.securityGates.pass === true,
  finalized: run.finalized === true,
});

const report = {
  schema: "qa-report@1",
  runId: run.runId,
  scope: run.scope,
  commitSha: run.commitSha,
  planVersion: run.planVersion,
  finalized: run.finalized,
  generatedFrom: {
    catalogSha256: sha256File(CATALOG_PATH),
    fixtureManifestSha256: sha256File(FIXTURE_MANIFEST_PATH),
    caseResultsSha256: sha256File(path.join(runDir, "case-results.csv")),
    evidenceIndexSha256: sha256File(path.join(runDir, "evidence-index.json")),
  },
  summary,
  defectCounts: Object.fromEntries(["S0", "S1", "S2", "S3"].map((severity) => [
    severity,
    defectList.defects.filter((defect) => defect.severity === severity && !["CLOSED", "RETEST_PASS"].includes(defect.state)).length,
  ])),
  evidenceCount: evidenceIndex.entries.length,
  releaseDecision: release.decision,
  openBlockingDefects: release.openBlockingDefects,
  canonicalCi: run.canonicalCi,
  securityGates: run.securityGates,
  manualEvidenceRelease: run.manualEvidenceRelease,
};

writeJson(path.join(runDir, "report.json"), report);

const lines = [
  `# Báo cáo QA — ${run.runId}`,
  "",
  `- Plan: \`${run.planVersion}\``,
  `- Commit: \`${run.commitSha}\``,
  `- Build/scope: \`${run.build}\` / \`${run.scope}\``,
  `- Tester: ${run.tester}`,
  `- Thời gian: ${run.startedAt}${run.endedAt ? ` → ${run.endedAt}` : ""}`,
  `- Finalized: ${run.finalized ? "Có" : "Không"}`,
  "",
  "## Môi trường",
  "",
  "| ID | OS | Browser | Version | Viewport/device |",
  "|---|---|---|---|---|",
  ...run.environments.map((environment) => `| ${environment.id} | ${environment.os} | ${environment.browser} | ${environment.browserVersion} | ${environment.viewportOrDevice} |`),
  "",
  "## Kết quả",
  "",
  "| TP | Total | Pass | Fail | Blocked | Not run | In progress | N/A | Execution coverage | Pass rate |",
  "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  ...Object.entries(summary).map(([priority, bucket]) => {
    const passed = bucket.PASS + bucket.RETEST_PASS;
    const failed = bucket.FAIL + bucket.RETEST_FAIL;
    return `| ${priority} | ${bucket.total} | ${passed} | ${failed} | ${bucket.BLOCKED} | ${bucket.NOT_RUN} | ${bucket.IN_PROGRESS} | ${bucket.NA} | ${percent(bucket.executionCoverage)} | ${percent(bucket.passRate)} |`;
  }),
  "",
  "Execution coverage = executed applicable / (total − N/A). Pass rate = (Pass + Retest pass) / all executed pass/fail results.",
  "",
  "## Defects",
  "",
  "| ID | Severity | Priority | State | Owner | Fixed build |",
  "|---|---|---|---|---|---|",
  ...defectList.defects.map((defect) => `| ${defect.id} | ${defect.severity} | ${defect.priority} | ${defect.state} | ${defect.owner ?? "Unassigned"} | ${defect.fixedBuild ?? "—"} |`),
  "",
  "## Evidence và gates",
  "",
  `- Evidence entries: ${evidenceIndex.entries.length}`,
  `- Canonical CI: ${run.canonicalCi.pass ? "PASS" : "FAIL/NOT RUN"}${run.canonicalCi.runUrl ? ` — ${run.canonicalCi.runUrl}` : ""}`,
  `- Security gates: ${run.securityGates.pass ? "PASS" : "FAIL/NOT RUN"}`,
  `- Manual evidence: ${run.manualEvidenceRelease?.url || "Chưa công bố"}`,
  "",
  "## Quyết định",
  "",
  `**${release.decision.replaceAll("_", "-")}**`,
  "",
  release.openBlockingDefects.length > 0
    ? `Open S0/S1: ${release.openBlockingDefects.join(", ")}.`
    : "Không có S0/S1 mở.",
  "",
  "Báo cáo này được sinh từ dữ liệu chuẩn hóa; không sửa tổng số, pass rate hoặc release decision bằng tay.",
  "",
];

fs.writeFileSync(path.join(runDir, "report.md"), lines.join("\n"), "utf8");
console.log(`Generated ${path.join(runDir, "report.md")} (${release.decision}).`);
