import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      // Exclude src/modules/import/
      if (fullPath.includes(path.join("src", "modules", "import"))) {
        return;
      }
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (/\.(tsx?|jsx?)$/.test(file)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

describe("Module boundary checks", () => {
  it("should not import rehype-remark, remark-stringify, or mammoth outside src/modules/import/", () => {
    const srcDir = path.resolve(process.cwd(), "src");
    const files = getAllFiles(srcDir);

    const forbiddenImports = ["rehype-remark", "remark-stringify", "mammoth", "pdfjs-dist"];
    const violations: { file: string; match: string }[] = [];

    files.forEach((filePath) => {
      const content = fs.readFileSync(filePath, "utf-8");
      forbiddenImports.forEach((lib) => {
        // Regex to match imports: from "lib" or require("lib") or import("lib")
        const regex = new RegExp(`from\\s+['"]${lib}['"]|require\\(['"]${lib}['"]\\)|import\\(['"]${lib}['"]\\)`, "g");
        if (regex.test(content)) {
          violations.push({ file: path.relative(process.cwd(), filePath), match: lib });
        }
      });
    });

    expect(violations).toEqual([]);
  });
});
