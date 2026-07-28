import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  CATALOG_PATH,
  FINALIZED_FORBIDDEN_STATUSES,
  FIXTURE_MANIFEST_PATH,
  QA_DIR,
  QA_STATUSES,
  REQUIREMENTS_PATH,
  expandCatalog,
  parseCsv,
  readJson,
  resolveRepoPath,
  resolveWithin,
  scanSecrets,
  sha256File,
} from "./qa-core.mjs";

export function validateQaPackage({ runDir = null } = {}) {
  const errors = [];
  const catalog = readJson(CATALOG_PATH);
  const requirements = readJson(REQUIREMENTS_PATH);
  const fixtureManifest = readJson(FIXTURE_MANIFEST_PATH);

  if (catalog.schema !== "qa-test-case@1") errors.push(`Catalog schema must be qa-test-case@1, got ${catalog.schema}`);
  if (requirements.schema !== "qa-requirements@1") errors.push(`Requirements schema must be qa-requirements@1, got ${requirements.schema}`);
  if (fixtureManifest.schema !== "qa-fixture-manifest@1") errors.push(`Fixture schema must be qa-fixture-manifest@1, got ${fixtureManifest.schema}`);

  const caseIds = new Set();
  const requirementIds = new Set(requirements.requirements.map((requirement) => requirement.id));
  const fixtureIds = new Set(fixtureManifest.entries.map((entry) => entry.id));
  const requirementCoverage = new Map(requirements.requirements.map((requirement) => [requirement.id, []]));
  for (const testCase of catalog.cases) {
    if (caseIds.has(testCase.id)) errors.push(`Duplicate case ID: ${testCase.id}`);
    caseIds.add(testCase.id);
    if (!/^[A-O]\d{2}$/.test(testCase.id)) errors.push(`Invalid case ID: ${testCase.id}`);
    if (!["TP0", "TP1", "TP2"].includes(testCase.priority)) errors.push(`Invalid priority: ${testCase.id}`);
    if (!Array.isArray(testCase.steps) || testCase.steps.length === 0) errors.push(`No steps: ${testCase.id}`);
    if (!Array.isArray(testCase.evidence) || testCase.evidence.length === 0) errors.push(`No evidence policy: ${testCase.id}`);
    if (testCase.priority === "TP0" && testCase.evidence.length === 0) errors.push(`TP0 missing evidence: ${testCase.id}`);
    if (!(testCase.estimatedMinutes > 0) || !(testCase.timeoutMinutes >= testCase.estimatedMinutes)) {
      errors.push(`Invalid time budget: ${testCase.id}`);
    }
    for (const requirementId of testCase.requirementIds ?? []) {
      if (!requirementIds.has(requirementId)) errors.push(`Unknown requirement ${requirementId}: ${testCase.id}`);
      else requirementCoverage.get(requirementId).push(testCase.id);
    }
    if (!testCase.requirementIds?.length) errors.push(`Case has no requirement: ${testCase.id}`);
    for (const fixtureId of testCase.fixtureIds ?? []) {
      if (!fixtureIds.has(fixtureId)) errors.push(`Unknown fixture ${fixtureId}: ${testCase.id}`);
    }
    for (const automation of testCase.automation ?? []) {
      try {
        const automationPath = resolveRepoPath(automation.path);
        if (!fs.existsSync(automationPath)) errors.push(`Automation path missing ${automation.path}: ${testCase.id}`);
      } catch (error) {
        errors.push(String(error.message ?? error));
      }
    }
  }

  const expectedLegacyMax = { A: 11, B: 13, C: 18, D: 10, E: 11, F: 17, G: 8, H: 14, I: 10, J: 10, K: 7, L: 11, M: 16 };
  for (const [group, maximum] of Object.entries(expectedLegacyMax)) {
    for (let number = 1; number <= maximum; number += 1) {
      const id = `${group}${String(number).padStart(2, "0")}`;
      if (!caseIds.has(id)) errors.push(`Legacy case missing: ${id}`);
    }
  }
  for (const [requirementId, coveredCases] of requirementCoverage) {
    const requirement = requirements.requirements.find((item) => item.id === requirementId);
    if (coveredCases.length === 0 && !requirement?.notApplicableReason) errors.push(`Requirement has no case: ${requirementId}`);
    try {
      const sourcePath = resolveRepoPath(requirement.source);
      if (!fs.existsSync(sourcePath)) errors.push(`Requirement source missing: ${requirement.source}`);
    } catch (error) {
      errors.push(String(error.message ?? error));
    }
  }

  const manifestIds = new Set();
  for (const fixture of fixtureManifest.entries) {
    if (manifestIds.has(fixture.id)) errors.push(`Duplicate fixture ID: ${fixture.id}`);
    manifestIds.add(fixture.id);
    try {
      const fixturePath = resolveRepoPath(fixture.path);
      if (!fs.existsSync(fixturePath)) errors.push(`Fixture file missing: ${fixture.id} ${fixture.path}`);
      if (!fixture.sha256 || !/^[0-9a-f]{64}$/.test(fixture.sha256)) errors.push(`Fixture hash missing/invalid: ${fixture.id}`);
      if (!fixture.oracle || Object.keys(fixture.oracle).length === 0) errors.push(`Fixture oracle missing: ${fixture.id}`);
    } catch (error) {
      errors.push(String(error.message ?? error));
    }
  }

  const instances = expandCatalog(catalog);
  const instanceIds = new Set();
  for (const instance of instances) {
    if (instanceIds.has(instance.instanceId)) errors.push(`Duplicate expanded instance: ${instance.instanceId}`);
    instanceIds.add(instance.instanceId);
  }
  if (instances.length < 209) errors.push(`Expanded catalog unexpectedly small: ${instances.length}`);

  if (runDir) validateRun({ runDir: path.resolve(runDir), instances, instanceIds, errors });
  return { errors, baseCaseCount: catalog.cases.length, instanceCount: instances.length };
}

function validateRun({ runDir, instances, instanceIds, errors }) {
  const runPath = path.join(runDir, "run.json");
  const resultsPath = path.join(runDir, "case-results.csv");
  const evidencePath = path.join(runDir, "evidence-index.json");
  const defectsPath = path.join(runDir, "defects.json");
  for (const requiredPath of [runPath, resultsPath, evidencePath, defectsPath]) {
    if (!fs.existsSync(requiredPath)) errors.push(`Run file missing: ${path.basename(requiredPath)}`);
  }
  if (errors.some((error) => error.startsWith("Run file missing:"))) return;

  const run = readJson(runPath);
  const results = parseCsv(fs.readFileSync(resultsPath, "utf8"));
  const evidenceIndex = readJson(evidencePath);
  const defectList = readJson(defectsPath);
  if (run.schema !== "qa-run@1") errors.push(`Invalid run schema: ${run.schema}`);
  if (!/^RS-E2E-\d{8}-\d{2}$/.test(run.runId)) errors.push(`Invalid Run ID: ${run.runId}`);
  if (!/^[0-9a-f]{7,40}$/.test(run.commitSha)) errors.push(`Invalid commit SHA: ${run.commitSha}`);
  if (run.build !== "production") errors.push("Formal QA run must use production build");
  if (!["smoke", "critical", "full"].includes(run.scope)) errors.push(`Invalid run scope: ${run.scope}`);
  if (!run.tester) errors.push("Tester is required");
  if (!run.startedAt) errors.push("startedAt is required");
  if (!Array.isArray(run.environments) || run.environments.length === 0) errors.push("At least one environment is required");
  const catalogVersion = readJson(CATALOG_PATH).version;
  if (run.planVersion !== catalogVersion) errors.push(`Run plan version ${run.planVersion} != catalog ${catalogVersion}`);
  const currentCatalogHash = sha256File(CATALOG_PATH);
  const currentFixtureHash = sha256File(FIXTURE_MANIFEST_PATH);
  if (run.catalogSha256 && run.catalogSha256 !== currentCatalogHash) errors.push("Run catalog hash does not match current catalog");
  if (run.fixtureManifestSha256 && run.fixtureManifestSha256 !== currentFixtureHash) errors.push("Run fixture manifest hash does not match current manifest");

  const resultIds = new Set();
  for (const result of results) {
    if (resultIds.has(result.instanceId)) errors.push(`Duplicate run result: ${result.instanceId}`);
    resultIds.add(result.instanceId);
    if (!instanceIds.has(result.instanceId)) errors.push(`Unknown run instance: ${result.instanceId}`);
    if (!QA_STATUSES.includes(result.status)) errors.push(`Invalid status ${result.status}: ${result.instanceId}`);
    if (/PARTIAL/i.test(result.status)) errors.push(`PARTIAL status is forbidden: ${result.instanceId}`);
    if (run.finalized && FINALIZED_FORBIDDEN_STATUSES.has(result.status)) errors.push(`Finalized run contains ${result.status}: ${result.instanceId}`);
    const expectedPriority = instances.find((instance) => instance.instanceId === result.instanceId)?.priority;
    if (expectedPriority && result.priority !== expectedPriority) errors.push(`Priority drift ${result.instanceId}: ${result.priority} != ${expectedPriority}`);
    if (["FAIL", "RETEST_FAIL"].includes(result.status) && !result.bugIds) errors.push(`Failed case missing bug ID: ${result.instanceId}`);
    if (["PASS", "RETEST_PASS", "FAIL", "RETEST_FAIL"].includes(result.status) && !result.actualResult) {
      errors.push(`Executed case missing actual result: ${result.instanceId}`);
    }
    if (
      result.priority === "TP0"
      && ["PASS", "RETEST_PASS", "FAIL", "RETEST_FAIL"].includes(result.status)
      && !result.evidenceIds
    ) {
      errors.push(`Executed TP0 case missing evidence: ${result.instanceId}`);
    }
  }

  if (evidenceIndex.schema !== "qa-evidence-index@1") errors.push(`Invalid evidence schema: ${evidenceIndex.schema}`);
  if (evidenceIndex.runId !== run.runId) errors.push("Evidence Run ID mismatch");
  const evidenceIds = new Set();
  for (const evidence of evidenceIndex.entries ?? []) {
    if (evidenceIds.has(evidence.id)) errors.push(`Duplicate evidence ID: ${evidence.id}`);
    evidenceIds.add(evidence.id);
    try {
      const filePath = resolveWithin(runDir, evidence.path);
      if (!fs.existsSync(filePath)) {
        errors.push(`Evidence file missing: ${evidence.path}`);
        continue;
      }
      const buffer = fs.readFileSync(filePath);
      if (evidence.byteLength !== buffer.length) errors.push(`Evidence size mismatch: ${evidence.id}`);
      if (evidence.sha256 !== sha256File(filePath)) errors.push(`Evidence hash mismatch: ${evidence.id}`);
      if (evidence.redactionStatus !== "PASS") errors.push(`Evidence redaction not PASS: ${evidence.id}`);
      const findings = scanSecrets(buffer, evidence.path);
      if (findings.length > 0) errors.push(`Evidence secret findings ${findings.join(",")}: ${evidence.id}`);
      for (const caseId of evidence.caseIds ?? []) {
        if (!instanceIds.has(caseId) && !/^[A-O]\d{2}$/.test(caseId)) errors.push(`Evidence references unknown case: ${caseId}`);
      }
    } catch (error) {
      errors.push(String(error.message ?? error));
    }
  }

  if (defectList.schema !== "qa-defect-list@1") errors.push(`Invalid defect list schema: ${defectList.schema}`);
  for (const defect of defectList.defects ?? []) {
    if (defect.schema !== "qa-defect@1") errors.push(`Invalid defect schema: ${defect.id}`);
    if (!["S0", "S1", "S2", "S3"].includes(defect.severity)) errors.push(`Invalid defect severity: ${defect.id}`);
  }

  if (run.finalized) {
    if (!run.endedAt) errors.push("Finalized run requires endedAt");
    if (!run.catalogSha256) errors.push("Finalized run requires catalogSha256");
    if (!run.fixtureManifestSha256) errors.push("Finalized run requires fixtureManifestSha256");
    const expectedResults = instances.filter((instance) => run.scope === "full" || instance.suites.includes(run.scope));
    for (const instance of expectedResults) {
      if (!resultIds.has(instance.instanceId)) errors.push(`Finalized ${run.scope} run missing result: ${instance.instanceId}`);
    }
    const requiredEnvironmentIds = new Set(["ENV-D1", "ENV-D2", "ENV-M1"]);
    for (const environment of run.environments) {
      requiredEnvironmentIds.delete(environment.id);
      if (!environment.browserVersion) errors.push(`Finalized environment missing browserVersion: ${environment.id}`);
      if (!environment.viewportOrDevice) errors.push(`Finalized environment missing viewport/device: ${environment.id}`);
    }
    if (requiredEnvironmentIds.size > 0) errors.push(`Finalized run missing environments: ${[...requiredEnvironmentIds].join(",")}`);
  }
}

function parseRunDir() {
  const index = process.argv.indexOf("--run");
  return index === -1 ? null : process.argv[index + 1];
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = validateQaPackage({ runDir: parseRunDir() });
  if (result.errors.length > 0) {
    result.errors.forEach((error) => console.error(`QA validation: ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`QA validation passed: ${result.baseCaseCount} base cases, ${result.instanceCount} instances.`);
  }
}
