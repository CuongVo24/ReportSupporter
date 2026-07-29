import fs from "node:fs";
import path from "node:path";
import {
  CATALOG_PATH,
  QA_DIR,
  REQUIREMENTS_PATH,
  expandCatalog,
  getCaseEnvironments,
  readJson,
  resultKey,
  toCsv,
} from "./qa-core.mjs";

const checkMode = process.argv.includes("--check");
const catalog = readJson(CATALOG_PATH);
const requirementRegistry = readJson(REQUIREMENTS_PATH);
const automationRegistry = readJson(path.join(QA_DIR, "catalog", "automation-suites.json"));
const instances = expandCatalog(catalog);
const instancesByBaseId = Object.groupBy(instances, (instance) => instance.baseId);
const generatedDir = path.join(QA_DIR, "generated");
const masterPreamblePath = path.join(QA_DIR, "catalog", "master-plan-preamble.md");

const GROUP_NAMES = {
  A: "Thư viện và vòng đời dự án",
  B: "Template, metadata và AI",
  C: "Soạn thảo nội dung",
  D: "Định dạng và Preview",
  E: "Checker và Readiness",
  F: "Import và an toàn tài nguyên",
  G: "Evidence Kit",
  H: "Export HTML/PDF/DOCX",
  I: "Nộp bài",
  J: "Thuyết trình",
  K: "Command Palette và shortcut",
  L: "Persistence, recovery, offline và PWA",
  M: "Tương thích, accessibility, privacy và phi chức năng",
  N: "Server/API security",
  O: "Release và supply-chain",
};

function automationText(automation) {
  return automation.length === 0
    ? "Manual — không có automation thay thế acceptance"
    : automation.map((entry) => `${entry.type}:${entry.path}`).join("; ");
}

function countBy(values) {
  return Object.entries(Object.groupBy(values, (value) => value))
    .map(([name, entries]) => [name, entries.length])
    .sort(([left], [right]) => left.localeCompare(right));
}

function renderSummary(headingLevel) {
  const heading = "#".repeat(headingLevel);
  const caseLevelCounts = Object.fromEntries(countBy(catalog.cases.flatMap((testCase) => testCase.testLevels)));
  const suiteLevelCounts = Object.fromEntries(countBy(automationRegistry.suites.flatMap((suite) => suite.testLevels)));
  const allLevels = [...new Set([...Object.keys(caseLevelCounts), ...Object.keys(suiteLevelCounts)])].sort();
  const modeRows = countBy(catalog.cases.map((testCase) => testCase.executionMode));
  const lines = [
    `${heading} Tổng quan coverage`,
    "",
    `- Schema: \`${catalog.schema}\``,
    `- Phiên bản catalog: \`${catalog.version}\``,
    `- Base cases: **${catalog.cases.length}**`,
    `- Expanded environment instances: **${instances.length}**`,
    "- Canonical source: `Design/QA/catalog/test-cases.json`",
    "- Mỗi case bên dưới có test data, tiền điều kiện, từng bước/expected, evidence và cleanup.",
    "",
    "| Tầng kiểm thử | Base acceptance case | Automated suite |",
    "|---|---:|---:|",
    ...allLevels.map((level) => `| ${level} | ${caseLevelCounts[level] ?? 0} | ${suiteLevelCounts[level] ?? 0} |`),
    "",
    "| Cách thực thi | Số base case |",
    "|---|---:|",
    ...modeRows.map(([mode, count]) => `| ${mode} | ${count} |`),
    "",
    `${heading} Bản đồ nhóm A–O`,
    "",
    "| Nhóm | Phạm vi | Base case | Expanded instances | Tầng kiểm thử |",
    "|---|---|---:|---:|---|",
  ];

  for (const [group, groupCases] of Object.entries(Object.groupBy(catalog.cases, (testCase) => testCase.group))) {
    const groupInstances = groupCases.flatMap((testCase) => instancesByBaseId[testCase.id] ?? []);
    const levels = [...new Set(groupCases.flatMap((testCase) => testCase.testLevels))].join(", ");
    lines.push(`| ${group} | ${GROUP_NAMES[group]} | ${groupCases.length} | ${groupInstances.length} | ${levels} |`);
  }

  return lines;
}

function renderCases(groupHeadingLevel, caseHeadingLevel) {
  const lines = [];
  const groupHeading = "#".repeat(groupHeadingLevel);
  const caseHeading = "#".repeat(caseHeadingLevel);

  for (const [group, groupCases] of Object.entries(Object.groupBy(catalog.cases, (testCase) => testCase.group))) {
    lines.push(`${groupHeading} ${group} — ${GROUP_NAMES[group]}`, "");
    for (const testCase of groupCases) {
      lines.push(
        `${caseHeading} ${testCase.id} — ${testCase.title}`,
        "",
        "| Thuộc tính | Giá trị |",
        "|---|---|",
        `| Priority | ${testCase.priority} |`,
        `| Tầng kiểm thử | ${testCase.testLevels.join(", ")} |`,
        `| Cách thực thi | ${testCase.executionMode} |`,
        `| Requirements | ${testCase.requirementIds.map((id) => `\`${id}\``).join(", ")} |`,
        `| Environment | ${getCaseEnvironments(catalog, testCase).map((id) => `\`${id}\``).join(", ")} |`,
        `| Fixtures | ${testCase.fixtureIds.length ? testCase.fixtureIds.map((id) => `\`${id}\``).join(", ") : "Không"} |`,
        `| Suite | ${testCase.suites.join(", ")} |`,
        `| Ước tính / timeout | ${testCase.estimatedMinutes} / ${testCase.timeoutMinutes} phút |`,
        `| Automation hỗ trợ | ${automationText(testCase.automation)} |`,
        "",
        `**Mục tiêu/acceptance cuối:** ${testCase.objective}`,
        "",
        `**Test data:** ${testCase.testData}`,
        "",
        `**Tiền điều kiện:** ${testCase.preconditions}`,
        "",
        "**Các bước thực thi và expected result:**",
        "",
      );
      testCase.steps.forEach((step, index) => {
        lines.push(`${index + 1}. **Thao tác:** ${step.action}`, `   - **Expected:** ${step.expected}`);
      });
      lines.push(
        "",
        `**Evidence bắt buộc:** ${testCase.evidence.join(", ")}`,
        "",
        `**Instances phải ghi kết quả riêng:** ${(instancesByBaseId[testCase.id] ?? []).map((instance) => `\`${resultKey(instance)}\``).join(", ")}`,
        "",
        `**Cleanup/isolation:** ${testCase.cleanup}`,
        "",
      );
    }
  }
  return lines;
}

function renderAutomationSuites(headingLevel) {
  const heading = "#".repeat(headingLevel);
  return [
    `${heading} Automated coverage ngoài browser E2E`,
    "",
    "Các suite dưới đây là lớp regression riêng. Chúng không thay thế manual/E2E acceptance của case `hybrid`, nhưng bắt buộc được ghi trong canonical CI evidence.",
    "",
    "| Suite | Tầng | npm command | Phạm vi nguồn | Expected/evidence |",
    "|---|---|---|---|---|",
    ...automationRegistry.suites.map((suite) =>
      `| \`${suite.id}\` — ${suite.title} | ${suite.testLevels.join(", ")} | \`npm run ${suite.command}\` | ${suite.paths.map((entry) => `\`${entry}\``).join(", ")} | ${suite.expected} Evidence: ${suite.evidence.join(", ")} |`,
    ),
    "",
  ];
}

const standaloneCatalog = [
  "<!-- GENERATED FILE — edit Design/QA/catalog/test-cases.json and run npm run qa:catalog:render -->",
  "# Danh mục kiểm thử tổng thể chi tiết — ReportSupporter QA v3.1",
  "",
  ...renderSummary(2),
  "",
  ...renderAutomationSuites(2),
  "",
  "## Kịch bản thực thi A–O",
  "",
  ...renderCases(2, 3),
];

const masterPreamble = fs.readFileSync(masterPreamblePath, "utf8").trimEnd();
const masterPlan = [
  "<!-- GENERATED FILE — policy source: Design/QA/catalog/master-plan-preamble.md; case source: Design/QA/catalog/test-cases.json -->",
  masterPreamble,
  "",
  "## 12. Danh mục kịch bản kiểm thử tổng thể A–O",
  "",
  ...renderSummary(3),
  "",
  ...renderAutomationSuites(3),
  "",
  "### Kịch bản thực thi chi tiết",
  "",
  ...renderCases(3, 4),
];

const csvColumns = [
  "instanceId",
  "baseId",
  "group",
  "title",
  "priority",
  "testLevels",
  "executionMode",
  "requirementIds",
  "environment",
  "fixtureIds",
  "testData",
  "preconditions",
  "steps",
  "expected",
  "cleanup",
  "evidence",
  "automation",
  "estimatedMinutes",
  "timeoutMinutes",
  "suites",
];
const csvRows = instances.map((instance) => ({
  instanceId: instance.instanceId,
  baseId: instance.baseId,
  group: instance.group,
  title: instance.title,
  priority: instance.priority,
  testLevels: instance.testLevels,
  executionMode: instance.executionMode,
  requirementIds: instance.requirementIds,
  environment: instance.environment,
  fixtureIds: instance.fixtureIds,
  testData: instance.testData,
  preconditions: instance.preconditions,
  steps: instance.steps.map((step, index) => `${index + 1}. ${step.action}`),
  expected: instance.steps.map((step, index) => `${index + 1}. ${step.expected}`),
  cleanup: instance.cleanup,
  evidence: instance.evidence,
  automation: automationText(instance.automation),
  estimatedMinutes: instance.estimatedMinutes,
  timeoutMinutes: instance.timeoutMinutes,
  suites: instance.suites,
}));

const casesByRequirement = new Map(requirementRegistry.requirements.map((requirement) => [requirement.id, []]));
for (const testCase of catalog.cases) {
  for (const requirementId of testCase.requirementIds) {
    if (!casesByRequirement.has(requirementId)) casesByRequirement.set(requirementId, []);
    casesByRequirement.get(requirementId).push(testCase);
  }
}
const traceabilityColumns = [
  "requirementId",
  "area",
  "title",
  "source",
  "section",
  "risk",
  "owner",
  "testInstances",
  "testLevels",
  "automation",
  "evidence",
];
const traceabilityRows = requirementRegistry.requirements.map((requirement) => {
  const testCases = casesByRequirement.get(requirement.id) ?? [];
  const automationSuites = automationRegistry.suites.filter((suite) => suite.requirementIds.includes(requirement.id));
  return {
    ...requirement,
    requirementId: requirement.id,
    testInstances: testCases.flatMap((testCase) =>
      (instancesByBaseId[testCase.id] ?? []).map((instance) => resultKey(instance)),
    ),
    testLevels: [...new Set([
      ...testCases.flatMap((testCase) => testCase.testLevels),
      ...automationSuites.flatMap((suite) => suite.testLevels),
    ])],
    automation: [...new Set([
      ...testCases.flatMap((testCase) => testCase.automation.map((entry) => `${entry.type}:${entry.path}`)),
      ...automationSuites.map((suite) => `npm:${suite.command}`),
    ])],
    evidence: [...new Set([
      ...testCases.flatMap((testCase) => testCase.evidence),
      ...automationSuites.flatMap((suite) => suite.evidence),
    ])],
  };
});

const resultTemplateColumns = [
  "instanceId",
  "priority",
  "testLevels",
  "executionMode",
  "environment",
  "status",
  "actualResult",
  "evidenceIds",
  "bugIds",
  "runner",
  "durationMinutes",
  "notes",
];
const resultTemplateRows = instances.map((instance) => ({
  instanceId: instance.instanceId,
  priority: instance.priority,
  testLevels: instance.testLevels,
  executionMode: instance.executionMode,
  environment: instance.environment,
  status: "NOT_RUN",
  actualResult: "",
  evidenceIds: "",
  bugIds: "",
  runner: "",
  durationMinutes: "",
  notes: "",
}));

const outputs = new Map([
  [path.join(QA_DIR, "KichBan-Test-Tong-The.md"), `${masterPlan.join("\n").trimEnd()}\n`],
  [path.join(generatedDir, "Test-Catalog.md"), `${standaloneCatalog.join("\n").trimEnd()}\n`],
  [path.join(generatedDir, "test-catalog.csv"), toCsv(csvRows, csvColumns)],
  [path.join(generatedDir, "traceability.csv"), toCsv(traceabilityRows, traceabilityColumns)],
  [path.join(QA_DIR, "templates", "case-results.template.csv"), toCsv(resultTemplateRows, resultTemplateColumns)],
]);

let stale = false;
for (const [filePath, content] of outputs) {
  if (checkMode) {
    if (!fs.existsSync(filePath) || fs.readFileSync(filePath, "utf8") !== content) {
      console.error(`Generated file is stale: ${path.relative(process.cwd(), filePath)}`);
      stale = true;
    }
  } else {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`Rendered ${path.relative(process.cwd(), filePath)}`);
  }
}

if (stale) process.exitCode = 1;
