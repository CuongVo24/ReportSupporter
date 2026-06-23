"use client";

import { useEffect, useRef } from "react";
import { EditorView } from "@codemirror/view";
import { createEditorState, insertSnippet, createImageAsset } from "@/modules/write";
import type { SnippetKind, ReportAsset } from "@/types";

type EditorPanelProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  onImageInserted?: (asset: ReportAsset, ref: string) => void;
};

export function EditorPanel({
  value,
  onChange,
  ariaLabel = "Markdown editor",
  onImageInserted,
}: EditorPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

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

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (!imageItem || !onImageInserted) return;

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
  };

  const handleDrop = async (e: React.DragEvent) => {
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((file) => file.type.startsWith("image/"));
    if (!imageFile || !onImageInserted) return;

    e.preventDefault();
    const result = await createImageAsset(imageFile, 5 * 1024 * 1024); // max size 5MB
    if (result.ok) {
      const view = viewRef.current;
      if (view) {
        const x = e.clientX;
        const y = e.clientY;
        const pos = view.posAtCoords({ x, y }) ?? view.state.selection.main.from;
        view.dispatch({
          changes: { from: pos, to: pos, insert: result.ref },
          selection: { anchor: pos + result.ref.length },
        });
        view.focus();
      }
      onImageInserted(result.asset, result.ref);
    } else {
      alert(result.error);
    }
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
      style={{ display: "flex", flexDirection: "column", height: "100%", border: "1px solid var(--rs-color-border)", borderRadius: "var(--rs-radius-md)", overflow: "hidden", background: "var(--rs-color-surface)" }}
    >
      {/* Minimal Formatting Toolbar */}
      <div 
        className="editor-toolbar"
        style={{
          display: "flex",
          gap: "var(--rs-space-2)",
          padding: "var(--rs-space-2)",
          background: "var(--rs-color-surface-muted)",
          borderBottom: "1px solid var(--rs-color-border)",
          overflowX: "auto"
        }}
      >
        <button type="button" onClick={() => handleInsert("table")} style={buttonStyle}>Bảng</button>
        <button type="button" onClick={() => handleInsert("code")} style={buttonStyle}>Code</button>
        <button type="button" onClick={() => handleInsert("math")} style={buttonStyle}>Công thức</button>
        <button type="button" onClick={() => handleInsert("mermaid")} style={buttonStyle}>Mermaid</button>
        <button type="button" onClick={() => handleInsert("callout")} style={buttonStyle}>Chú thích</button>
        <button type="button" onClick={() => handleInsert("image")} style={buttonStyle}>Ảnh</button>
      </div>

      {/* CodeMirror DOM Parent */}
      <div 
        ref={containerRef} 
        aria-label={ariaLabel} 
        style={{ flex: 1, minHeight: 0, overflow: "auto" }}
      />
    </div>
  );
}

const buttonStyle = {
  padding: "var(--rs-space-1) var(--rs-space-2)",
  fontSize: "var(--rs-font-size-xs)",
  fontWeight: "var(--rs-font-weight-medium)",
  color: "var(--rs-slate-700)",
  background: "var(--rs-color-surface)",
  border: "1px solid var(--rs-color-border)",
  borderRadius: "var(--rs-radius-sm)",
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
  transition: "all 0.15s ease",
};
