"use client";

import React, { useState } from "react";
import type { TemplateSchema } from "@/types";
import { TemplatePicker } from "./TemplatePicker";
import { MetadataForm } from "./MetadataForm";
import { validateMetadata } from "./generate-skeleton";

type ProjectInitializerProps = {
  templates: TemplateSchema[];
  initialTitle?: string;
  initialMetadata?: Record<string, string | string[]>;
  onInitialize: (template: TemplateSchema, title: string, metadata: Record<string, string | string[]>) => void;
};

export function ProjectInitializer({
  templates,
  initialTitle = "",
  initialMetadata = {},
  onInitialize,
}: ProjectInitializerProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || "");
  const [values, setValues] = useState<Record<string, string | string[]>>(() => {
    const initialValues: Record<string, string | string[]> = { ...initialMetadata };
    if (!initialValues.title) {
      const activeTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
      initialValues.title = initialTitle || (activeTemplate ? activeTemplate.name : "");
    }
    return initialValues;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    const nextTemplate = templates.find((t) => t.id === id);
    if (nextTemplate) {
      setValues((prev) => ({
        ...prev,
        title: nextTemplate.name,
      }));
    }
  };

  const handleFormChange = (newValues: Record<string, string | string[]>) => {
    setValues(newValues);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTemplate) return;

    const titleVal = typeof values.title === "string" ? values.title : "";
    const validationErrors = validateMetadata(activeTemplate, titleVal, values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    onInitialize(activeTemplate, titleVal, values);
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>Khởi tạo Báo cáo Mới</h2>
        <p style={subtitleStyle}>Chọn mẫu tài liệu và điền thông tin ban đầu để tạo cấu trúc báo cáo.</p>
        
        <form onSubmit={handleSubmit} style={formStyle}>
          <TemplatePicker
            templates={templates}
            value={selectedTemplateId}
            onSelect={handleTemplateChange}
          />
          
          <div style={dividerStyle} />
          
          <MetadataForm
            fields={activeTemplate?.metadataFields || []}
            values={values}
            onChange={handleFormChange}
            errors={errors}
          />
          
          <button type="submit" style={buttonStyle}>
            Khởi tạo báo cáo
          </button>
        </form>
      </div>
    </div>
  );
}

const containerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "calc(100vh - 50px)",
  backgroundColor: "var(--rs-slate-50)",
  padding: "var(--rs-space-6)",
};

const cardStyle = {
  width: "100%",
  maxWidth: "520px",
  backgroundColor: "var(--rs-color-surface)",
  border: "1px solid var(--rs-color-border)",
  borderRadius: "var(--rs-radius-lg)",
  boxShadow: "var(--rs-elevation-1)",
  padding: "var(--rs-space-6)",
};

const titleStyle = {
  fontSize: "var(--rs-font-size-xl)",
  fontWeight: "var(--rs-font-weight-bold)",
  color: "var(--rs-color-text)",
  margin: 0,
};

const subtitleStyle = {
  fontSize: "var(--rs-font-size-sm)",
  color: "var(--rs-color-text-muted)",
  marginTop: "var(--rs-space-1)",
  marginBottom: "var(--rs-space-5)",
};

const formStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "var(--rs-space-4)",
};

const dividerStyle = {
  height: "1px",
  backgroundColor: "var(--rs-color-border)",
  margin: "var(--rs-space-2) 0",
};

const buttonStyle = {
  marginTop: "var(--rs-space-3)",
  padding: "var(--rs-space-2) var(--rs-space-4)",
  backgroundColor: "var(--rs-slate-800)",
  color: "#ffffff",
  border: "none",
  borderRadius: "var(--rs-radius-md)",
  fontSize: "var(--rs-font-size-sm)",
  fontWeight: "var(--rs-font-weight-semibold)",
  cursor: "pointer",
  transition: "background-color 0.2s ease",
  outline: "none",
};
