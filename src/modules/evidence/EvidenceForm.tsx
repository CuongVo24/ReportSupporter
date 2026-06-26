"use client";

import React, { useState } from "react";
import type { EvidenceItem, EvidenceKind } from "@/types";
import { validateEvidence } from "./validate";
import { kindMeta } from "./kind-meta";
import { Select, Input, Textarea, Button } from "@/components/ui";

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
      <Select
        id="ev-kind"
        label="Loại minh chứng *"
        value={kind}
        onValueChange={(value) => setKind(value as EvidenceKind)}
        options={(Object.keys(kindMeta) as EvidenceKind[]).map((k) => ({
          value: k,
          label: `${kindMeta[k].icon} ${kindMeta[k].label}`,
        }))}
        error={errors.kind}
        required
      />

      <Input
        id="ev-title"
        label="Tiêu đề minh chứng *"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nhập tiêu đề minh chứng..."
        error={errors.title}
        required
      />

      <Input
        id="ev-url"
        label="Liên kết (URL)"
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://..."
        error={errors.url}
      />

      <Textarea
        id="ev-note"
        label="Ghi chú"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        style={{ minHeight: "60px", fontFamily: "inherit" }}
        placeholder="Tài khoản dùng thử, mô tả ngắn..."
        error={errors.note}
        autoGrow
      />

      <div className="ws-form-group" style={{ flexDirection: "row", alignItems: "center", gap: "var(--rs-space-2)", marginTop: "var(--rs-space-2)" }}>
        <input
          id="ev-qr"
          type="checkbox"
          checked={qrEnabled}
          onChange={(e) => setQrEnabled(e.target.checked)}
          style={{ width: "16px", height: "16px", cursor: "pointer" }}
        />
        <label htmlFor="ev-qr" className="ws-field-label" style={{ cursor: "pointer", marginBottom: 0 }}>
          Hiển thị mã QR trong phụ lục
        </label>
      </div>

      <div style={{ display: "flex", gap: "var(--rs-space-2)", marginTop: "var(--rs-space-4)" }}>
        <Button type="submit" variant="primary" style={{ flex: 1 }}>
          {initial ? "Lưu" : "Thêm minh chứng"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="ghost"
            style={{ flex: 1 }}
          >
            Hủy
          </Button>
        )}
      </div>
    </form>
  );
}
