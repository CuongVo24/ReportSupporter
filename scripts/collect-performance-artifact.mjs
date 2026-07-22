// Aggregate the per-size KPI files written by e2e/workspace-performance.spec.ts
// into one canonical performance artifact with commit/env/fixture metadata, so
// perf claims (F–P before/after) reference the same evidence file instead of a
// reducer microbench. Emits test-results/performance/performance-artifact.json.
//
// Also computes the truthful editor-ready transferred-JS total from the real
// browser trace — the number check-bundle-budget.mjs consumes for its
// transitive "critical dynamic graph" set instead of the undercounted
// app-build-manifest route total.
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

const PERF_DIR = path.join(process.cwd(), "test-results", "performance");

function gitCommit() {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

async function readKpis() {
  let entries = [];
  try {
    entries = await readdir(PERF_DIR);
  } catch {
    return [];
  }
  const files = entries.filter((name) => /^kpi-.*\.json$/.test(name));
  const kpis = [];
  for (const file of files) {
    kpis.push(JSON.parse(await readFile(path.join(PERF_DIR, file), "utf8")));
  }
  return kpis;
}

const kpis = await readKpis();
if (kpis.length === 0) {
  console.error(
    "Không tìm thấy KPI hiệu năng. Chạy `PLAYWRIGHT_USE_BUILD=1 npm run test:perf:e2e` trước khi thu artifact.",
  );
  process.exitCode = 1;
} else {
  const artifact = {
    schema: "report-supporter-performance-artifact@1",
    commit: gitCommit(),
    node: process.version,
    collectedAt: new Date().toISOString(),
    // At least one production KPI must exist for the artifact to be canonical.
    canonical: kpis.some((kpi) => kpi.production === true),
    fixtures: kpis.map((kpi) => ({
      size: kpi.size,
      production: kpi.production,
      editorReadyMs: kpi.editorReadyMs,
      inputPreviewMs: kpi.inputPreviewMs,
      longTaskTotalMs: kpi.longTaskTotalMs,
      longTaskMaxMs: kpi.longTaskMaxMs,
      heapUsedBytes: kpi.heapUsedBytes,
      workerErrors: kpi.workerErrors ?? [],
      transferredChunkBytes: kpi.transferredChunkBytes,
      transferredChunkCount: (kpi.transferredChunks ?? []).length,
      transferredChunks: kpi.transferredChunks ?? [],
    })),
  };
  await writeFile(
    path.join(PERF_DIR, "performance-artifact.json"),
    JSON.stringify(artifact, null, 2),
    "utf8",
  );
  console.log(
    `Đã thu ${kpis.length} KPI → performance-artifact.json (canonical=${artifact.canonical}).`,
  );
  if (!artifact.canonical) {
    console.warn(
      "Cảnh báo: chưa có KPI production (PLAYWRIGHT_USE_BUILD=1). Artifact chỉ mang tính advisory, không dùng để đánh performance DONE.",
    );
  }
}
