import fs from "node:fs";
import path from "node:path";
import {
  CATALOG_PATH,
  QA_DIR,
  REQUIREMENTS_PATH,
  expandCatalog,
  readJson,
  toCsv,
} from "./qa-core.mjs";

const checkMode = process.argv.includes("--check");
const catalog = readJson(CATALOG_PATH);
const requirementRegistry = readJson(REQUIREMENTS_PATH);
const instances = expandCatalog(catalog);
const generatedDir = path.join(QA_DIR, "generated");

function automationText(automation) {
  return automation.length === 0
    ? "Manual"
    : automation.map((entry) => `${entry.type}:${entry.path}`).join("; ");
}

const markdown = [
  "<!-- GENERATED FILE — edit Design/QA/catalog/test-cases.json and run npm run qa:catalog:render -->",
  "# Test catalog chi tiết — ReportSupporter QA v3.0",
  "",
  `- Schema: \`${catalog.schema}\``,
  `- Base cases: **${catalog.cases.length}**`,
  `- Expanded instances: **${instances.length}**`,
  "- Canonical source: `Design/QA/catalog/test-cases.json`",
  "",
];

for (const [group, groupCases] of Object.entries(Object.groupBy(catalog.cases, (testCase) => testCase.group))) {
  markdown.push(`## ${group} — ${groupCases[0]?.title.split(":")[0] ?? group}`, "");
  for (const testCase of groupCases) {
    markdown.push(
      `### ${testCase.id} — ${testCase.title}`,
      "",
      `- **Priority:** ${testCase.priority}`,
      `- **Requirements:** ${testCase.requirementIds.map((id) => `\`${id}\``).join(", ")}`,
      `- **Environment:** ${testCase.environments.map((id) => `\`${id}\``).join(", ")}`,
      `- **Fixtures:** ${testCase.fixtureIds.length ? testCase.fixtureIds.map((id) => `\`${id}\``).join(", ") : "Không"}`,
      `- **Suites:** ${testCase.suites.join(", ")}`,
      `- **Estimated / timeout:** ${testCase.estimatedMinutes} / ${testCase.timeoutMinutes} phút`,
      `- **Automation:** ${automationText(testCase.automation)}`,
      `- **Evidence:** ${testCase.evidence.join(", ")}`,
      "",
      `**Mục tiêu:** ${testCase.objective}`,
      "",
      `**Tiền điều kiện:** ${testCase.preconditions}`,
      "",
      "**Các bước:**",
      "",
    );
    testCase.steps.forEach((step, index) => {
      markdown.push(`${index + 1}. ${step.action}`, `   - Expected: ${step.expected}`);
    });
    if (testCase.parameters.length > 0) {
      markdown.push("", `**Instances:** ${testCase.parameters.map((parameter) => `\`${testCase.id}[${parameter.id}]\``).join(", ")}`);
    }
    markdown.push("", `**Cleanup:** ${testCase.cleanup}`, "");
  }
}

const csvColumns = [
  "instanceId",
  "baseId",
  "group",
  "title",
  "priority",
  "requirementIds",
  "environments",
  "fixtureIds",
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
  requirementIds: instance.requirementIds,
  environments: instance.environments,
  fixtureIds: instance.fixtureIds,
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

const caseIdsByRequirement = new Map(requirementRegistry.requirements.map((requirement) => [requirement.id, []]));
for (const instance of instances) {
  for (const requirementId of instance.requirementIds) {
    if (!caseIdsByRequirement.has(requirementId)) caseIdsByRequirement.set(requirementId, []);
    caseIdsByRequirement.get(requirementId).push(instance.instanceId);
  }
}
const traceabilityColumns = ["requirementId", "area", "title", "source", "section", "risk", "owner", "testInstances"];
const traceabilityRows = requirementRegistry.requirements.map((requirement) => ({
  ...requirement,
  requirementId: requirement.id,
  testInstances: caseIdsByRequirement.get(requirement.id) ?? [],
}));

const resultTemplateColumns = [
  "instanceId",
  "priority",
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
  environment: instance.environments[0],
  status: "NOT_RUN",
  actualResult: "",
  evidenceIds: "",
  bugIds: "",
  runner: "",
  durationMinutes: "",
  notes: "",
}));

const outputs = new Map([
  [path.join(generatedDir, "Test-Catalog.md"), `${markdown.join("\n")}\n`],
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
