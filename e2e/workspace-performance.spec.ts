// Canonical W24-O performance gate — production build, actual Chromium, actual
// Web Worker. This is the user-path gate the fake-worker/reducer unit tests
// could never be: it mounts the real Workspace, loads the seeded project from
// IndexedDB, runs the preview pipeline through the real module worker, and
// records editor-ready latency, input→preview latency, long tasks, worker
// console errors, the set of JS chunks actually transferred to reach
// editor-ready, and heap. Results are written to a KPI artifact for before/after.
//
// Run against the production server: PLAYWRIGHT_USE_BUILD=1 npx playwright test
// e2e/workspace-performance.spec.ts. On a dev server the bundle/chunk numbers are
// not canonical, so chunk assertions are advisory unless PLAYWRIGHT_USE_BUILD=1.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import { buildPerformanceProject, seedPerformanceProject, type PerformanceSize } from "./fixtures/performance-project";

const IS_PRODUCTION = process.env.PLAYWRIGHT_USE_BUILD === "1";
const ARTIFACT_DIR = path.join(process.cwd(), "test-results", "performance");

// Absolute safety ceilings (fail hard) are generous; the canonical regression
// deltas live in the artifact and are compared by scripts/collect-performance-artifact.mjs.
const CEILINGS: Record<PerformanceSize, { editorReadyMs: number; inputPreviewMs: number; longTaskTotalMs: number }> = {
  small: { editorReadyMs: 6_000, inputPreviewMs: 1_500, longTaskTotalMs: 2_500 },
  large: { editorReadyMs: 9_000, inputPreviewMs: 3_000, longTaskTotalMs: 4_500 },
};

type Kpi = {
  size: PerformanceSize;
  editorReadyMs: number;
  inputPreviewMs: number;
  longTaskTotalMs: number;
  longTaskMaxMs: number;
  workerErrors: string[];
  transferredChunks: string[];
  transferredChunkBytes: number;
  heapUsedBytes: number | null;
};

function gitCommit(): string {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

async function installLongTaskObserver(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __longTasks?: number[] };
    w.__longTasks = [];
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) w.__longTasks!.push(entry.duration);
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch {
      // longtask unsupported → stays empty; assertions treat missing data as 0.
    }
  });
}

async function measure(page: Page, size: PerformanceSize): Promise<Kpi> {
  const workerErrors: string[] = [];
  const transferred = new Map<string, number>();

  page.on("console", (message) => {
    if (message.type() === "error") workerErrors.push(message.text());
  });
  page.on("pageerror", (error) => workerErrors.push(error.message));
  page.on("response", (response) => {
    const url = response.url();
    if (!url.endsWith(".js")) return;
    const length = Number(response.headers()["content-length"] ?? 0);
    transferred.set(url, Number.isFinite(length) ? length : 0);
  });

  const fixture = buildPerformanceProject(size);
  await installLongTaskObserver(page);
  await seedPerformanceProject(page, fixture);

  const navigationStart = Date.now();
  await page.goto(`/workspace/${fixture.projectId}`);
  // Editor-ready = the seeded first section is rendered in the editor.
  const editor = page.getByRole("textbox").first();
  await expect(editor).toBeVisible({ timeout: CEILINGS[size].editorReadyMs + 5_000 });
  const editorReadyMs = Date.now() - navigationStart;

  // input→preview: type into the editor and wait for the preview to reflect it.
  const marker = `PERFPROBE-${Date.now()}`;
  const inputStart = Date.now();
  await editor.click();
  await editor.press("End");
  await editor.type(`\n\n${marker}`);
  await expect(page.getByText(marker).first()).toBeVisible({ timeout: CEILINGS[size].inputPreviewMs + 5_000 });
  const inputPreviewMs = Date.now() - inputStart;

  const longTasks = await page.evaluate(() => (window as unknown as { __longTasks?: number[] }).__longTasks ?? []);
  const longTaskTotalMs = longTasks.reduce((sum, value) => sum + value, 0);
  const longTaskMaxMs = longTasks.reduce((max, value) => Math.max(max, value), 0);

  const heapUsedBytes = await page.evaluate(() => {
    const perf = performance as unknown as { memory?: { usedJSHeapSize?: number } };
    return typeof perf.memory?.usedJSHeapSize === "number" ? perf.memory.usedJSHeapSize : null;
  });

  const transferredChunks = [...transferred.keys()].map((url) => new URL(url).pathname).sort();
  const transferredChunkBytes = [...transferred.values()].reduce((sum, value) => sum + value, 0);

  return {
    size,
    editorReadyMs,
    inputPreviewMs,
    longTaskTotalMs,
    longTaskMaxMs,
    workerErrors,
    transferredChunks,
    transferredChunkBytes,
    heapUsedBytes,
  };
}

for (const size of ["small", "large"] as PerformanceSize[]) {
  test(`workspace performance (${size}) — actual worker, editor-ready, input→preview`, async ({ page }) => {
    const kpi = await measure(page, size);

    await mkdir(ARTIFACT_DIR, { recursive: true });
    await writeFile(
      path.join(ARTIFACT_DIR, `kpi-${size}.json`),
      JSON.stringify(
        {
          commit: gitCommit(),
          production: IS_PRODUCTION,
          node: process.version,
          userAgent: await page.evaluate(() => navigator.userAgent),
          measuredAt: new Date().toISOString(),
          ...kpi,
        },
        null,
        2,
      ),
      "utf8",
    );

    // A worker that crashes (e.g. `document is not defined`) surfaces as a console
    // error — that must fail the gate, which the fake-worker unit test could not do.
    expect(kpi.workerErrors, `worker/page console errors:\n${kpi.workerErrors.join("\n")}`).toEqual([]);
    expect(kpi.editorReadyMs).toBeLessThan(CEILINGS[size].editorReadyMs);
    expect(kpi.inputPreviewMs).toBeLessThan(CEILINGS[size].inputPreviewMs);
    expect(kpi.longTaskTotalMs).toBeLessThan(CEILINGS[size].longTaskTotalMs);
  });
}
