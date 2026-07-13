"use client";

import { useEffect, useRef, useState } from "react";
import { Table, Code2, Sigma, GitBranch, Quote, Image as ImageIcon } from "lucide-react";
import { EditorView } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { createEditorState, insertSnippet, createImageAsset, isMarkdownFile, readMarkdownFile, syncAnnotation, ariaLabelCompartment } from "@/modules/write";
import type { WritingStats } from "@/modules/write";
import type { SnippetKind, ReportAsset } from "@/types";

type EditorPanelProps = {
  value: string;
  onChange: (value: string) => void;
  onSave?: (value: string) => void;
  ariaLabel?: string;
  onImageInserted?: (asset: ReportAsset, ref: string) => void;
  sectionStats?: WritingStats;
  reportStats?: WritingStats;
  focusMode?: boolean;
};

export function EditorPanel({
  value,
  onChange,
  onSave,
  ariaLabel = "Markdown editor",
  onImageInserted,
  sectionStats,
  reportStats,
  focusMode = false,
}: EditorPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [fileError, setFileError] = useState("");

  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);

  // Keep refs updated with latest callbacks
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // Sync external value modifications (like switching sections) with the editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentDoc = view.state.doc.toString();
    if (value !== currentDoc) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
        annotations: syncAnnotation.of(true),
      });
    }
  }, [value]);

  // Initialize CodeMirror editor view
  useEffect(() => {
    if (!containerRef.current) return;

    const state = createEditorState({
      doc: value,
      onChange: (v) => {
        onChangeRef.current(v);
      },
      onSave: (v) => {
        onSaveRef.current?.(v);
      },
      ariaLabel,
      onImageInserted: (asset, ref) => {
        if (onImageInserted) onImageInserted(asset, ref);
      },
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

  // Update aria-label dynamically without recreating editor state/view
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: ariaLabelCompartment.reconfigure(
        EditorView.contentAttributes.of({ "aria-label": ariaLabel })
      ),
    });
  }, [ariaLabel]);

  const handleInsert = (kind: SnippetKind) => {
    const view = viewRef.current;
    if (!view) return;

    if (kind === "image") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const result = await createImageAsset(file, 5 * 1024 * 1024); // max size 5MB
        if (result.ok) {
          const { from, to } = view.state.selection.main;
          view.dispatch({
            changes: { from, to, insert: result.ref },
            selection: { anchor: from + result.ref.length },
          });
          view.focus();
          if (onImageInserted) {
            onImageInserted(result.asset, result.ref);
          }
        } else {
          alert(result.error);
        }
      };
      input.click();
      return;
    }

    const { from, to } = view.state.selection.main;
    const doc = view.state.doc.toString();
    
    let blockEndPos: number | undefined;
    try {
      const tree = syntaxTree(view.state);
       let node: ReturnType<typeof tree.resolveInner> = tree.resolveInner(from, -1);
      while (node) {
        if (node.name === "FencedCode" || node.name === "CodeBlock" || node.name === "Table") {
          blockEndPos = node.to;
          break;
        }
        node = node.parent;
      }
    } catch {}

    const result = insertSnippet(doc, from, to, kind, blockEndPos);
    
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
        <button type="button" onClick={() => handleInsert("table")} className="ws-editor-toolbar-btn" title="Chèn bảng (Ctrl+Shift+T)" aria-keyshortcuts="Control+Shift+T">
          <Table size={14} aria-hidden="true" />
          <span>Bảng</span>
        </button>
        <button type="button" onClick={() => handleInsert("code")} className="ws-editor-toolbar-btn" title="Chèn khối code (Ctrl+Shift+C)" aria-keyshortcuts="Control+Shift+C">
          <Code2 size={14} aria-hidden="true" />
          <span>Code</span>
        </button>
        <button type="button" onClick={() => handleInsert("math")} className="ws-editor-toolbar-btn" title="Chèn công thức (Ctrl+Shift+M)" aria-keyshortcuts="Control+Shift+M">
          <Sigma size={14} aria-hidden="true" />
          <span>Công thức</span>
        </button>
        <button type="button" onClick={() => handleInsert("mermaid")} className="ws-editor-toolbar-btn" title="Chèn sơ đồ Mermaid">
          <GitBranch size={14} aria-hidden="true" />
          <span>Mermaid</span>
        </button>
        <button type="button" onClick={() => handleInsert("callout")} className="ws-editor-toolbar-btn" title="Chèn chú thích (Ctrl+Shift+Q)" aria-keyshortcuts="Control+Shift+Q">
          <Quote size={14} aria-hidden="true" />
          <span>Chú thích</span>
        </button>
        <button type="button" onClick={() => handleInsert("image")} className="ws-editor-toolbar-btn" title="Chèn ảnh (Ctrl+Shift+I)" aria-keyshortcuts="Control+Shift+I">
          <ImageIcon size={14} aria-hidden="true" />
          <span>Ảnh</span>
        </button>
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

      {(sectionStats || reportStats) && (
        <div className="ws-editor-statusbar" aria-live="polite">
          {sectionStats && (
            <span>
              Mục: {sectionStats.words} chữ · {sectionStats.readingMinutes} phút đọc
            </span>
          )}
          {reportStats && (
            <span>
              Báo cáo: {reportStats.words} chữ · {reportStats.readingMinutes} phút đọc
            </span>
          )}
          {focusMode && <span className="ws-editor-statusbar-focus">Focus</span>}
        </div>
      )}
    </div>
  );
}

