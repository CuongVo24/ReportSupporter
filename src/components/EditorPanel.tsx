// Presentational Markdown editor surface — W1 = controlled <textarea>, no editor lib
// (TechnicalStack §2; CodeMirror 6 arrives in W2).

type EditorPanelProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
};

export function EditorPanel({ value, onChange, ariaLabel = "Markdown editor" }: EditorPanelProps) {
  return (
    <textarea
      className="ws-editor-textarea"
      aria-label={ariaLabel}
      spellCheck={false}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
