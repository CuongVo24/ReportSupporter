"use client";

import type { TemplateSchema } from "@/types";

type TemplatePickerProps = {
  templates: TemplateSchema[];
  value: string;
  onSelect: (id: string) => void;
};

export function TemplatePicker({ templates, value, onSelect }: TemplatePickerProps) {
  return (
    <div className="ws-template-picker-container">
      <label 
        htmlFor="template-select" 
        className="ws-form-label"
      >
        Mẫu tài liệu (Template)
      </label>
      
      <select
        id="template-select"
        value={value}
        onChange={(e) => onSelect(e.target.value)}
        className="ws-template-picker-select"
      >
        {templates.map((tpl) => (
          <option key={tpl.id} value={tpl.id}>
            {tpl.name}
          </option>
        ))}
      </select>
      
      {templates.find(t => t.id === value) && (
        <small className="ws-template-picker-desc">
          {templates.find(t => t.id === value)?.description}
        </small>
      )}
    </div>
  );
}
