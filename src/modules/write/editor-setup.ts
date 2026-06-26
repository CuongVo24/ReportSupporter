import { EditorState } from "@codemirror/state";
import { EditorView, lineNumbers, highlightActiveLine, drawSelection, dropCursor } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";

/**
 * Creates an EditorState configured for Markdown editing.
 * Binds an update listener to sync editor content changes with the React state.
 */
export function createEditorState(opts: { doc: string; onChange: (v: string) => void; ariaLabel?: string }): EditorState {
  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      opts.onChange(update.state.doc.toString());
    }
  });

  return EditorState.create({
    doc: opts.doc,
    extensions: [
      markdown(),
      lineNumbers(),
      highlightActiveLine(),
      drawSelection(),
      dropCursor(),
      updateListener,
      EditorView.contentAttributes.of({ "aria-label": opts.ariaLabel || "Editor" }),
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
          backgroundColor: "var(--rs-color-surface-muted)",
        },
        ".cm-activeLineGutter": {
          backgroundColor: "var(--rs-color-surface-muted)",
          color: "var(--rs-color-text)",
        },
        ".cm-gutterElement": {
          padding: "0 var(--rs-space-3)",
        },
      }),
    ],
  });
}
