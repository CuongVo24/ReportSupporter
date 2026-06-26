"use client";

import React from "react";
import { PanelLeftClose } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type SectionNavProps = {
  sections: { id: string; title: string; status: "draft" | "review" | "done" }[];
  activeSectionId: string;
  onSectionSelect: (id: string) => void;
  isDesktop: boolean;
  onCollapse?: () => void;
};

export function SectionNav({
  sections,
  activeSectionId,
  onSectionSelect,
  isDesktop,
  onCollapse,
}: SectionNavProps) {
  return (
    <div className="ws-section-nav-content">
      <div className="ws-section-nav-header">
        <span className="ws-section-nav-title">Mục lục</span>
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
      <div className="ws-section-nav-list" role="list">
        {sections.map((sec) => {
          const isActive = sec.id === activeSectionId;
          return (
            <button
              key={sec.id}
              className={`ws-section-nav-item ${isActive ? "ws-section-nav-item-active" : ""}`}
              onClick={() => onSectionSelect(sec.id)}
              role="listitem"
              aria-current={isActive ? "page" : undefined}
            >
              <span className="ws-section-nav-item-title" title={sec.title}>
                {sec.title}
              </span>
              <Badge group="status" value={sec.status} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
