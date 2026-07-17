import { describe, expect, it } from "vitest";
import { collectDroppedFiles, readAllDirectoryEntries } from "./directory-reader";

function fileEntry(name: string): FileSystemFileEntry {
  const file = new File([name], name, { type: "text/plain" });
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
});
