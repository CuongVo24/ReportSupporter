import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const ROOT_DIR = path.resolve(import.meta.dirname, "..");
export const QA_DIR = path.join(ROOT_DIR, "Design", "QA");
export const CATALOG_PATH = path.join(QA_DIR, "catalog", "test-cases.json");
export const REQUIREMENTS_PATH = path.join(QA_DIR, "catalog", "requirements.json");
export const FIXTURE_MANIFEST_PATH = path.join(QA_DIR, "fixtures", "manifest.json");

export const QA_STATUSES = [
  "NOT_RUN",
  "IN_PROGRESS",
  "PASS",
  "FAIL",
  "BLOCKED",
  "NA",
  "RETEST_PASS",
  "RETEST_FAIL",
];

export const FINALIZED_FORBIDDEN_STATUSES = new Set(["IN_PROGRESS"]);
export const PASS_STATUSES = new Set(["PASS", "RETEST_PASS"]);
export const FAIL_STATUSES = new Set(["FAIL", "RETEST_FAIL"]);
export const EXECUTED_STATUSES = new Set([...PASS_STATUSES, ...FAIL_STATUSES]);

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

export function normalizeRepoPath(value) {
  return value.replaceAll("\\", "/").replace(/^\.?\//, "");
}

export function resolveRepoPath(value) {
  const normalized = normalizeRepoPath(value);
  const resolved = path.resolve(ROOT_DIR, normalized);
  const relative = path.relative(ROOT_DIR, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Path escapes repository: ${value}`);
  }
  return resolved;
}

export function resolveWithin(baseDir, value) {
  const resolved = path.resolve(baseDir, value);
  const relative = path.relative(baseDir, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Path escapes ${baseDir}: ${value}`);
  }
  return resolved;
}

function overlayMatches(testCase, rule) {
  if (rule.groups && !rule.groups.includes(testCase.group)) return false;
  if (rule.priority && rule.priority !== testCase.priority) return false;
  if (rule.requiresEnvironment && !testCase.environments?.includes(rule.requiresEnvironment)) return false;
  return true;
}

export function getCaseEnvironments(catalog, testCase) {
  const environments = new Set(testCase.environments ?? []);
  for (const [environment, overlay] of Object.entries(catalog.environmentOverlays ?? {})) {
    const includedById = overlay.caseIds?.includes(testCase.id) === true;
    const includedByRule = overlay.rules?.some((rule) => overlayMatches(testCase, rule)) === true;
    if (includedById || includedByRule) environments.add(environment);
  }
  return [...environments];
}

export function resultKey({ instanceId, environment }) {
  return environment ? `${instanceId}@${environment}` : instanceId;
}

export function expandCatalog(catalog) {
  const instances = [];
  for (const testCase of catalog.cases) {
    const parameters = Array.isArray(testCase.parameters) && testCase.parameters.length > 0
      ? testCase.parameters
      : [null];
    for (const parameter of parameters) {
      for (const environment of getCaseEnvironments(catalog, testCase)) {
        instances.push({
          ...testCase,
          baseId: testCase.id,
          instanceId: parameter ? `${testCase.id}[${parameter.id}]` : testCase.id,
          parameter,
          environment,
          environments: [environment],
        });
      }
    }
  }
  return instances;
}

export function csvEscape(value) {
  const text = value === undefined || value === null
    ? ""
    : Array.isArray(value)
      ? value.join(";")
      : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(rows, columns) {
  return [
    columns.map(csvEscape).join(","),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")),
    "",
  ].join("\n");
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

export function summarizeResults(results, instancesByKey = new Map()) {
  const priorities = ["TP0", "TP1", "TP2"];
  const summary = Object.fromEntries(priorities.map((priority) => [
    priority,
    {
      total: 0,
      PASS: 0,
      RETEST_PASS: 0,
      FAIL: 0,
      RETEST_FAIL: 0,
      BLOCKED: 0,
      NOT_RUN: 0,
      IN_PROGRESS: 0,
      NA: 0,
      executionCoverage: 0,
      passRate: 0,
    },
  ]));

  for (const result of results) {
    const instance = instancesByKey.get(resultKey(result)) ?? instancesByKey.get(result.instanceId);
    const priority = result.priority || instance?.priority;
    if (!summary[priority]) throw new Error(`Unknown priority for ${result.instanceId}: ${priority}`);
    if (!QA_STATUSES.includes(result.status)) throw new Error(`Unknown status for ${result.instanceId}: ${result.status}`);
    const bucket = summary[priority];
    bucket.total += 1;
    bucket[result.status] += 1;
  }

  for (const bucket of Object.values(summary)) {
    const applicable = bucket.total - bucket.NA;
    const executed = bucket.PASS + bucket.RETEST_PASS + bucket.FAIL + bucket.RETEST_FAIL;
    const passed = bucket.PASS + bucket.RETEST_PASS;
    bucket.executionCoverage = applicable === 0 ? 1 : executed / applicable;
    bucket.passRate = executed === 0 ? 0 : passed / executed;
  }
  return summary;
}

export function computeReleaseDecision({ summary, defects, canonicalCiPass, securityGatesPass = false, finalized = false }) {
  const openBlockingDefects = defects.filter(
    (defect) => ["S0", "S1"].includes(defect.severity) && !["CLOSED", "RETEST_PASS"].includes(defect.state),
  );
  const tp0 = summary.TP0;
  const tp1 = summary.TP1;
  const tp0Ready = tp0.executionCoverage === 1
    && tp0.passRate === 1
    && tp0.BLOCKED === 0
    && tp0.NOT_RUN === 0
    && tp0.IN_PROGRESS === 0;
  const tp1Ready = tp1.executionCoverage === 1 && tp1.passRate >= 0.95 && tp1.IN_PROGRESS === 0;

  if (!finalized || openBlockingDefects.length > 0 || !canonicalCiPass || !securityGatesPass || !tp0Ready) {
    return { decision: "NO_GO", openBlockingDefects: openBlockingDefects.map((defect) => defect.id) };
  }
  const openNonBlocking = defects.filter(
    (defect) => ["S2", "S3"].includes(defect.severity) && !["CLOSED", "RETEST_PASS"].includes(defect.state),
  );
  if (!tp1Ready || openNonBlocking.length > 0) {
    const waiversValid = openNonBlocking.every(
      (defect) => defect.waiver?.approvedBy && defect.waiver?.expiresAt && defect.waiver?.workaround,
    );
    return {
      decision: waiversValid && tp1Ready ? "CONDITIONAL_GO" : "NO_GO",
      openBlockingDefects: [],
    };
  }
  return { decision: "GO", openBlockingDefects: [] };
}

const SECRET_PATTERNS = [
  { name: "qa-secret-marker", regex: /qa-secret-marker/i },
  { name: "private-key", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "github-token", regex: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/ },
  { name: "openai-key", regex: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { name: "bearer-token", regex: /\bBearer\s+[A-Za-z0-9._~-]{16,}\b/i },
];

export function scanSecrets(buffer, fileName = "") {
  const textExtensions = new Set([".json", ".md", ".txt", ".csv", ".html", ".xml", ".log", ".har", ".yaml", ".yml"]);
  if (!textExtensions.has(path.extname(fileName).toLowerCase())) return [];
  const text = buffer.toString("utf8");
  return SECRET_PATTERNS.filter((pattern) => pattern.regex.test(text)).map((pattern) => pattern.name);
}

export function percent(value) {
  return `${(value * 100).toFixed(2)}%`;
}
