"use client";

import dynamic from "next/dynamic";
import { Component, useState, type ReactNode } from "react";

// W24-K (S1): the critical Workspace chunk is declared with `next/dynamic` at
// MODULE scope (not inside a useEffect). That lets Next emit a preload/prefetch
// relation the production browser actually uses, so the chunk downloads in
// parallel with route hydration instead of the old
// `hydrate loader -> useEffect -> import()` waterfall. SSR stays off (Workspace
// is client-only: IndexedDB, workers), and the accessible loading state is kept.
const WorkspaceComponent = dynamic(() => import("./Workspace").then((module) => module.Workspace), {
  ssr: false,
  loading: () => (
    <main aria-busy="true" aria-live="polite" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <p>Đang nạp workspace cục bộ…</p>
    </main>
  ),
});

// W24-K (S3): preserve the offline / stale-chunk recovery UX. If the dynamic
// import rejects (e.g. a new service-worker release removed the old chunk while
// offline), we catch it and offer retry WITHOUT reloading the page — so an
// in-memory autosave draft is never lost to a hard navigation.
class ChunkErrorBoundary extends Component<
  { children: ReactNode; onRetry: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main style={{ maxWidth: 560, margin: "12vh auto", padding: 24 }}>
        <h1>Không thể nạp workspace</h1>
        <p>Chunk ứng dụng chưa sẵn sàng. Khi ngoại tuyến, hãy mở lại sau khi bản cập nhật đã được tải đầy đủ.</p>
        <button type="button" onClick={this.props.onRetry}>
          Thử lại
        </button>
      </main>
    );
  }
}

export function WorkspaceLoader({ projectId }: { projectId: string }) {
  // Remounting with a fresh key forces `next/dynamic` to re-attempt the import
  // after a failure, rather than replaying the cached rejection.
  const [attempt, setAttempt] = useState(0);
  return (
    <ChunkErrorBoundary key={attempt} onRetry={() => setAttempt((value) => value + 1)}>
      <WorkspaceComponent projectId={projectId} />
    </ChunkErrorBoundary>
  );
}
