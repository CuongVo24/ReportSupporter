"use client";

import { useState } from "react";
import { AlertTriangle, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";

type InvalidDraftRecoveryProps = {
  raw: unknown;
  issues: string[];
  onReset: () => Promise<void>;
};

export function InvalidDraftRecovery({ raw, issues, onReset }: InvalidDraftRecoveryProps) {
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  const downloadRawDraft = () => {
    let content: string;
    try {
      content = JSON.stringify(raw, null, 2);
    } catch {
      content = String(raw);
    }
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `reportsupporter-invalid-draft-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const resetDraft = async () => {
    setResetting(true);
    setResetError("");
    try {
      await onReset();
    } catch (error: unknown) {
      setResetError(error instanceof Error ? error.message : "Không thể tạo bản thảo mới.");
      setResetting(false);
    }
  };

  return (
    <main className="ws-state-container" role="alert" style={{ maxWidth: 720, margin: "64px auto", padding: 32 }}>
      <AlertTriangle size={36} aria-hidden="true" />
      <h1>Không thể đọc bản thảo đã lưu</h1>
      <p>Dữ liệu cũ được giữ nguyên. Hãy tải bản sao trước khi chủ động tạo lại workspace.</p>
      <ul style={{ textAlign: "left", maxHeight: 180, overflow: "auto", width: "100%" }}>
        {issues.slice(0, 10).map((issue, index) => <li key={`${index}-${issue}`}>{issue}</li>)}
      </ul>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Button variant="secondary" leadingIcon={<Download size={16} />} onClick={downloadRawDraft}>
          Tải bản sao dữ liệu
        </Button>
        <Button variant="danger" leadingIcon={<RotateCcw size={16} />} loading={resetting} onClick={() => void resetDraft()}>
          Bỏ bản lỗi và tạo mới
        </Button>
      </div>
      {resetError && <p className="ws-save-status-error">{resetError}</p>}
    </main>
  );
}
