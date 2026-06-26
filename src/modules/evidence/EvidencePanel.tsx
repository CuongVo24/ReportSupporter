"use client";

import React, { useState } from "react";
import type { EvidenceItem } from "@/types";
import { EvidenceForm } from "./EvidenceForm";
import { kindMeta } from "./kind-meta";
import { Button } from "@/components/ui";
import { EmptyState } from "@/components/states";
import {
  Video,
  Github,
  Rocket,
  FolderOpen,
  Palette,
  KeyRound,
  FileText,
  Presentation,
  Paperclip,
  Check
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>> = {
  Video,
  Github,
  Rocket,
  FolderOpen,
  Palette,
  KeyRound,
  FileText,
  Presentation,
  Paperclip,
};

export interface EvidencePanelProps {
  evidence: EvidenceItem[];
  onChange: (next: EvidenceItem[]) => void;
}

export function EvidencePanel({ evidence, onChange }: EvidencePanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const handleAddSubmit = (item: EvidenceItem) => {
    onChange([...evidence, item]);
    setIsAdding(false);
  };

  const handleEditSubmit = (updated: EvidenceItem) => {
    onChange(evidence.map((item) => (item.id === updated.id ? updated : item)));
    setEditingItemId(null);
  };

  const handleDeleteClick = (id: string) => {
    setConfirmingDeleteId(id);
  };

  const handleConfirmDelete = (id: string) => {
    onChange(evidence.filter((item) => item.id !== id));
    setConfirmingDeleteId(null);
  };

  const handleCancelDelete = () => {
    setConfirmingDeleteId(null);
  };

  const editingItem = evidence.find((item) => item.id === editingItemId) || null;

  if (isAdding) {
    return (
      <div className="ws-evidence" aria-label="Thêm minh chứng mới">
        <div className="ws-evidence-header">
          <h3 className="ws-evidence-title">Thêm minh chứng mới</h3>
        </div>
        <EvidenceForm onSubmit={handleAddSubmit} onCancel={() => setIsAdding(false)} />
      </div>
    );
  }

  if (editingItem) {
    return (
      <div className="ws-evidence" aria-label="Sửa minh chứng">
        <div className="ws-evidence-header">
          <h3 className="ws-evidence-title">Sửa minh chứng</h3>
        </div>
        <EvidenceForm initial={editingItem} onSubmit={handleEditSubmit} onCancel={() => setEditingItemId(null)} />
      </div>
    );
  }

  return (
    <div className="ws-evidence" aria-label="Danh sách minh chứng">
      <div className="ws-evidence-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="ws-evidence-title" style={{ margin: 0 }}>Minh chứng (Evidence Kit)</h3>
        <Button
          onClick={() => {
            setIsAdding(true);
            setConfirmingDeleteId(null);
          }}
          variant="primary"
          size="sm"
          className="ws-evidence-add-btn"
          aria-label="Thêm minh chứng mới"
        >
          Thêm minh chứng
        </Button>
      </div>

      {evidence.length === 0 ? (
        <div style={{ marginTop: "var(--rs-space-4)" }}>
          <EmptyState
            title="Chưa có minh chứng"
            message="Thêm liên kết minh chứng cho báo cáo."
            actionLabel="Thêm minh chứng"
            onAction={() => {
              setIsAdding(true);
              setConfirmingDeleteId(null);
            }}
          />
        </div>
      ) : (
        <div className="ws-evidence-list">
          {evidence.map((item) => {
            const meta = kindMeta[item.kind] || { label: item.kind, icon: "Paperclip" };
            const Icon = iconMap[meta.icon] || Paperclip;
            return (
              <div key={item.id} className="ws-evidence-item" aria-label={`Minh chứng: ${item.title}`}>
                <div className="ws-evidence-item-header">
                  <span className="ws-evidence-meta" aria-label={`Loại minh chứng: ${meta.label}`} style={{ display: "inline-flex", alignItems: "center", gap: "var(--rs-space-1)" }}>
                    <Icon size={14} />
                    <span>{meta.label}</span>
                  </span>
                  {item.qrEnabled && (
                    <span className="ws-evidence-item-qr" title="Hiển thị QR trong phụ lục" aria-label="Hiển thị QR">
                      QR <Check size={12} strokeWidth={2.5} />
                    </span>
                  )}
                </div>

                <h4 className="ws-evidence-item-title">{item.title}</h4>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="ws-evidence-item-url"
                    aria-label={`Mở liên kết: ${item.title}`}
                  >
                    {item.url}
                  </a>
                )}

                {item.note && (
                  <p className="ws-evidence-item-note">{item.note}</p>
                )}

                <div className="ws-evidence-actions" style={{ display: "flex", gap: "var(--rs-space-2)", marginTop: "var(--rs-space-3)" }}>
                  {confirmingDeleteId === item.id ? (
                    <>
                      <Button
                        onClick={() => handleConfirmDelete(item.id)}
                        variant="danger"
                        size="sm"
                        className="ws-evidence-action-btn ws-evidence-action-btn-delete"
                        aria-label={`Xác nhận xóa minh chứng: ${item.title}`}
                      >
                        Xoá
                      </Button>
                      <Button
                        onClick={handleCancelDelete}
                        variant="ghost"
                        size="sm"
                        className="ws-evidence-action-btn"
                        aria-label={`Hủy xóa minh chứng: ${item.title}`}
                      >
                        Hủy
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => {
                          setEditingItemId(item.id);
                          setConfirmingDeleteId(null);
                        }}
                        variant="secondary"
                        size="sm"
                        className="ws-evidence-action-btn"
                        aria-label={`Sửa minh chứng: ${item.title}`}
                      >
                        Sửa
                      </Button>
                      <Button
                        onClick={() => handleDeleteClick(item.id)}
                        variant="ghost"
                        size="sm"
                        className="ws-evidence-action-btn ws-evidence-action-btn-delete"
                        aria-label={`Xóa minh chứng: ${item.title}`}
                      >
                        Xóa
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
