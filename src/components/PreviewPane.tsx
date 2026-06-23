// Presentational preview — W1 shows RAW Markdown text (no HTML rendering).
// The real unified (remark/rehype) pipeline arrives in W2.

type PreviewPaneProps = {
  markdown: string;
};

export function PreviewPane({ markdown }: PreviewPaneProps) {
  const hasContent = markdown.trim().length > 0;
  return (
    <pre className="ws-preview-raw" aria-label="Raw Markdown preview">
      {hasContent ? markdown : "Chưa có nội dung."}
    </pre>
  );
}
