// W24-O truthful bundle budget.
//
// The previous version summed only `app-build-manifest.pages[route]` — the
// initial route chunks — and reported ~104.7 KiB for the Workspace while the
// real editor-ready graph (WorkspaceLoader -> dynamic import("./Workspace") ->
// its transitive chunks) transfers ~596.9 KiB gzip. That undercount let a
// bloated critical path pass. Next's client manifests do not enumerate the
// arbitrary `import()` graph (react-loadable-manifest is empty for App Router),
// so the canonical transitive number comes from the real production browser
// trace captured by e2e/workspace-performance.spec.ts.
//
// Three sets, no double counting:
//   1. initial   — route JS from app-build-manifest (static, always enforced).
//   2. critical  — editor-ready transferred JS from the production trace
//                  (canonical when present; otherwise reported as UNMEASURED and
//                  the critical budget is not silently passed).
//   3. optional  — feature chunks pulled only after an explicit action; not
//                  counted against the editor-ready budget.
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const cwd = process.cwd();
const manifestPath = path.join(cwd, ".next", "app-build-manifest.json");
const perfArtifactPath = path.join(cwd, "test-results", "performance", "performance-artifact.json");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

async function gzipBytesForFiles(files) {
  let bytes = 0;
  for (const file of files) {
    if (!file.endsWith(".js")) continue;
    const absolutePath = path.join(cwd, ".next", file);
    await stat(absolutePath);
    bytes += gzipSync(await readFile(absolutePath)).byteLength;
  }
  return bytes;
}

function routeFiles(routeKey) {
  const files = new Set();
  for (const [route, entries] of Object.entries(manifest.pages ?? {})) {
    if (route === routeKey) for (const file of entries) files.add(file);
  }
  return files;
}

async function loadPerfArtifact() {
  try {
    return JSON.parse(await readFile(perfArtifactPath, "utf8"));
  } catch {
    return null;
  }
}

// The Workspace editor-ready critical transferred JS, from the production trace.
function criticalTransferredBytes(artifact) {
  if (!artifact || artifact.canonical !== true) return null;
  const large = artifact.fixtures?.find((fixture) => fixture.size === "large" && fixture.production);
  const fixture = large ?? artifact.fixtures?.find((entry) => entry.production);
  if (!fixture || typeof fixture.transferredChunkBytes !== "number") return null;
  return fixture.transferredChunkBytes;
}

const perfArtifact = await loadPerfArtifact();

const budgets = [
  { name: "Project Library (initial route)", route: "/page", max: 200 * 1024, kind: "initial" },
  { name: "Workspace (initial route)", route: "/workspace/[projectId]/page", max: 200 * 1024, kind: "initial" },
  // Editor-ready critical graph budget reflects the real transitive number
  // (WorkspaceLoader -> Workspace), not the initial route slice.
  { name: "Workspace editor-ready (critical transitive)", route: "/workspace/[projectId]/page", max: 650 * 1024, kind: "critical" },
];

let failed = false;
for (const budget of budgets) {
  if (budget.kind === "initial") {
    const bytes = await gzipBytesForFiles(routeFiles(budget.route));
    if (bytes === 0) throw new Error(`Không tìm thấy chunk cho ${budget.name}.`);
    const over = bytes > budget.max;
    console.log(`${budget.name}: ${(bytes / 1024).toFixed(1)} KiB / ${(budget.max / 1024).toFixed(0)} KiB${over ? "  ❌ VƯỢT" : ""}`);
    if (over) failed = true;
    continue;
  }

  // critical (transitive) — sourced from the production browser trace.
  const bytes = criticalTransferredBytes(perfArtifact);
  if (bytes === null) {
    console.warn(
      `${budget.name}: UNMEASURED — chưa có performance-artifact.json production. ` +
        `Chạy \`PLAYWRIGHT_USE_BUILD=1 npm run test:perf:e2e && npm run perf:collect\`. ` +
        `Không tính transitive bằng route manifest (tránh lặp lại con số 104.7 KiB giả).`,
    );
    if (process.env.CI) {
      // On canonical CI the trace is required; missing it is a gate failure, not a silent pass.
      failed = true;
    }
    continue;
  }
  const over = bytes > budget.max;
  console.log(`${budget.name}: ${(bytes / 1024).toFixed(1)} KiB / ${(budget.max / 1024).toFixed(0)} KiB (production trace)${over ? "  ❌ VƯỢT" : ""}`);
  if (over) failed = true;
}

if (failed) process.exitCode = 1;
