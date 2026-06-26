"use client";

import React from "react";
import type { TemplateSchema } from "@/types";
import { Select } from "@/components/ui";

type TemplatePickerProps = {
  templates: TemplateSchema[];
  value: string;
  onSelect: (id: string) => void;
};

export function TemplatePicker({ templates, value, onSelect }: TemplatePickerProps) {
  const selectOptions = templates.map((tpl) => ({
    value: tpl.id,
    label: tpl.name,
  }));

  const activeTemplate = templates.find((t) => t.id === value);

  return (
    <div className="ws-template-picker-container">
      <Select
        id="template-select"
        label="Mẫu tài liệu (Template)"
        options={selectOptions}
        value={value}
        onValueChange={onSelect}
        helperText={activeTemplate?.description}
      />
    </div>
  );
}
