"use client";

import { useEffect, useRef, useState } from "react";
import { EditorView } from "@codemirror/view";
import { createEditorState, insertSnippet, createImageAsset, isMarkdownFile, readMarkdownFile } from "@/modules/write";
import type { SnippetKind, ReportAsset } from "@/types";

type EditorPanelProps = {
  value: string;
  onChange: (value: string) => void;
  onSave?: (value: string) => void;
  ariaLabel?: string;
  onImageInserted?: (asset: ReportAsset, ref: string) => void;
};

export function EditorPanel({
  value,
  onChange,
  onSave,
  ariaLabel = "Markdown editor",
  onImageInserted,
}: EditorPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [fileError, setFileError] = useState("");

  // Sync external value modifications (like switching sections) with the editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentDoc = view.state.doc.toString();
    if (value !== currentDoc) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
    }
  }, [value]);

  // Initialize CodeMirror editor view
  useEffect(() => {
    if (!containerRef.current) return;

    const state = createEditorState({
      doc: value,
      onChange,
      onSave,
      ariaLabel,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInsert = (kind: SnippetKind) => {
    const view = viewRef.current;
    if (!view) return;

    const { from, to } = view.state.selection.main;
    const doc = view.state.doc.toString();
    
    const result = insertSnippet(doc, from, to, kind);
    
    // Dispatch document change and select new cursor position
    view.dispatch({
      changes: { from: 0, to: doc.length, insert: result.text },
      selection: { anchor: result.cursor },
    });
    
    view.focus();
  };

  const insertTextAtSelection = (text: string) => {
    const view = viewRef.current;
    if (!view) return;

    const { from, to } = view.state.selection.main;
    view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
    });
    setFileError("");
    view.focus();
  };

  const insertTextAtDropPosition = (text: string, x: number, y: number) => {
    const view = viewRef.current;
    if (!view) return;

    const pos = view.posAtCoords({ x, y }) ?? view.state.selection.main.from;
    view.dispatch({
      changes: { from: pos, to: pos, insert: text },
      selection: { anchor: pos + text.length },
    });
    setFileError("");
    view.focus();
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    
    // 1. Prioritize image paste
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (imageItem && onImageInserted) {
      const file = imageItem.getAsFile();
      if (!file) return;

      e.preventDefault();
      const result = await createImageAsset(file, 5 * 1024 * 1024); // max size 5MB
      if (result.ok) {
        const view = viewRef.current;
        if (view) {
          const { from, to } = view.state.selection.main;
          view.dispatch({
            changes: { from, to, insert: result.ref },
            selection: { anchor: from + result.ref.length },
          });
          view.focus();
        }
        onImageInserted(result.asset, result.ref);
      } else {
        alert(result.error);
      }
      return;
    }

    // 2. Handle Markdown file paste
    const fileItem = items.find((item) => item.kind === "file");
    if (fileItem) {
      const file = fileItem.getAsFile();
      if (file && isMarkdownFile(file)) {
        e.preventDefault();
        const result = await readMarkdownFile(file);
        if (!result.ok) {
          setFileError(result.error);
          return;
        }
        insertTextAtSelection(result.markdown);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    const files = Array.from(e.dataTransfer.files);
    
    // 1. Keep the existing image drop path first when an image is present.
    const imageFile = files.find((file) => file.type.startsWith("image/"));
    if (imageFile && onImageInserted) {
      e.preventDefault();
      const result = await createImageAsset(imageFile, 5 * 1024 * 1024); // max size 5MB
      if (result.ok) {
        insertTextAtDropPosition(result.ref, e.clientX, e.clientY);
        onImageInserted(result.asset, result.ref);
      } else {
        alert(result.error);
      }
      return;
    }

    // 2. Handle Markdown file drop as plain section content.
    const mdFile = files.find((file) => isMarkdownFile(file));
    if (!mdFile) return;

    e.preventDefault();
    const result = await readMarkdownFile(mdFile);
    if (!result.ok) {
      setFileError(result.error);
      return;
    }

    insertTextAtSelection(result.markdown);
  };

  const handleDragOver = (e: React.DragEvent) => {
    const hasFiles = e.dataTransfer.types.includes("Files");
    if (hasFiles) {
      e.preventDefault();
    }
  };

  return (
    <div 
      className="ws-editor-container" 
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Minimal Formatting Toolbar */}
      <div className="ws-editor-toolbar">
        <button type="button" onClick={() => handleInsert("table")} className="ws-editor-toolbar-btn" title="Chèn bảng (Ctrl+Shift+T)" aria-keyshortcuts="Control+Shift+T">Bảng</button>
        <button type="button" onClick={() => handleInsert("code")} className="ws-editor-toolbar-btn" title="Chèn khối code (Ctrl+Shift+C)" aria-keyshortcuts="Control+Shift+C">Code</button>
        <button type="button" onClick={() => handleInsert("math")} className="ws-editor-toolbar-btn" title="Chèn công thức (Ctrl+Shift+M)" aria-keyshortcuts="Control+Shift+M">Công thức</button>
        <button type="button" onClick={() => handleInsert("mermaid")} className="ws-editor-toolbar-btn" title="Chèn sơ đồ Mermaid">Mermaid</button>
        <button type="button" onClick={() => handleInsert("callout")} className="ws-editor-toolbar-btn" title="Chèn chú thích (Ctrl+Shift+Q)" aria-keyshortcuts="Control+Shift+Q">Chú thích</button>
        <button type="button" onClick={() => handleInsert("image")} className="ws-editor-toolbar-btn" title="Chèn ảnh (Ctrl+Shift+I)" aria-keyshortcuts="Control+Shift+I">Ảnh</button>
      </div>

      {/* CodeMirror DOM Parent */}
      <div 
        ref={containerRef} 
        aria-label={ariaLabel} 
        className="ws-editor-cm-parent"
      />

      {fileError && (
        <div className="ws-editor-file-error" role="alert">
          {fileError}
        </div>
      )}
    </div>
  );
}

