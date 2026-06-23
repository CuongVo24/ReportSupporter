import type { ReactNode } from "react";

type WorkspaceLayoutProps = {
  editor: ReactNode;
  preview: ReactNode;
  sidePanel: ReactNode;
};

/**
 * Workspace-first 3-zone shell (editor | preview | side panel).
 * Presentational only — Groups D/E inject real panels through the slot props,
 * so this layout never imports from `src/modules/*`.
 */
export function WorkspaceLayout({ editor, preview, sidePanel }: WorkspaceLayoutProps) {
  return (
    <div className="ws-shell">
      <header className="ws-topbar">
        <span className="ws-brand">ReportSupporter</span>
      </header>
      <main className="ws-main">
        <section className="ws-zone ws-editor" aria-label="Editor">
          {editor}
        </section>
        <section className="ws-zone ws-preview" aria-label="Preview">
          {preview}
        </section>
        <aside className="ws-zone ws-side" aria-label="Side panel">
          {sidePanel}
        </aside>
      </main>
    </div>
  );
}
