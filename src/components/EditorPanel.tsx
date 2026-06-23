"use client";

import { useEffect, useRef } from "react";
import { EditorView } from "@codemirror/view";
import { createEditorState, insertSnippet } from "@/modules/write";
import type { SnippetKind } from "@/types";

type EditorPanelProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
};

export function EditorPanel({ value, onChange, ariaLabel = "Markdown editor" }: EditorPanelProps) {
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

  return (
    <div 
      className="ws-editor-container" 
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
