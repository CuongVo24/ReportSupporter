import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const manifestPath = path.join(process.cwd(), ".next", "app-build-manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

async function routeBytes(routeKey) {
  const chunks = new Set();
  for (const [route, files] of Object.entries(manifest.pages ?? {})) {
    if (route === routeKey) {
      for (const file of files) chunks.add(file);
    }
  }
  let bytes = 0;
  for (const file of chunks) {
    if (!file.endsWith(".js")) continue;
    const absolutePath = path.join(process.cwd(), ".next", file);
    await stat(absolutePath);
    bytes += gzipSync(await readFile(absolutePath)).byteLength;
  }
  return bytes;
}

const budgets = [
  { name: "Project Library", route: "/page", max: 200 * 1024 },
  { name: "Workspace", route: "/workspace/[projectId]/page", max: 450 * 1024 },
];

let failed = false;
for (const budget of budgets) {
  const bytes = await routeBytes(budget.route);
  if (bytes === 0) throw new Error(`Không tìm thấy chunk cho ${budget.name}.`);
  console.log(`${budget.name}: ${(bytes / 1024).toFixed(1)} KiB / ${(budget.max / 1024).toFixed(0)} KiB`);
  if (bytes > budget.max) failed = true;
}

if (failed) process.exitCode = 1;
