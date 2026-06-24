"use client";

import React, { useState } from "react";
import type { EvidenceItem, EvidenceKind } from "@/types";
import { validateEvidence } from "./validate";
import { kindMeta } from "./kind-meta";

export interface EvidenceFormProps {
  initial?: EvidenceItem;
  onSubmit: (item: EvidenceItem) => void;
  onCancel?: () => void;
}

export function EvidenceForm({ initial, onSubmit, onCancel }: EvidenceFormProps) {
  const [kind, setKind] = useState<EvidenceKind>(initial?.kind || "video");
  const [title, setTitle] = useState(initial?.title || "");
  const [url, setUrl] = useState(initial?.url || "");
  const [note, setNote] = useState(initial?.note || "");
  const [qrEnabled, setQrEnabled] = useState(initial?.qrEnabled ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemData = {
      id: initial?.id || crypto.randomUUID(),
      kind,
      title,
      url: url || undefined,
      note: note || undefined,
      qrEnabled,
      createdAt: initial?.createdAt || new Date().toISOString(),
    };

    const res = validateEvidence(itemData);
    if (res.ok) {
      onSubmit(res.item);
    } else {
      setErrors(res.errors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ws-meta-form" aria-label={initial ? "Sửa minh chứng" : "Thêm minh chứng"}>
      <div className="ws-form-group">
        <label htmlFor="ev-kind" className="ws-form-label">
          Loại minh chứng <span className="ws-form-label-required">*</span>
        </label>
        <select
          id="ev-kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as EvidenceKind)}
          className="ws-form-input"
        >
          {(Object.keys(kindMeta) as EvidenceKind[]).map((k) => (
            <option key={k} value={k}>
              {kindMeta[k].icon} {kindMeta[k].label}
            </option>
          ))}
        </select>
        {errors.kind && <span className="ws-form-error" aria-live="assertive">{errors.kind}</span>}
      </div>

      <div className="ws-form-group">
        <label htmlFor="ev-title" className="ws-form-label">
          Tiêu đề minh chứng <span className="ws-form-label-required">*</span>
        </label>
        <input
          id="ev-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="ws-form-input"
          placeholder="Nhập tiêu đề minh chứng..."
        />
        {errors.title && <span className="ws-form-error" aria-live="assertive">{errors.title}</span>}
      </div>

      <div className="ws-form-group">
        <label htmlFor="ev-url" className="ws-form-label">Liên kết (URL)</label>
        <input
          id="ev-url"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="ws-form-input"
          placeholder="https://..."
        />
        {errors.url && <span className="ws-form-error" aria-live="assertive">{errors.url}</span>}
      </div>

      <div className="ws-form-group">
        <label htmlFor="ev-note" className="ws-form-label">Ghi chú</label>
        <textarea
          id="ev-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="ws-form-input"
          style={{ minHeight: "60px", fontFamily: "inherit" }}
          placeholder="Tài khoản dùng thử, mô tả ngắn..."
        />
        {errors.note && <span className="ws-form-error" aria-live="assertive">{errors.note}</span>}
      </div>

      <div className="ws-form-group" style={{ flexDirection: "row", alignItems: "center", gap: "var(--rs-space-2)" }}>
        <input
          id="ev-qr"
          type="checkbox"
          checked={qrEnabled}
          onChange={(e) => setQrEnabled(e.target.checked)}
          style={{ width: "16px", height: "16px", cursor: "pointer" }}
        />
        <label htmlFor="ev-qr" className="ws-form-label" style={{ cursor: "pointer" }}>
          Hiển thị mã QR trong phụ lục
        </label>
      </div>

      <div style={{ display: "flex", gap: "var(--rs-space-2)", marginTop: "var(--rs-space-2)" }}>
        <button type="submit" className="ws-checker-run" style={{ flex: 1 }}>
          {initial ? "Lưu" : "Thêm"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="ws-reset-btn"
            style={{ flex: 1, margin: 0, padding: "var(--rs-space-2) var(--rs-space-4)" }}
          >
            Hủy
          </button>
        )}
      </div>
    </form>
  );
}
