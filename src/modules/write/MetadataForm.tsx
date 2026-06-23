"use client";

import { useEffect, useState } from "react";
import type { MetadataFieldSpec } from "@/types";

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
    const nextInputs: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.type === "textList") {
        const val = values[field.key];
        nextInputs[field.key] = Array.isArray(val) ? val.join(", ") : "";
      }
    });
    setListInputs(nextInputs);
  }, [values, fields]);

  const handleTextChange = (key: string, val: string) => {
    onChange({
      ...values,
      [key]: val,
    });
  };

  const handleListChange = (key: string, rawVal: string) => {
    setListInputs((prev) => ({ ...prev, [key]: rawVal }));
    const list = rawVal
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    onChange({
      ...values,
      [key]: list,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--rs-space-3)" }}>
      {/* Document Title (always present and implicitly required) */}
      <div style={formGroupStyle}>
        <label htmlFor="meta-title" style={labelStyle}>
          Tiêu đề báo cáo <span style={{ color: "var(--rs-color-severity-error)" }}>*</span>
        </label>
        <input
          id="meta-title"
          type="text"
          style={inputStyle}
          placeholder="Nhập tiêu đề đồ án/báo cáo..."
          value={typeof values.title === "string" ? values.title : ""}
          onChange={(e) => handleTextChange("title", e.target.value)}
        />
        {errors.title && <span style={errorStyle}>{errors.title}</span>}
      </div>

      {fields.map((field) => {
        const isList = field.type === "textList";
        const val = isList
          ? (listInputs[field.key] ?? "")
          : (values[field.key] as string ?? "");

        return (
          <div key={field.key} style={formGroupStyle}>
            <label htmlFor={`meta-${field.key}`} style={labelStyle}>
              {field.label} {field.required && <span style={{ color: "var(--rs-color-severity-error)" }}>*</span>}
            </label>
            
            <input
              id={`meta-${field.key}`}
              type="text"
              style={inputStyle}
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
            
            {isList && (
              <small style={{ color: "var(--rs-color-text-muted)", fontSize: "var(--rs-font-size-xs)", marginTop: "2px" }}>
                Nhập các thành viên phân tách bằng dấu phẩy
              </small>
            )}
            
            {errors[field.key] && <span style={errorStyle}>{errors[field.key]}</span>}
          </div>
        );
      })}
    </div>
  );
}

const formGroupStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "var(--rs-space-1)",
};

const labelStyle = {
  fontSize: "var(--rs-font-size-sm)",
  fontWeight: "var(--rs-font-weight-medium)",
  color: "var(--rs-slate-700)",
};

const inputStyle = {
  padding: "var(--rs-space-2)",
  border: "1px solid var(--rs-color-border)",
  borderRadius: "var(--rs-radius-sm)",
  fontSize: "var(--rs-font-size-sm)",
  outline: "none",
  backgroundColor: "var(--rs-color-surface)",
  color: "var(--rs-color-text)",
};

const errorStyle = {
  color: "var(--rs-color-severity-error)",
  fontSize: "var(--rs-font-size-xs)",
  marginTop: "2px",
};
