"use client";

import React, { useState, useRef, useEffect } from "react";
import { PanelLeftClose, Plus, ChevronUp, ChevronDown, Pencil, Trash } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type SectionNavProps = {
  sections: { id: string; title: string; status: "draft" | "review" | "done" }[];
  activeSectionId: string;
  onSectionSelect: (id: string) => void;
  isDesktop: boolean;
  onCollapse?: () => void;
  onAddSection?: () => void;
  onRenameSection?: (id: string, title: string) => void;
  onDeleteSection?: (id: string) => void;
  onMoveSection?: (id: string, direction: "up" | "down") => void;
};

export function SectionNav({
  sections,
  activeSectionId,
  onSectionSelect,
  isDesktop,
  onCollapse,
  onAddSection,
  onRenameSection,
  onDeleteSection,
  onMoveSection,
}: SectionNavProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleStartRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleRenameSubmit = (id: string) => {
    const trimmed = editTitle.trim();
    if (trimmed && onRenameSection) {
      onRenameSection(id, trimmed);
    }
    setEditingId(null);
  };

  return (
    <div className="ws-section-nav-content">
      <div className="ws-section-nav-header">
        <span className="ws-section-nav-title">Mục lục</span>
        <div style={{ display: "flex", gap: "var(--rs-space-1)", alignItems: "center" }}>
          {onAddSection && (
            <button
              type="button"
              className="ws-section-nav-action-btn"
              onClick={onAddSection}
              aria-label="Thêm mục mới"
              title="Thêm mục mới"
            >
              <Plus size={14} />
            </button>
          )}
          {isDesktop && onCollapse && (
            <button
              type="button"
              className="ws-column-toggle-btn"
              onClick={onCollapse}
              aria-label="Thu gọn mục lục"
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>
      </div>
      <ul className="ws-section-nav-list">
        {sections.map((sec, idx) => {
          const isActive = sec.id === activeSectionId;
          const isEditing = sec.id === editingId;

          return (
            <li key={sec.id}>
              <div className={`ws-section-nav-item-container ${isActive ? "active" : ""}`}>
                {isEditing ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    className="ws-section-nav-edit-input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleRenameSubmit(sec.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameSubmit(sec.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    maxLength={100}
                    aria-label="Nhập tiêu đề mục mới"
                  />
                ) : (
                  <button
                    className={`ws-section-nav-item ${isActive ? "ws-section-nav-item-active" : ""}`}
                    onClick={() => onSectionSelect(sec.id)}
                    onDoubleClick={() => handleStartRename(sec.id, sec.title)}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={`${idx + 1}. ${sec.title}`}
                    title={`${idx + 1}. ${sec.title}`}
                  >
                    <span className="ws-section-nav-item-text">
                      <span className="ws-section-nav-item-index" aria-hidden="true">{idx + 1}.</span>
                      <span className="ws-section-nav-item-title">{sec.title}</span>
                    </span>
                    {!isActive && <Badge group="status" value={sec.status} />}
                  </button>
                )}

                {isActive && !isEditing && (
                  <div className="ws-section-nav-item-actions">
                    {onMoveSection && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveSection(sec.id, "up");
                          }}
                          disabled={idx === 0}
                          aria-label="Di chuyển lên"
                          title="Di chuyển lên"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveSection(sec.id, "down");
                          }}
                          disabled={idx === sections.length - 1}
                          aria-label="Di chuyển xuống"
                          title="Di chuyển xuống"
                        >
                          <ChevronDown size={12} />
                        </button>
                      </>
                    )}
                    {onRenameSection && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartRename(sec.id, sec.title);
                        }}
                        aria-label="Đổi tên mục"
                        title="Đổi tên mục"
                      >
                        <Pencil size={12} />
                      </button>
                    )}
                    {onDeleteSection && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSection(sec.id);
                        }}
                        aria-label="Xóa mục"
                        title="Xóa mục"
                      >
                        <Trash size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
