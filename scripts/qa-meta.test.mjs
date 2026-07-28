import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  CATALOG_PATH,
  QA_DIR,
  computeReleaseDecision,
  expandCatalog,
  readJson,
  scanSecrets,
  summarizeResults,
} from "./qa-core.mjs";
import { validateQaPackage } from "./qa-validate.mjs";

test("catalog expansion is stable, unique and preserves every legacy case", () => {
  const catalog = readJson(CATALOG_PATH);
  const first = expandCatalog(catalog).map((instance) => instance.instanceId);
  const second = expandCatalog(catalog).map((instance) => instance.instanceId);
  assert.deepEqual(first, second);
  assert.equal(new Set(first).size, first.length);
  assert.ok(first.length >= 209);
  for (const id of ["A01", "B03[software-project]", "G01[github]", "M01[375x667]", "N12", "O12"]) {
    assert.ok(first.includes(id), `missing ${id}`);
  }
});

test("pass rate excludes blocked/not-run/N/A but execution coverage does not inflate", () => {
  const results = [
    { instanceId: "a", priority: "TP0", status: "PASS" },
    { instanceId: "b", priority: "TP0", status: "FAIL" },
    { instanceId: "c", priority: "TP0", status: "BLOCKED" },
    { instanceId: "d", priority: "TP0", status: "NA" },
  ];
  const summary = summarizeResults(results);
  assert.equal(summary.TP0.passRate, 0.5);
  assert.equal(summary.TP0.executionCoverage, 2 / 3);
});

test("non-canonical PARTIAL_PASS is rejected", () => {
  assert.throws(
    () => summarizeResults([{ instanceId: "a", priority: "TP0", status: "PARTIAL_PASS" }]),
    /Unknown status/,
  );
});

test("open S1 and missing canonical gates always force NO_GO", () => {
  const allPass = summarizeResults([
    { instanceId: "a", priority: "TP0", status: "PASS" },
    { instanceId: "b", priority: "TP1", status: "PASS" },
  ]);
  assert.equal(computeReleaseDecision({
    summary: allPass,
    defects: [{ id: "BUG-001", severity: "S1", state: "OPEN" }],
    canonicalCiPass: true,
    securityGatesPass: true,
    finalized: true,
  }).decision, "NO_GO");
  assert.equal(computeReleaseDecision({
    summary: allPass,
    defects: [],
    canonicalCiPass: false,
    securityGatesPass: true,
    finalized: true,
  }).decision, "NO_GO");
});

test("secret scanner blocks marker and common credential shapes", () => {
  assert.deepEqual(scanSecrets(Buffer.from("qa-secret-marker"), "trace.txt"), ["qa-secret-marker"]);
  assert.ok(scanSecrets(Buffer.from("Authorization: Bearer abcdefghijklmnopqrstuvwxyz"), "request.har").includes("bearer-token"));
  assert.deepEqual(scanSecrets(Buffer.from("safe aggregate metrics"), "metrics.json"), []);
});

test("package validator passes the committed catalog, requirements and fixtures", () => {
  const result = validateQaPackage();
  assert.deepEqual(result.errors, []);
  assert.ok(fs.existsSync(CATALOG_PATH));
});

test("report and evidence bundle are generated from normalized run data and remain NO_GO with open S1", () => {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), "reportsupporter-qa-run-"));
  const run = readJson(path.join(QA_DIR, "templates", "run.template.json"));
  Object.assign(run, {
    runId: "RS-E2E-20260728-99",
    commitSha: "32b7389",
    scope: "smoke",
    tester: "QA tooling meta-test",
    startedAt: "2026-07-28T00:00:00.000Z",
  });
  fs.writeFileSync(path.join(runDir, "run.json"), `${JSON.stringify(run, null, 2)}\n`);
  fs.copyFileSync(path.join(QA_DIR, "templates", "case-results.template.csv"), path.join(runDir, "case-results.csv"));
  fs.writeFileSync(path.join(runDir, "evidence-index.json"), `${JSON.stringify({
    schema: "qa-evidence-index@1",
    runId: run.runId,
    entries: [],
  }, null, 2)}\n`);
  fs.writeFileSync(path.join(runDir, "defects.json"), `${JSON.stringify({
    schema: "qa-defect-list@1",
    runId: run.runId,
    defects: [
      readJson(path.join(QA_DIR, "defects", "BUG-001.json")),
      readJson(path.join(QA_DIR, "defects", "BUG-002.json")),
    ],
  }, null, 2)}\n`);

  const report = spawnSync(process.execPath, ["scripts/qa-report.mjs", "--run", runDir], {
    cwd: path.resolve(QA_DIR, "..", ".."),
    encoding: "utf8",
  });
  assert.equal(report.status, 0, report.stderr);
  assert.equal(readJson(path.join(runDir, "report.json")).releaseDecision, "NO_GO");

  const bundle = spawnSync(process.execPath, ["scripts/qa-bundle.mjs", "--run", runDir], {
    cwd: path.resolve(QA_DIR, "..", ".."),
    encoding: "utf8",
  });
  assert.equal(bundle.status, 0, bundle.stderr);
  assert.ok(fs.statSync(path.join(runDir, "qa-evidence.zip")).size > 0);
  assert.match(fs.readFileSync(path.join(runDir, "qa-evidence.zip.sha256"), "utf8"), /^[0-9a-f]{64}\s+qa-evidence\.zip/);
});
