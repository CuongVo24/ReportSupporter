"use client";

import { useEffect, useState } from "react";
import type { MetadataFieldSpec } from "@/types";

export function parseTextList(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

type MetadataFormProps = {
  fields: MetadataFieldSpec[];
  values: Record<string, string | string[]>;
  onChange: (values: Record<string, string | string[]>) => void;
  errors?: Record<string, string>;
};

export function MetadataForm({ fields, values, onChange, errors = {} }: MetadataFormProps) {
  const [listInputs, setListInputs] = useState<Record<string, string>>({});

  // Sync textList inputs representation with parent state
  useEffect(() => {
    setListInputs((prev) => {
      const nextInputs = { ...prev };
      let changed = false;

      fields.forEach((field) => {
        if (field.type === "textList") {
          const val = values[field.key];
          const incomingStr = Array.isArray(val) ? val.join(", ") : "";
          
          const localVal = prev[field.key] ?? "";
          const localParsedStr = parseTextList(localVal).join(", ");
          
          if (incomingStr !== localParsedStr) {
            nextInputs[field.key] = incomingStr;
            changed = true;
          }
        }
      });

      return changed ? nextInputs : prev;
    });
  }, [values, fields]);

  const handleTextChange = (key: string, val: string) => {
    onChange({
      ...values,
      [key]: val,
    });
  };

  const handleListChange = (key: string, rawVal: string) => {
    setListInputs((prev) => ({ ...prev, [key]: rawVal }));
    const list = parseTextList(rawVal);
    onChange({
      ...values,
      [key]: list,
    });
  };

  return (
    <div className="ws-meta-form">
      {/* Document Title (always present and implicitly required) */}
      <div className="ws-form-group">
        <label htmlFor="meta-title" className="ws-form-label">
          Tiêu đề báo cáo <span className="ws-form-label-required">*</span>
        </label>
        <input
          id="meta-title"
          type="text"
          className="ws-form-input"
          placeholder="Nhập tiêu đề đồ án/báo cáo..."
          value={typeof values.title === "string" ? values.title : ""}
          onChange={(e) => handleTextChange("title", e.target.value)}
        />
        {errors.title && <span className="ws-form-error">{errors.title}</span>}
      </div>

      {fields.map((field) => {
        const isList = field.type === "textList";
        const val = isList
          ? (listInputs[field.key] ?? "")
          : (values[field.key] as string ?? "");

        return (
          <div key={field.key} className="ws-form-group">
            <label htmlFor={`meta-${field.key}`} className="ws-form-label">
              {field.label} {field.required && <span className="ws-form-label-required">*</span>}
            </label>
            
            {field.key === "readmeContent" ? (
              <textarea
                id={`meta-${field.key}`}
                className="ws-form-input ws-form-textarea"
                placeholder={field.placeholder ?? "Dán nội dung README.md ở đây..."}
                value={val}
                onChange={(e) => handleTextChange(field.key, e.target.value)}
              />
            ) : (
              <input
                id={`meta-${field.key}`}
                type="text"
                className="ws-form-input"
                placeholder={field.placeholder ?? `Nhập ${field.label.toLowerCase()}...`}
                value={val}
                onChange={(e) => {
                  if (isList) {
                    handleListChange(field.key, e.target.value);
                  } else {
                    handleTextChange(field.key, e.target.value);
                  }
                }}
              />
            )}
            
            {isList && (
              <small className="ws-form-input-list-hint">
                Nhập các thành viên phân tách bằng dấu phẩy
              </small>
            )}
            
            {errors[field.key] && <span className="ws-form-error">{errors[field.key]}</span>}
          </div>
        );
      })}
    </div>
  );
}

