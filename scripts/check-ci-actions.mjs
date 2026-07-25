// W25-L: static checker for GitHub Actions supply-chain hygiene.
// Fails the build if any `uses:` reference in .github/workflows/*.yml is a
// mutable tag/branch instead of a full 40-hex-char commit SHA, and warns
// (non-fatal) if a workflow has no explicit top-level `permissions:` block —
// GitHub's implicit default grants broad `write` scopes.
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const WORKFLOWS_DIR = path.join(ROOT_DIR, ".github", "workflows");
const FULL_SHA = /^[0-9a-f]{40}$/u;

function log(msg) {
  console.log(`[ci-actions] ${msg}`);
}
function error(msg) {
  console.error(`[ci-actions ERROR] ${msg}`);
}

function listWorkflowFiles() {
  if (!fs.existsSync(WORKFLOWS_DIR)) return [];
  return fs
    .readdirSync(WORKFLOWS_DIR)
    .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
    .map((name) => path.join(WORKFLOWS_DIR, name));
}

function checkWorkflow(filePath) {
  const relPath = path.relative(ROOT_DIR, filePath);
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/u);
  let hasErrors = false;
  let hasTopLevelPermissions = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lineNo = i + 1;

    if (/^permissions:\s*$/u.test(line) || /^permissions:\s*\S/u.test(line)) {
      // Only counts as "top-level" when at column 0 (not nested under a job).
      if (!/^\s/u.test(line)) hasTopLevelPermissions = true;
    }

    const usesMatch = /^\s*(?:-\s*)?uses:\s*([^\s#]+)/u.exec(line);
    if (!usesMatch) continue;
    const ref = usesMatch[1];

    // Local/relative actions (`./`) and docker://-scheme actions are exempt —
    // they resolve from the checked-out commit itself, not a mutable remote ref.
    if (ref.startsWith("./") || ref.startsWith("docker://")) continue;

    const at = ref.lastIndexOf("@");
    if (at === -1) {
      error(`${relPath}:${lineNo}: 'uses: ${ref}' has no @ref — cannot verify pin.`);
      hasErrors = true;
      continue;
    }
    const version = ref.slice(at + 1);
    if (!FULL_SHA.test(version)) {
      error(
        `${relPath}:${lineNo}: 'uses: ${ref}' is pinned to '${version}', not a full 40-char commit SHA. ` +
          `A tag/branch can be moved by the action owner (supply-chain risk). Pin to the commit SHA and keep the version as a trailing comment.`,
      );
      hasErrors = true;
    }
  }

  if (!hasTopLevelPermissions) {
    log(`WARNING: ${relPath} has no explicit top-level 'permissions:' block — GitHub's implicit default grants broad write scopes.`);
  }

  return hasErrors;
}

function main() {
  const files = listWorkflowFiles();
  if (files.length === 0) {
    log("No workflow files found under .github/workflows — nothing to check.");
    return;
  }

  let hasErrors = false;
  for (const file of files) {
    if (checkWorkflow(file)) hasErrors = true;
  }

  if (hasErrors) {
    error("One or more GitHub Actions are not pinned to a full commit SHA.");
    process.exit(1);
  }
  log(`All ${files.length} workflow file(s) use full-commit-SHA-pinned actions.`);
}

main();
