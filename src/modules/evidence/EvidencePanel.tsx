"use client";

import React, { useState } from "react";
import type { EvidenceItem } from "@/types";
import { EvidenceForm } from "./EvidenceForm";
import { kindMeta } from "./kind-meta";

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
      <div className="ws-evidence-header">
        <h3 className="ws-evidence-title">Minh chứng (Evidence Kit)</h3>
        <button
          onClick={() => {
            setIsAdding(true);
            setConfirmingDeleteId(null);
          }}
          className="ws-evidence-add-btn"
          aria-label="Thêm minh chứng mới"
        >
          Thêm
        </button>
      </div>

      {evidence.length === 0 ? (
        <p className="ws-evidence-empty">Chưa có minh chứng nào.</p>
      ) : (
        <div className="ws-evidence-list">
          {evidence.map((item) => {
            const meta = kindMeta[item.kind] || { label: item.kind, icon: "📎" };
            return (
              <div key={item.id} className="ws-evidence-item" aria-label={`Minh chứng: ${item.title}`}>
                <div className="ws-evidence-item-header">
                  <span className="ws-evidence-meta" aria-label={`Loại minh chứng: ${meta.label}`}>
                    {meta.icon} {meta.label}
                  </span>
                  {item.qrEnabled && (
                    <span className="ws-evidence-item-qr" title="Hiển thị QR trong phụ lục" aria-label="Hiển thị QR">
                      QR ✓
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

                <div className="ws-evidence-actions">
                  {confirmingDeleteId === item.id ? (
                    <>
                      <button
                        onClick={() => handleConfirmDelete(item.id)}
                        className="ws-evidence-action-btn ws-evidence-action-btn-delete"
                        aria-label={`Xác nhận xóa minh chứng: ${item.title}`}
                      >
                        Xác nhận xóa?
                      </button>
                      <button
                        onClick={handleCancelDelete}
                        className="ws-evidence-action-btn"
                        aria-label={`Hủy xóa minh chứng: ${item.title}`}
                      >
                        Hủy
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingItemId(item.id);
                          setConfirmingDeleteId(null);
                        }}
                        className="ws-evidence-action-btn"
                        aria-label={`Sửa minh chứng: ${item.title}`}
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item.id)}
                        className="ws-evidence-action-btn ws-evidence-action-btn-delete"
                        aria-label={`Xóa minh chứng: ${item.title}`}
                      >
                        Xóa
                      </button>
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
