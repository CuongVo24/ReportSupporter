import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const ROOTS = ["src", "Design", "scripts"];
const ROOT_FILES = ["README.md", "package.json"];
const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".md", ".css"]);
const MOJIBAKE = /\uFFFD|\u00EF\u00BF\u00BD|\u00C3[\u00A1-\u00BF]|\u00C2\u00A7|\u00C4[\u2018\u0090]|\u00C6[\u00B0\u00A1]|\u00E1[\u00BB\u00BA][\u0080-\u00BF]|c\u00C5\u00A9/u;

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(path));
    else if (TEXT_EXTENSIONS.has(extname(entry.name))) files.push(path);
  }
  return files;
}

const files = [...ROOT_FILES];
for (const root of ROOTS) files.push(...await collect(root));

const failures = [];
for (const file of files) {
  const contents = await readFile(file, "utf8");
  contents.split(/\r?\n/u).forEach((line, index) => {
    if (MOJIBAKE.test(line)) failures.push(`${relative(process.cwd(), file)}:${index + 1}: ${line.trim()}`);
  });
}

if (failures.length > 0) {
  console.error("Encoding check failed. Suspected mojibake:");
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Encoding check passed (${files.length} text files).`);
}
