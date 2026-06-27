"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Shield } from "lucide-react";
import { loadAiConfig, saveAiConfig } from "./ai-config";
import type { AiConfig } from "@/types/ai";

export function AiSettingsDialog({
  isOpen,
  onOpenChange,
  onConfigSaved,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigSaved?: () => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState<string>("gemini");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");

  // Load configuration when dialog is opened
  useEffect(() => {
    if (isOpen) {
      const config = loadAiConfig();
      setEnabled(config.enabled);
      setProvider(config.provider || "gemini");
      setApiKey(config.apiKey || "");
      setModel(config.model || "");
    }
  }, [isOpen]);

  const handleSave = () => {
    const nextConfig: AiConfig = {
      enabled,
      provider: enabled ? provider : undefined,
      apiKey: enabled && apiKey ? apiKey : undefined,
      model: enabled && model ? model : undefined,
    };
    saveAiConfig(nextConfig);
    onOpenChange(false);
    if (onConfigSaved) {
      onConfigSaved();
    }
  };

  const providers = [
    { value: "gemini", label: "Google Gemini" },
    { value: "openai", label: "OpenAI GPT" },
    { value: "anthropic", label: "Anthropic Claude" },
  ];

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Cài đặt Trợ lý AI"
      variant="modal"
      footer={
        <div style={{ display: "flex", gap: "var(--rs-space-2)", justifyContent: "flex-end", width: "100%" }}>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Lưu cài đặt
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--rs-space-4)", padding: "var(--rs-space-2) 0" }}>
        
        {/* Toggle master enabled */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--rs-space-3)", backgroundColor: "var(--rs-color-surface-muted)", borderRadius: "var(--rs-radius-md)" }}>
          <div>
            <div style={{ fontWeight: "var(--rs-font-weight-bold)", fontSize: "var(--rs-font-size-sm)", color: "var(--rs-color-text)" }}>Kích hoạt Trợ lý AI</div>
            <div style={{ color: "var(--rs-color-text-muted)", fontSize: "var(--rs-font-size-xs)", marginTop: "2px" }}>Bật các tính năng sửa văn bản và gợi ý bằng AI</div>
          </div>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ width: "18px", height: "18px", cursor: "pointer" }}
            aria-label="Kích hoạt Trợ lý AI"
          />
        </div>

        {enabled && (
          <>
            {/* Provider choice */}
            <Select
              label="Nhà cung cấp (Provider)"
              value={provider}
              onValueChange={setProvider}
              options={providers}
            />

            {/* API Key input */}
            <Input
              label="API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Nhập API Key của bạn..."
              helperText="Chiến lược hiện tại dùng key-client: key lưu trong localStorage và gửi qua header x-api-key tới /api/ai."
            />

            {/* Model input (optional) */}
            <Input
              label="Tên Model (Tùy chọn)"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={
                provider === "gemini" 
                  ? "Ví dụ: gemini-1.5-flash" 
                  : provider === "openai" 
                  ? "Ví dụ: gpt-4o" 
                  : "Ví dụ: claude-3-5-sonnet"
              }
              helperText="Để trống để sử dụng model mặc định của nhà cung cấp."
            />

            {/* Privacy Warning */}
            <div style={{ display: "flex", gap: "var(--rs-space-2)", color: "var(--rs-color-text-muted)", fontSize: "var(--rs-font-size-xs)", padding: "var(--rs-space-3)", border: "1px solid var(--rs-color-border)", borderRadius: "var(--rs-radius-md)" }}>
              <Shield size={16} style={{ flexShrink: 0, color: "var(--rs-color-primary)" }} aria-hidden="true" />
              <div>
                <span style={{ fontWeight: "var(--rs-font-weight-medium)", color: "var(--rs-color-text)" }}>Cảnh báo bảo mật:</span> API key lưu trong localStorage nên có thể bị đọc nếu app gặp XSS. Route server không dùng key môi trường làm fallback; mỗi request AI cần key bạn nhập và nội dung section/báo cáo sẽ được gửi đến provider đã chọn.
              </div>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
