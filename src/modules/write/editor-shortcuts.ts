import { EditorSelection } from "@codemirror/state";
import type { Command, EditorView, KeyBinding } from "@codemirror/view";
import { openSearchPanel } from "@codemirror/search";
import { insertSnippet } from "./insert-snippet";
import type { SnippetKind } from "@/types";

export type MarkdownReplacementDraft = {
  text: string;
  selectionFrom: number;
  selectionTo: number;
};

export function buildWrappedMarkdownDraft(
  selectedText: string,
  prefix: string,
  suffix = prefix,
  placeholder = "text",
): MarkdownReplacementDraft {
  if (selectedText) {
    const isWrapped = selectedText.startsWith(prefix) && selectedText.endsWith(suffix);
    if (isWrapped) {
      const text = selectedText.slice(prefix.length, selectedText.length - suffix.length);
      return {
        text,
        selectionFrom: 0,
        selectionTo: text.length,
      };
    }

    return {
      text: `${prefix}${selectedText}${suffix}`,
      selectionFrom: prefix.length,
      selectionTo: prefix.length + selectedText.length,
    };
  }

  return {
    text: `${prefix}${placeholder}${suffix}`,
    selectionFrom: prefix.length,
    selectionTo: prefix.length + placeholder.length,
  };
}

export function buildLinkMarkdownDraft(selectedText: string): MarkdownReplacementDraft {
  const label = selectedText || "liên kết";
  const text = `[${label}](url)`;
  const urlStart = label.length + 3;

  return {
    text,
    selectionFrom: urlStart,
    selectionTo: urlStart + 3,
  };
}

export function buildImageMarkdownDraft(selectedText: string): MarkdownReplacementDraft {
  const alt = selectedText || "Mô tả ảnh";
  const target = "image:asset_id";
  const text = `![${alt}](${target})`;
  const targetStart = alt.length + 4;

  return {
    text,
    selectionFrom: targetStart,
    selectionTo: targetStart + target.length,
  };
}

function replaceSelectionWithDraft(
  view: EditorView,
  buildDraft: (selectedText: string) => MarkdownReplacementDraft,
): boolean {
  const transaction = view.state.changeByRange((range) => {
    const selectedText = view.state.sliceDoc(range.from, range.to);
    const draft = buildDraft(selectedText);

    return {
      changes: { from: range.from, to: range.to, insert: draft.text },
      range: EditorSelection.range(
        range.from + draft.selectionFrom,
        range.from + draft.selectionTo,
      ),
    };
  });

  view.dispatch(transaction);
  view.focus();
  return true;
}

function insertSnippetCommand(kind: SnippetKind): Command {
  return (view) => {
    const { from, to } = view.state.selection.main;
    const doc = view.state.doc.toString();
    const result = insertSnippet(doc, from, to, kind);

    view.dispatch({
      changes: { from: 0, to: doc.length, insert: result.text },
      selection: { anchor: result.cursor },
    });
    view.focus();
    return true;
  };
}

function setHeadingLevel(level: 1 | 2 | 3): Command {
  return (view) => {
    const { state } = view;
    const { from, to } = state.selection.main;
    const endPos = to > from && to === state.doc.lineAt(to).from ? to - 1 : to;
    const startLine = state.doc.lineAt(from);
    const endLine = state.doc.lineAt(Math.max(from, endPos));
    const prefix = `${"#".repeat(level)} `;
    const changes = [];

    for (let lineNumber = startLine.number; lineNumber <= endLine.number; lineNumber += 1) {
      const line = state.doc.line(lineNumber);
      const text = line.text.replace(/^#{1,6}\s*/, "");
      changes.push({ from: line.from, to: line.to, insert: `${prefix}${text}` });
    }

    view.dispatch({ changes });
    view.focus();
    return true;
  };
}

export function createMarkdownShortcutKeymap(opts: {
  onSave?: (doc: string) => void;
} = {}): KeyBinding[] {
  const saveCommand: Command = (view) => {
    opts.onSave?.(view.state.doc.toString());
    return true;
  };

  return [
    {
      key: "Mod-s",
      preventDefault: true,
      run: saveCommand,
    },
    {
      key: "Mod-b",
      run: (view) => replaceSelectionWithDraft(
        view,
        (text) => buildWrappedMarkdownDraft(text, "**", "**", "đậm"),
      ),
    },
    {
      key: "Mod-i",
      run: (view) => replaceSelectionWithDraft(
        view,
        (text) => buildWrappedMarkdownDraft(text, "*", "*", "nghiêng"),
      ),
    },
    {
      key: "Mod-k",
      run: (view) => replaceSelectionWithDraft(view, buildLinkMarkdownDraft),
    },
    {
      key: "Shift-Mod-i",
      run: (view) => replaceSelectionWithDraft(view, buildImageMarkdownDraft),
    },
    {
      key: "Mod-`",
      run: (view) => replaceSelectionWithDraft(
        view,
        (text) => buildWrappedMarkdownDraft(text, "`", "`", "code"),
      ),
    },
    {
      key: "Shift-Mod-c",
      run: insertSnippetCommand("code"),
    },
    {
      key: "Shift-Mod-t",
      run: insertSnippetCommand("table"),
    },
    {
      key: "Shift-Mod-m",
      run: insertSnippetCommand("math"),
    },
    {
      key: "Shift-Mod-q",
      run: insertSnippetCommand("callout"),
    },
    {
      key: "Mod-h",
      run: openSearchPanel,
    },
    {
      key: "Ctrl-Alt-1",
      run: setHeadingLevel(1),
    },
    {
      key: "Ctrl-Alt-2",
      run: setHeadingLevel(2),
    },
    {
      key: "Ctrl-Alt-3",
      run: setHeadingLevel(3),
    },
    {
      key: "Mod-Alt-1",
      run: setHeadingLevel(1),
    },
    {
      key: "Mod-Alt-2",
      run: setHeadingLevel(2),
    },
    {
      key: "Mod-Alt-3",
      run: setHeadingLevel(3),
    },
  ];
}
