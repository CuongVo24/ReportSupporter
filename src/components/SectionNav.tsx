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
      <ul className="ws-section-nav-list">
        {sections.map((sec, idx) => {
          const isActive = sec.id === activeSectionId;
          return (
            <li key={sec.id}>
              <button
                className={`ws-section-nav-item ${isActive ? "ws-section-nav-item-active" : ""}`}
                onClick={() => onSectionSelect(sec.id)}
                aria-current={isActive ? "page" : undefined}
                aria-label={`${idx + 1}. ${sec.title}`}
                title={`${idx + 1}. ${sec.title}`}
              >
                <span className="ws-section-nav-item-text">
                  <span className="ws-section-nav-item-index" aria-hidden="true">{idx + 1}.</span>
                  <span className="ws-section-nav-item-title">{sec.title}</span>
                </span>
                <Badge group="status" value={sec.status} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
