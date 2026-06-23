"use client";

import type { TemplateSchema } from "@/types";

type TemplatePickerProps = {
  templates: TemplateSchema[];
  value: string;
  onSelect: (id: string) => void;
};

export function TemplatePicker({ templates, value, onSelect }: TemplatePickerProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--rs-space-1)" }}>
      <label 
        htmlFor="template-select" 
        style={{
          fontSize: "var(--rs-font-size-sm)",
          fontWeight: "var(--rs-font-weight-medium)",
          color: "var(--rs-slate-700)",
        }}
      >
        Mẫu tài liệu (Template)
      </label>
      
      <select
        id="template-select"
        value={value}
        onChange={(e) => onSelect(e.target.value)}
        style={{
          padding: "var(--rs-space-2)",
          border: "1px solid var(--rs-color-border)",
          borderRadius: "var(--rs-radius-sm)",
          backgroundColor: "var(--rs-color-surface)",
          color: "var(--rs-color-text)",
          fontSize: "var(--rs-font-size-sm)",
          outline: "none",
          cursor: "pointer",
        }}
      >
        {templates.map((tpl) => (
          <option key={tpl.id} value={tpl.id}>
            {tpl.name}
          </option>
        ))}
      </select>
      
      {templates.find(t => t.id === value) && (
        <small style={{ color: "var(--rs-color-text-muted)", fontSize: "var(--rs-font-size-xs)", marginTop: "2px" }}>
          {templates.find(t => t.id === value)?.description}
        </small>
      )}
    </div>
  );
}
