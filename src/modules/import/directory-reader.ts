export const MAX_DROPPED_FILES = 500;

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
): Promise<File[]> {
  const files: File[] = [];

  async function visit(entry: FileSystemEntry): Promise<void> {
    if (entry.isFile) {
      if (files.length >= maxFiles) {
        throw new Error(`Chá»‰ cÃ³ thá»ƒ nháº­p tá»‘i Ä‘a ${maxFiles} tá»‡p má»—i láº§n.`);
      }
      files.push(await readFileEntry(entry as FileSystemFileEntry));
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
