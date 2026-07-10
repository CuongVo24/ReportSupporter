"use client";

import React from "react";
import { FileText } from "lucide-react";
import type { TemplateSchema } from "@/types";

type TemplatePickerProps = {
  templates: TemplateSchema[];
  value: string;
  onSelect: (id: string) => void;
};

export function TemplatePicker({ templates, value, onSelect }: TemplatePickerProps) {
  return (
    <div className="ws-template-picker-container">
      <span className="ws-template-picker-label" id="template-picker-label">
        Mẫu tài liệu (Template)
      </span>
      <div className="ws-template-grid" role="group" aria-labelledby="template-picker-label">
        {templates.map((tpl) => {
          const isActive = tpl.id === value;
          return (
            <button
              type="button"
              key={tpl.id}
              className={`ws-template-card ${isActive ? "ws-template-card-active" : ""}`}
              aria-pressed={isActive}
              onClick={() => onSelect(tpl.id)}
            >
              <span className="ws-template-card-head">
                <FileText size={15} aria-hidden="true" />
                <span className="ws-template-card-name">{tpl.name}</span>
              </span>
              {tpl.description && <span className="ws-template-card-desc">{tpl.description}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
