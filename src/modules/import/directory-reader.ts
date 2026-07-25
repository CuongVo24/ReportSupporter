import { IMPORT_LIMITS } from "./resource-policy";

export const MAX_DROPPED_FILES = IMPORT_LIMITS.MAX_DROPPED_FILES;

type DirectoryReader = Pick<FileSystemDirectoryReader, "readEntries">;

export function readAllDirectoryEntries(reader: DirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const entries: FileSystemEntry[] = [];

    const readNextBatch = () => {
      reader.readEntries(
        (batch) => {
          if (batch.length === 0) {
            resolve(entries);
            return;
          }
          entries.push(...batch);
          readNextBatch();
        },
        (error) => reject(error),
      );
    };

    readNextBatch();
  });
}

function readFileEntry(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject));
}

export async function collectDroppedFiles(
  entries: readonly FileSystemEntry[],
  maxFiles = MAX_DROPPED_FILES,
  maxTotalBytes = IMPORT_LIMITS.MAX_DROPPED_TOTAL_BYTES,
): Promise<File[]> {
  const files: File[] = [];
  let totalBytes = 0;

  async function visit(entry: FileSystemEntry): Promise<void> {
    if (entry.isFile) {
      if (files.length >= maxFiles) {
        throw new Error(`Chỉ có thể nhập tối đa ${maxFiles} tệp mỗi lần.`);
      }
      const file = await readFileEntry(entry as FileSystemFileEntry);
      // File.size is metadata the OS/browser already knows — cheap to check
      // before any file content is read, unlike a per-converter byte cap
      // which only fires once that single file is later processed.
      totalBytes += file.size;
      if (totalBytes > maxTotalBytes) {
        throw new Error(
          `Tổng dung lượng các tệp vượt quá giới hạn ${Math.round(maxTotalBytes / 1024 / 1024)}MB mỗi lần nhập.`,
        );
      }
      files.push(file);
      return;
    }

    if (entry.isDirectory) {
      const children = await readAllDirectoryEntries(
        (entry as FileSystemDirectoryEntry).createReader(),
      );
      for (const child of children) {
        await visit(child);
      }
    }
  }

  for (const entry of entries) {
    await visit(entry);
  }
  return files;
}
