"use client";

import React, { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileUp } from "lucide-react";
import { Button } from "@/components/ui";
import {
  readMarkdownFile,
  isMarkdownFile,
  buildMarkdownImportDraft,
  type MarkdownImportDraft,
} from "./markdown-import";
import {
  unzipFiles,
  ingestAssetsAndEvidence,
} from "./import-assets";

type MarkdownImportDropzoneProps = {
  imported: MarkdownImportDraft | null;
  onImported: (draft: MarkdownImportDraft) => void;
};

export function MarkdownImportDropzone({
  imported,
  onImported,
}: MarkdownImportDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  const processFiles = async (fileList: File[]) => {
    if (fileList.length === 0) return;

    let allFiles: File[] = [];
    
    // Check if there is a zip file
    const zipFile = fileList.find(
      (f) => f.name.toLowerCase().endsWith(".zip") || f.type === "application/zip"
    );

    if (zipFile) {
      try {
        const unzipped = await unzipFiles(zipFile);
        allFiles = [...allFiles, ...unzipped];
      } catch (err) {
        setError("Không thể giải nén tệp zip: " + (err as Error).message);
        return;
      }
    } else {
      allFiles = [...fileList];
    }

    // Find primary markdown file
    const mdFile = allFiles.find((f) => isMarkdownFile(f));
    if (!mdFile) {
      setError("Không tìm thấy tệp Markdown (.md) nào trong danh sách tải lên.");
      return;
    }

    // Read the markdown source
    const readResult = await readMarkdownFile(mdFile);
    if (!readResult.ok) {
      setError(readResult.error);
      return;
    }

    const otherFiles = allFiles.filter((f) => f !== mdFile);
    
    try {
      const ingestResult = await ingestAssetsAndEvidence(readResult.markdown, otherFiles);
      
      setError("");
      
      // Construct import draft
      const finalDraft = buildMarkdownImportDraft(
        mdFile.name,
        ingestResult.markdown,
        ingestResult.assets,
        ingestResult.evidence,
        ingestResult.summary
      );
      
      onImported(finalDraft);
    } catch (err) {
      setError("Có lỗi xảy ra trong quá trình xử lý ảnh: " + (err as Error).message);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    const items = event.dataTransfer.items;
    if (!items) {
      void processFiles(Array.from(event.dataTransfer.files));
      return;
    }

    // Resolve directory structures recursively using webkitGetAsEntry
    const entries: FileSystemEntry[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          entries.push(entry);
        }
      }
    }

    const readEntry = (entry: FileSystemEntry): Promise<File[]> => {
      return new Promise((resolve) => {
        if (entry.isFile) {
          (entry as FileSystemFileEntry).file(
            (file) => resolve([file]),
            () => resolve([])
          );
        } else if (entry.isDirectory) {
          const dirReader = (entry as FileSystemDirectoryEntry).createReader();
          const readAllEntries = () => {
            dirReader.readEntries(
              async (subEntries) => {
                if (subEntries.length === 0) {
                  resolve([]);
                } else {
                  const results = await Promise.all(subEntries.map(readEntry));
                  resolve(results.flat());
                }
              },
              () => resolve([])
            );
          };
          readAllEntries();
        } else {
          resolve([]);
        }
      });
    };

    try {
      const allResults = await Promise.all(entries.map(readEntry));
      const flatFiles = allResults.flat();
      void processFiles(flatFiles);
    } catch (err) {
      setError("Lỗi khi đọc danh sách kéo thả: " + (err as Error).message);
    }
  };

  return (
    <section
      className={`ws-md-import ${isDragging ? "ws-md-import-dragging" : ""}`}
      aria-label="Nhập file Markdown"
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        className="ws-visually-hidden"
        type="file"
        multiple
        accept=".md,.markdown,text/markdown,text/x-markdown,.zip,image/*"
        onChange={(event) => {
          if (event.target.files) {
            void processFiles(Array.from(event.target.files));
          }
          event.target.value = "";
        }}
      />

      <div className="ws-md-import-body">
        <div className="ws-md-import-icon" aria-hidden="true">
          <FileUp size={20} strokeWidth={1.8} />
        </div>
        <div className="ws-md-import-copy">
          <h3 className="ws-md-import-title">Nhập từ Markdown kèm ảnh</h3>
          <p className="ws-md-import-subtitle">
            Kéo thả file `.md` cùng các thư mục/tệp ảnh, file `.zip` chứa cả hai, hoặc chọn file từ máy.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
        <Button
          type="button"
          variant={imported ? "secondary" : "primary"}
          size="sm"
          onClick={() => inputRef.current?.click()}
          leadingIcon={<FileUp size={14} />}
        >
          {imported ? "Đổi tệp" : "Chọn tệp"}
        </Button>
      </div>

      {imported && (
        <div className="ws-md-import-status-container">
          <div className="ws-md-import-status" role="status">
            <CheckCircle2 size={14} aria-hidden="true" />
            <span className="ws-md-import-file">{imported.fileName}</span>
            <span className="ws-md-import-count">{imported.sectionCount} mục</span>
          </div>

          {imported.summary && (
            <div className="ws-md-import-summary">
              <h4 className="ws-md-summary-title">Tóm tắt nhúng ảnh & minh chứng:</h4>
              <div className="ws-md-summary-content">
                <p className="ws-md-summary-success">
                  ✓ Nhúng thành công <strong>{imported.summary.embeddedCount}</strong> / <strong>{imported.summary.totalScanned}</strong> ảnh cục bộ.
                </p>
                
                {imported.summary.missingCount > 0 && (
                  <div className="ws-md-summary-section ws-md-summary-missing">
                    <p className="ws-md-summary-warning-label">
                      ⚠ Thiếu {imported.summary.missingCount} tệp ảnh (đã giữ lại đường dẫn tương đối để nhúng sau):
                    </p>
                    <ul className="ws-md-summary-list">
                      {imported.summary.missingList.map((path, idx) => (
                        <li key={idx} className="ws-md-summary-item-code">{path}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {imported.summary.warnings.length > 0 && (
                  <div className="ws-md-summary-section ws-md-summary-warnings">
                    <p className="ws-md-summary-danger-label">Cảnh báo:</p>
                    <ul className="ws-md-summary-list">
                      {imported.summary.warnings.map((warn, idx) => (
                        <li key={idx} className="ws-md-summary-item-warn">{warn}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="ws-md-import-error" role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </section>
  );
}
