"use client";

import { useEffect, useState } from "react";
import type { MetadataFieldSpec } from "@/types";
import { Input, Textarea } from "@/components/ui";

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
  onBlur?: (key: string) => void;
};

export function MetadataForm({
  fields,
  values,
  onChange,
  errors = {},
  onBlur,
}: MetadataFormProps) {
  const [listInputs, setListInputs] = useState<Record<string, string>>({});

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
    <div className="ws-meta-form" style={{ display: "flex", flexDirection: "column", gap: "var(--rs-space-4)" }}>
      <Input
        id="meta-title"
        label="Tiêu đề báo cáo *"
        placeholder="Nhập tiêu đề đồ án/báo cáo..."
        value={typeof values.title === "string" ? values.title : ""}
        onChange={(e) => handleTextChange("title", e.target.value)}
        onBlur={() => onBlur?.("title")}
        error={errors.title}
      />

      {fields.map((field) => {
        const isList = field.type === "textList";
        const val = isList
          ? (listInputs[field.key] ?? "")
          : (values[field.key] as string ?? "");

        const labelText = field.label + (field.required ? " *" : "");

        if (field.key === "readmeContent") {
          return (
            <Textarea
              key={field.key}
              id={`meta-${field.key}`}
              label={labelText}
              placeholder={field.placeholder ?? "Dán nội dung README.md ở đây..."}
              value={val}
              onChange={(e) => handleTextChange(field.key, e.target.value)}
              onBlur={() => onBlur?.(field.key)}
              error={errors[field.key]}
            />
          );
        }

        return (
          <Input
            key={field.key}
            id={`meta-${field.key}`}
            type="text"
            label={labelText}
            placeholder={field.placeholder ?? `Nhập ${field.label.toLowerCase()}...`}
            value={val}
            onChange={(e) => {
              if (isList) {
                handleListChange(field.key, e.target.value);
              } else {
                handleTextChange(field.key, e.target.value);
              }
            }}
            onBlur={() => onBlur?.(field.key)}
            error={errors[field.key]}
            helperText={isList ? "Nhập các thành viên phân tách bằng dấu phẩy" : undefined}
          />
        );
      })}
    </div>
  );
}
