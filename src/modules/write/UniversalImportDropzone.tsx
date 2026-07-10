"use client";

import React, { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import {
  buildMarkdownImportDraft,
} from "./markdown-import";
import {
  unzipFiles,
  ingestAssetsAndEvidence,
} from "./import-assets";
import {
  convertImportFile,
  resolveConverter,
  getSupportedExtensions,
  getSupportedFormats,
} from "@/modules/import";
import type { ImportDraft } from "@/types";

type UniversalImportDropzoneProps = {
  imported: ImportDraft[];
  onImported: (drafts: ImportDraft[]) => void;
};

type FileProgress = {
  id: string;
  name: string;
  status: "processing" | "success" | "error";
  percent?: number;
  stage?: string;
  error?: string;
  draft?: ImportDraft;
  abortController?: AbortController;
};

export function UniversalImportDropzone({
  imported,
  onImported,
}: UniversalImportDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [batchFiles, setBatchFiles] = useState<FileProgress[]>([]);
  const [announcement, setAnnouncement] = useState("");

  // Dynamically build accept extensions list from registered converters
  const acceptExtensions = getSupportedExtensions();
  const acceptString = [
    ...acceptExtensions,
    ".zip",
    "image/*",
  ].join(",");

  const processFiles = async (fileList: File[]) => {
    if (fileList.length === 0) return;
    setAnnouncement("Bắt đầu xử lý danh sách tệp tin...");

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

    // Partition files: primary documents vs other asset files
    const docFiles = allFiles.filter((f) => resolveConverter(f) !== null);
    if (docFiles.length === 0) {
      const supportedFormats = getSupportedFormats().join(", ");
      setError(`Không tìm thấy tài liệu hợp lệ nào. Hỗ trợ các định dạng: ${supportedFormats}`);
      setBatchFiles([]);
      return;
    }

    const otherFiles = allFiles.filter((f) => resolveConverter(f) === null);
    setError("");

    // Initialize progress state for each document
    const initialProgress: FileProgress[] = docFiles.map((f) => {
      const abortController = new AbortController();
      return {
        id: crypto.randomUUID(),
        name: f.name,
        status: "processing",
        percent: 0,
        stage: "Chuẩn bị...",
        abortController,
      };
    });
    setBatchFiles(initialProgress);

    const promises = docFiles.map(async (docFile, index) => {
      const progressItem = initialProgress[index];
      const abortSignal = progressItem.abortController?.signal;

      try {
        // 1. Run Registry-based file conversion (includes maxBytes size gate check)
        const result = await convertImportFile(
          docFile,
          (percent, stage) => {
            setBatchFiles((prev) =>
              prev.map((p) =>
                p.id === progressItem.id
                  ? {
                      ...p,
                      percent,
                      stage: stage || p.stage,
                    }
                  : p
              )
            );
          },
          abortSignal
        );

        // 2. Ingest assets/evidence into the markdown content
        const ingestResult = await ingestAssetsAndEvidence(result.markdown, otherFiles);

        // 3. Construct the draft
        const finalDraft = await buildMarkdownImportDraft(
          docFile.name,
          ingestResult.markdown,
          ingestResult.assets,
          ingestResult.evidence,
          ingestResult.summary,
          result.sourceFormat
        );

        finalDraft.file = docFile;
        setBatchFiles((prev) =>
          prev.map((p) =>
            p.id === progressItem.id
              ? {
                  ...p,
                  status: "success",
                  draft: finalDraft,
                }
              : p
          )
        );

        setAnnouncement(`Xử lý tệp ${docFile.name} thành công.`);
        return finalDraft;
      } catch (err: unknown) {
        const error = err as Error;
        if (error.message === "Import cancelled") {
          // If cancelled, remove from batchFiles list
          setBatchFiles((prev) => prev.filter((p) => p.id !== progressItem.id));
          throw error;
        }

        const errMsg = error.message || "Có lỗi xảy ra trong quá trình xử lý.";
        setBatchFiles((prev) =>
          prev.map((p) =>
            p.id === progressItem.id
              ? {
                  ...p,
                  status: "error",
                  error: errMsg,
                }
              : p
          )
        );
        setAnnouncement(`Lỗi khi xử lý tệp ${docFile.name}: ${errMsg}`);
        throw err;
      }
    });

    const results = await Promise.allSettled(promises);
    const successful = results.filter(
      (r): r is PromiseFulfilledResult<ImportDraft> => r.status === "fulfilled"
    );

    if (successful.length > 0) {
      // Pass all successfully converted document drafts to parent component
      onImported(successful.map((s) => s.value));
    } else {
      const rejected = results.filter(
        (r): r is PromiseRejectedResult => r.status === "rejected"
      );
      if (rejected.length > 0) {
        setError(rejected[0].reason.message || "Không có tệp nào được nhập thành công.");
      }
    }
  };

  const handleCancelFile = (fileId: string) => {
    const fileProgress = batchFiles.find((f) => f.id === fileId);
    if (fileProgress && fileProgress.abortController) {
      fileProgress.abortController.abort();
    }
    setBatchFiles((prev) => prev.filter((f) => f.id !== fileId));
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
      aria-label="Nhập file tài liệu"
      aria-busy={batchFiles.some((f) => f.status === "processing")}
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
        aria-label="Chọn tệp tin để nhập"
        multiple
        accept={acceptString}
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
          <h3 className="ws-md-import-title">Nhập tài liệu kèm ảnh</h3>
          <p className="ws-md-import-subtitle">
            Kéo thả tệp văn bản cùng thư mục ảnh, tệp `.zip` chứa cả hai, hoặc chọn từ thiết bị của bạn.
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
          {imported.length > 0 ? "Chọn tệp khác" : "Chọn tệp"}
        </Button>
      </div>

      {batchFiles.length > 0 && (
        <div className="ws-md-import-status-container" style={{ marginTop: "var(--rs-space-4)", display: "flex", flexDirection: "column", gap: "var(--rs-space-3)" }}>
          <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--rs-color-text-muted)" }}>
            Trạng thái xử lý danh sách tệp:
          </h4>
          
          {batchFiles.map((file) => (
            <div key={file.id} style={{ display: "flex", flexDirection: "column", gap: "var(--rs-space-2)", padding: "var(--rs-space-3)", borderRadius: "6px", border: "1px solid var(--rs-color-border)", backgroundColor: "var(--rs-color-surface-muted)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--rs-space-2)", fontSize: "13px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--rs-space-2)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", flex: 1 }}>
                  {file.status === "processing" && (
                    <Loader2 className="animate-spin" size={14} style={{ color: "var(--rs-color-primary)" }} aria-label="Đang xử lý" role="status" />
                  )}
                  {file.status === "success" && (
                    <CheckCircle2 size={14} style={{ color: "var(--rs-color-success, #10b981)" }} />
                  )}
                  {file.status === "error" && (
                    <AlertCircle size={14} style={{ color: "var(--rs-color-severity-error, #ef4444)" }} />
                  )}
                  <strong style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {file.name}
                  </strong>
                  {file.status === "success" && file.draft && (
                    <span style={{ fontSize: "11px", color: "var(--rs-color-text-muted)" }}>
                      ({file.draft.sections.length} mục)
                    </span>
                  )}
                </div>

                {file.status === "processing" && (
                  <button
                    type="button"
                    onClick={() => handleCancelFile(file.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--rs-color-severity-error)",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: 600
                    }}
                  >
                    Hủy
                  </button>
                )}
              </div>

              {file.status === "processing" && (
                <div style={{ paddingLeft: "22px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ fontSize: "11px", color: "var(--rs-color-text-muted)" }}>
                    {file.stage} {file.percent !== undefined ? `(${file.percent}%)` : ""}
                  </div>
                  <div style={{ height: "4px", width: "100%", backgroundColor: "var(--rs-color-border)", borderRadius: "2px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${file.percent || 0}%`,
                        backgroundColor: "var(--rs-color-primary)",
                        transition: "width 0.2s ease"
                      }}
                    />
                  </div>
                </div>
              )}

              {file.status === "error" && (
                <div style={{ fontSize: "12px", color: "var(--rs-color-severity-error, #ef4444)", paddingLeft: "22px" }}>
                  {file.error}
                </div>
              )}

              {file.status === "success" && file.draft?.summary && (
                <div style={{ fontSize: "12px", paddingLeft: "22px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <p style={{ margin: 0, color: "var(--rs-color-success, #10b981)" }}>
                    ✓ Nhúng thành công <strong>{file.draft.summary.embeddedCount}</strong> / <strong>{file.draft.summary.totalScanned}</strong> ảnh.
                  </p>
                  
                  {file.draft.summary.missingCount > 0 && (
                    <div style={{ marginTop: "4px" }}>
                      <span style={{ color: "var(--rs-color-severity-warning, #f59e0b)" }}>
                        ⚠ Thiếu {file.draft.summary.missingCount} tệp ảnh (giữ nguyên đường dẫn tương đối):
                      </span>
                      <ul style={{ margin: "4px 0 0 0", paddingLeft: "16px", listStyleType: "circle", color: "var(--rs-color-text-muted)", fontFamily: "monospace", fontSize: "11px" }}>
                        {file.draft.summary.missingList.map((path, idx) => (
                          <li key={idx}>{path}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {file.draft.summary.warnings.length > 0 && (
                    <div style={{ marginTop: "4px" }}>
                      <span style={{ color: "var(--rs-color-severity-error, #ef4444)", fontWeight: 500 }}>Cảnh báo:</span>
                      <ul style={{ margin: "4px 0 0 0", paddingLeft: "16px", listStyleType: "circle", color: "var(--rs-color-text-muted)" }}>
                        {file.draft.summary.warnings.map((warn, idx) => (
                          <li key={idx}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="ws-md-import-error" role="alert" style={{ marginTop: "var(--rs-space-3)" }}>
          <AlertCircle size={14} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="ws-visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </section>
  );
}
