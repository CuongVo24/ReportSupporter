"use client";

import { useEffect, useState, type ComponentType } from "react";

type WorkspaceComponent = ComponentType<{ projectId?: string }>;

export function WorkspaceLoader({ projectId }: { projectId: string }) {
  const [WorkspaceComponent, setWorkspaceComponent] = useState<WorkspaceComponent | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoadError(false);
    void import("./Workspace")
      .then((module) => {
        if (active) setWorkspaceComponent(() => module.Workspace);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => { active = false; };
  }, [attempt]);

  if (loadError) {
    return <main style={{ maxWidth: 560, margin: "12vh auto", padding: 24 }}>
      <h1>Không thể nạp workspace</h1>
      <p>Chunk ứng dụng chưa sẵn sàng. Khi ngoại tuyến, hãy mở lại sau khi bản cập nhật đã được tải đầy đủ.</p>
      <button type="button" onClick={() => setAttempt((value) => value + 1)}>Thử lại</button>
    </main>;
  }

  if (!WorkspaceComponent) {
    return <main aria-busy="true" aria-live="polite" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <p>Đang nạp workspace cục bộ…</p>
    </main>;
  }

  return <WorkspaceComponent projectId={projectId} />;
}
