import { describe, expect, it } from "vitest";
import { collectDroppedFiles, readAllDirectoryEntries } from "./directory-reader";

function fileEntry(name: string, content: BlobPart = name): FileSystemFileEntry {
  const file = new File([content], name, { type: "text/plain" });
  return {
    isFile: true,
    isDirectory: false,
    name,
    fullPath: `/${name}`,
    filesystem: {} as FileSystem,
    file: (success: (file: File) => void) => success(file),
    getParent: () => undefined,
  } as unknown as FileSystemFileEntry;
}

describe("directory reader", () => {
  it("keeps calling readEntries until the browser returns an empty batch", async () => {
    const batches: FileSystemEntry[][] = [[fileEntry("a.md")], [fileEntry("b.md")], []];
    const reader = {
      readEntries(success: FileSystemEntriesCallback) {
        success(batches.shift() ?? []);
      },
    } as Pick<FileSystemDirectoryReader, "readEntries">;

    const entries = await readAllDirectoryEntries(reader);
    expect(entries.map((entry) => entry.name)).toEqual(["a.md", "b.md"]);
  });

  it("enforces the total file cap while traversing", async () => {
    await expect(collectDroppedFiles([fileEntry("a.md"), fileEntry("b.md")], 1)).rejects.toThrow("1");
  });

  it("enforces an aggregate byte cap across all dropped files, not just per-file size", async () => {
    const big = new Uint8Array(600);
    const entries = [fileEntry("a.bin", big), fileEntry("b.bin", big)];
    // Each file is 600 bytes; cap the total at 1000 bytes so only the first fits.
    await expect(collectDroppedFiles(entries, 500, 1000)).rejects.toThrow("dung lượng");
  });

  it("allows files within both the count and aggregate byte caps", async () => {
    const small = new Uint8Array(100);
    const entries = [fileEntry("a.bin", small), fileEntry("b.bin", small)];
    const files = await collectDroppedFiles(entries, 500, 1000);
    expect(files).toHaveLength(2);
  });
});
