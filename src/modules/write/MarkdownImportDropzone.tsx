"use client";

import React, { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileUp } from "lucide-react";
import { Button } from "@/components/ui";
import {
  buildMarkdownImportDraft,
  isMarkdownFileName,
  type MarkdownImportDraft,
} from "./markdown-import";

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

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!isMarkdownFileName(file.name)) {
      setError("Chỉ nhận file Markdown .md hoặc .markdown.");
      return;
    }

    const markdown = await file.text();
    if (!markdown.trim()) {
      setError("File Markdown đang trống.");
      return;
    }

    const draft = buildMarkdownImportDraft(file.name, markdown);
    setError("");
    onImported(draft);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void handleFile(event.dataTransfer.files[0]);
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
        accept=".md,.markdown,.mdown,.mkd,text/markdown,text/plain"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div className="ws-md-import-body">
        <div className="ws-md-import-icon" aria-hidden="true">
          <FileUp size={20} strokeWidth={1.8} />
        </div>
        <div className="ws-md-import-copy">
          <h3 className="ws-md-import-title">Nhập nhanh từ Markdown</h3>
          <p className="ws-md-import-subtitle">Thả file .md vào đây hoặc chọn file từ máy.</p>
        </div>
      </div>

      <Button
        type="button"
        variant={imported ? "secondary" : "primary"}
        size="sm"
        onClick={() => inputRef.current?.click()}
        leadingIcon={<FileUp size={14} />}
      >
        {imported ? "Đổi file" : "Chọn file .md"}
      </Button>

      {imported && (
        <div className="ws-md-import-status" role="status">
          <CheckCircle2 size={14} aria-hidden="true" />
          <span className="ws-md-import-file">{imported.fileName}</span>
          <span className="ws-md-import-count">{imported.sectionCount} mục</span>
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
