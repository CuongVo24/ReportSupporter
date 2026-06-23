import { WorkspaceLayout } from "@/components/WorkspaceLayout";

function ZonePlaceholder({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h2 className="ws-zone-title">{title}</h2>
      <p className="ws-zone-hint">{hint}</p>
    </div>
  );
}

export default function Home() {
  // Workspace-first route. Real panels are injected here in W1 Groups D–E.
  return (
    <WorkspaceLayout
      editor={<ZonePlaceholder title="Editor" hint="Markdown editor (CodeMirror) lands in W2." />}
      preview={<ZonePlaceholder title="Preview" hint="Live preview pipeline lands in W2." />}
      sidePanel={
        <ZonePlaceholder title="Panel" hint="Navigator & checker land in W1 Groups D–E." />
      }
    />
  );
}
