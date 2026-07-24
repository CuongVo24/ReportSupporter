// W25-K (S4): adversarial directory-drop shapes for collectDroppedFiles. The
// file-count cap must trigger BEFORE the file() read side effect for the
// entry that would exceed it — otherwise a wide/deep drop could still force
// reading (and holding in memory) far more files than the cap implies.
import { describe, expect, it } from "vitest";
import { mulberry32, pickInt } from "@/test/fuzz-utils";
import { collectDroppedFiles } from "../directory-reader";

let readCount = 0;

function fakeFile(name: string): FileSystemFileEntry {
  return {
    isFile: true,
    isDirectory: false,
    name,
    file(success: (file: File) => void) {
      readCount += 1;
      success(new File(["x"], name));
    },
  } as unknown as FileSystemFileEntry;
}

function fakeDir(name: string, children: FileSystemEntry[]): FileSystemDirectoryEntry {
  return {
    isFile: false,
    isDirectory: true,
    name,
    createReader() {
      let delivered = false;
      return {
        readEntries(success: (entries: FileSystemEntry[]) => void) {
          // Simulate the real API: first call returns everything, second call
          // (which collectDroppedFiles always makes) returns empty to stop.
          if (delivered) {
            success([]);
          } else {
            delivered = true;
            success(children);
          }
        },
      };
    },
  } as unknown as FileSystemDirectoryEntry;
}

describe("collectDroppedFiles — cap ordering", () => {
  it("throws once the cap is reached and never reads a file beyond the cap", async () => {
    readCount = 0;
    const files = Array.from({ length: 10 }, (_, i) => fakeFile(`f${i}.txt`));

    await expect(collectDroppedFiles(files, 5)).rejects.toThrow(/tối đa 5 tệp/);
    expect(readCount).toBe(5); // exactly the 5 accepted files, not all 10
  });

  it("bounded fuzz: random nested directory shapes always stop reading at the cap", async () => {
    const rand = mulberry32(20260724);

    for (let trial = 0; trial < 15; trial++) {
      readCount = 0;
      const cap = pickInt(rand, 1, 20);
      let fileCounter = 0;

      function buildLevel(depth: number): FileSystemEntry[] {
        const count = pickInt(rand, 0, 4);
        const entries: FileSystemEntry[] = [];
        for (let i = 0; i < count; i++) {
          if (depth > 0 && rand() > 0.6) {
            entries.push(fakeDir(`d${depth}-${i}`, buildLevel(depth - 1)));
          } else {
            entries.push(fakeFile(`f${fileCounter++}.txt`));
          }
        }
        return entries;
      }

      const tree = buildLevel(3);
      const totalFiles = fileCounter;

      try {
        const result = await collectDroppedFiles(tree, cap);
        // No cap hit: every file in the tree was read exactly once.
        expect(result.length).toBeLessThanOrEqual(cap);
        expect(readCount).toBe(totalFiles);
      } catch (error) {
        // Cap hit: never more reads than the cap allows.
        expect(error).toBeInstanceOf(Error);
        expect(readCount).toBeLessThanOrEqual(cap);
      }
    }
  });
});
