import { EditorState, Annotation, Compartment } from "@codemirror/state";
import type { ReportAsset } from "@/types";
import { EditorView, lineNumbers, highlightActiveLine, drawSelection, dropCursor, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { highlightSelectionMatches, search, searchKeymap } from "@codemirror/search";
import { markdown } from "@codemirror/lang-markdown";
import { tags as t } from "@lezer/highlight";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { createMarkdownShortcutKeymap } from "./editor-shortcuts";

export const markdownHighlightStyle = HighlightStyle.define([
  { tag: t.heading1, color: "var(--rs-color-primary)", fontWeight: "bold", fontSize: "1.3em" },
  { tag: t.heading2, color: "var(--rs-color-primary)", fontWeight: "bold", fontSize: "1.2em" },
  { tag: t.heading3, color: "var(--rs-color-primary)", fontWeight: "bold", fontSize: "1.1em" },
  { tag: t.heading, color: "var(--rs-color-primary)", fontWeight: "bold" },
  { tag: t.strong, color: "var(--rs-color-text)", fontWeight: "bold" },
  { tag: t.emphasis, color: "var(--rs-color-text)", fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.list, color: "var(--rs-color-primary)", fontWeight: "bold" },
  { tag: t.link, color: "var(--rs-color-primary)", textDecoration: "underline" },
  { tag: t.url, color: "var(--rs-color-text-muted)" },
  { tag: t.monospace, color: "var(--rs-color-text)", fontFamily: "var(--rs-font-family-mono)" },
  { tag: t.quote, color: "var(--rs-color-text-muted)", fontStyle: "italic" },
  { tag: t.comment, color: "var(--rs-color-text-muted)" },
  { tag: t.meta, color: "var(--rs-color-text-muted)" },
  { tag: t.keyword, color: "var(--rs-color-primary)" },
  { tag: t.processingInstruction, color: "var(--rs-color-text-muted)" },
]);

export const syncAnnotation = Annotation.define<boolean>();
export const ariaLabelCompartment = new Compartment();

/**
 * Creates an EditorState configured for Markdown editing.
 * Binds an update listener to sync editor content changes with the React state.
 */
export function createEditorState(opts: {
  doc: string;
  onChange: (v: string) => void;
  ariaLabel?: string;
  onSave?: (v: string) => void;
  onImageInserted?: (asset: ReportAsset, ref: string) => void;
  onImageError?: (message: string) => void;
}): EditorState {
  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged && !update.transactions.some((tr) => tr.annotation(syncAnnotation))) {
      opts.onChange(update.state.doc.toString());
    }
  });

  return EditorState.create({
    doc: opts.doc,
    extensions: [
      markdown(),
      // Wrap long lines (e.g. wide Markdown table rows) instead of forcing a
      // horizontal scrollbar, which was unusable in the narrow split editor.
      EditorView.lineWrapping,
      syntaxHighlighting(markdownHighlightStyle),
      history({ minDepth: 200 }),
      search({ top: true }),
      highlightSelectionMatches(),
      lineNumbers(),
      highlightActiveLine(),
      drawSelection(),
      dropCursor(),
      keymap.of([
        ...createMarkdownShortcutKeymap({ onSave: opts.onSave, onImageInserted: opts.onImageInserted, onImageError: opts.onImageError }),
        ...searchKeymap,
        ...historyKeymap,
        indentWithTab,
        ...defaultKeymap,
      ]),
      updateListener,
      ariaLabelCompartment.of(EditorView.contentAttributes.of({ "aria-label": opts.ariaLabel || "Editor" })),
      EditorView.theme({
        "&": {
          height: "100%",
          fontSize: "var(--rs-font-size-md)",
          outline: "none",
          border: "none",
        },
        ".cm-scroller": {
          fontFamily: "var(--rs-font-family-mono)",
          lineHeight: "1.6",
          overflow: "auto",
        },
        ".cm-content": {
          padding: "var(--rs-space-2) 0",
        },
        "&.cm-focused": {
          outline: "none",
        },
        ".cm-gutter": {
          backgroundColor: "transparent",
          borderRight: "none",
          color: "var(--rs-color-text-muted)",
        },
        ".cm-gutters": {
          backgroundColor: "transparent",
          borderRight: "none",
        },
        ".cm-activeLine": {
          backgroundColor: "var(--rs-color-editor-active-line)",
        },
        ".cm-activeLineGutter": {
          backgroundColor: "var(--rs-color-editor-active-line)",
          color: "var(--rs-color-text)",
          fontWeight: "normal",
        },
        ".cm-selectionBackground": {
          backgroundColor: "var(--rs-color-editor-selection) !important",
        },
        "&.cm-focused .cm-selectionBackground": {
          backgroundColor: "var(--rs-color-editor-selection) !important",
        },
        ".cm-gutterElement": {
          padding: "0 var(--rs-space-3)",
        },
      }),
    ],
  });
}
