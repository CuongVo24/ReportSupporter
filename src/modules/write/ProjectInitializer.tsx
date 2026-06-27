"use client";

import React, { useState } from "react";
import type { TemplateSchema, ReportSection } from "@/types";
import { TemplatePicker } from "./TemplatePicker";
import { MetadataForm } from "./MetadataForm";
import { MarkdownImportDropzone } from "./MarkdownImportDropzone";
import type { MarkdownImportDraft } from "./markdown-import";
import { validateMetadata } from "./generate-skeleton";
import { Button } from "@/components/ui";
import { Lightbulb, AlertTriangle } from "lucide-react";
import { getGatewayState, requestSuggestion } from "./ai/ai-gateway";
import { generateOutline } from "./ai/generate-outline";

type ProjectInitializerProps = {
  templates: TemplateSchema[];
  initialTitle?: string;
  initialMetadata?: Record<string, string | string[]>;
  onInitialize: (template: TemplateSchema, title: string, metadata: Record<string, string | string[]>) => void;
  onStartBlank: () => void;
  onImportMarkdown: (draft: MarkdownImportDraft) => void;
  onApplyAiOutline?: (sections: ReportSection[], title: string) => void;
  onOpenAiSettings?: () => void;
};

export function ProjectInitializer({
  templates,
  initialTitle = "",
  initialMetadata = {},
  onInitialize,
  onStartBlank,
  onImportMarkdown,
  onApplyAiOutline,
  onOpenAiSettings,
}: ProjectInitializerProps) {
  const [initMode, setInitMode] = useState<"template" | "blank" | "import" | "outline">("template");
  const [outlineTopic, setOutlineTopic] = useState("");
  const [outlineTitle, setOutlineTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSections, setGeneratedSections] = useState<ReportSection[]>([]);
  const [aiError, setAiError] = useState("");
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
  const [importedMarkdown, setImportedMarkdown] = useState<MarkdownImportDraft | null>(null);

  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const readmeTemplate = templates.find((t) => t.id === "readme-report");

  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    const nextTemplate = templates.find((t) => t.id === id);
    if (nextTemplate) {
      setValues((prev) => {
        const nextValues: Record<string, string | string[]> = {
          ...prev,
          title: id === "readme-report" && importedMarkdown ? importedMarkdown.title : nextTemplate.name,
        };

        if (id === "readme-report" && importedMarkdown) {
          nextValues.readmeContent = importedMarkdown.markdown;
        }

        if (id !== "readme-report") {
          delete nextValues.readmeContent;
        }

        return nextValues;
      });
      if (id !== "readme-report") {
        setImportedMarkdown(null);
      }
      setErrors({});
    }
  };

  const handleMarkdownImported = (draft: MarkdownImportDraft) => {
    setImportedMarkdown(draft);
    if (readmeTemplate) {
      setSelectedTemplateId(readmeTemplate.id);
    }
    setValues((prev) => ({
      ...prev,
      title: draft.title,
      readmeContent: draft.markdown,
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.title;
      delete next.readmeContent;
      return next;
    });
  };

  const handleFormChange = (newValues: Record<string, string | string[]>) => {
    setValues(newValues);
  };

  const handleBlur = (key: string) => {
    if (!activeTemplate) return;
    const titleVal = typeof values.title === "string" ? values.title : "";
    const validationErrors = validateMetadata(activeTemplate, titleVal, values);
    
    setErrors((prev) => ({
      ...prev,
      [key]: validationErrors[key] || "",
    }));
  };

  const handleSubmitTemplate = () => {
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

  const handleGenerateOutline = async () => {
    if (!outlineTopic.trim()) {
      setAiError("Vui lòng nhập mô tả chủ đề báo cáo.");
      return;
    }
    setAiError("");
    setIsGenerating(true);
    try {
      const sections = await generateOutline(outlineTopic, { requestSuggestion });
      if (sections.length === 0) {
        setAiError("Không thể tạo được dàn ý hợp lệ từ mô tả này. Vui lòng thử lại.");
      } else {
        setGeneratedSections(sections);
      }
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi gọi AI.";
      setAiError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const visibleMetadataFields = (activeTemplate?.metadataFields || []).filter(
    (field) => !(field.key === "readmeContent" && importedMarkdown),
  );

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Khởi tạo Báo cáo Mới</h2>
          <p style={subtitleStyle}>Chọn mẫu tài liệu và điền thông tin ban đầu để tạo cấu trúc báo cáo.</p>
        </div>

        <div style={tabContainerStyle}>
          <button
            type="button"
            style={initMode === "template" ? activeTabStyle : tabStyle}
            onClick={() => setInitMode("template")}
          >
            Mẫu chuẩn
          </button>
          <button
            type="button"
            style={initMode === "blank" ? activeTabStyle : tabStyle}
            onClick={() => setInitMode("blank")}
          >
            Tài liệu trống
          </button>
          <button
            type="button"
            style={initMode === "import" ? activeTabStyle : tabStyle}
            onClick={() => setInitMode("import")}
          >
            Nhập từ Markdown
          </button>
          <button
            type="button"
            style={initMode === "outline" ? activeTabStyle : tabStyle}
            onClick={() => setInitMode("outline")}
          >
            Dàn ý AI
          </button>
        </div>
        
        <div style={formContainerStyle}>
          <div style={scrollAreaStyle}>
            {initMode === "template" && (
              <>
                <TemplatePicker
                  templates={templates}
                  value={selectedTemplateId}
                  onSelect={handleTemplateChange}
                />
                
                <div style={dividerStyle} />
                
                <MetadataForm
                  fields={visibleMetadataFields}
                  values={values}
                  onChange={handleFormChange}
                  onBlur={handleBlur}
                  errors={errors}
                />
              </>
            )}

            {initMode === "blank" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--rs-space-4)", padding: "var(--rs-space-8) var(--rs-space-4)", flex: 1, justifyContent: "center", alignItems: "center", textAlign: "center" }}>
                <p style={{ color: "var(--rs-color-text-muted)", fontSize: "var(--rs-font-size-sm)", margin: 0, maxWidth: "320px", lineHeight: 1.5 }}>
                  Bắt đầu soạn thảo ngay với một trang báo cáo trống và đặt tên tiêu đề sau trong Workspace.
                </p>
              </div>
            )}

            {initMode === "import" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--rs-space-4)", padding: "var(--rs-space-2) 0", flex: 1 }}>
                <MarkdownImportDropzone
                  imported={importedMarkdown}
                  onImported={handleMarkdownImported}
                />
              </div>
            )}

            {initMode === "outline" && (() => {
              const gatewayState = getGatewayState();
              const isReady = gatewayState === "ready";

              if (!isReady) {
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--rs-space-4)", padding: "var(--rs-space-6) var(--rs-space-4)", alignItems: "center", textAlign: "center" }}>
                    <div style={{ padding: "var(--rs-space-3)", borderRadius: "50%", backgroundColor: "var(--rs-color-warning-light, #fef3c7)", color: "var(--rs-color-warning)" }}>
                      <AlertTriangle size={24} />
                    </div>
                    <p style={{ color: "var(--rs-color-text-muted)", fontSize: "var(--rs-font-size-sm)", margin: 0, maxWidth: "340px", lineHeight: 1.5 }}>
                      Tính năng sinh dàn ý tự động yêu cầu Trợ lý AI hoạt động. Vui lòng bật AI và cấu hình khóa API.
                    </p>
                    <Button type="button" variant="primary" onClick={onOpenAiSettings}>
                      Cấu hình Trợ lý AI
                    </Button>
                  </div>
                );
              }

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--rs-space-4)", padding: "var(--rs-space-2) 0", flex: 1 }}>
                  {generatedSections.length === 0 ? (
                    <>
                      <div className="rs-form-group" style={{ display: "flex", flexDirection: "column", gap: "var(--rs-space-2)" }}>
                        <label style={{ fontSize: "var(--rs-font-size-sm)", fontWeight: "var(--rs-font-weight-medium)", color: "var(--rs-color-text)" }}>
                          Tiêu đề báo cáo
                        </label>
                        <input
                          type="text"
                          className="rs-input"
                          value={outlineTitle}
                          onChange={(e) => setOutlineTitle(e.target.value)}
                          placeholder="Ví dụ: Báo cáo Đồ án tốt nghiệp"
                          style={{
                            width: "100%",
                            padding: "var(--rs-space-2) var(--rs-space-3)",
                            borderRadius: "var(--rs-radius-md)",
                            border: "1px solid var(--rs-color-border)",
                            backgroundColor: "var(--rs-color-surface)",
                            color: "var(--rs-color-text)",
                            fontSize: "var(--rs-font-size-sm)",
                          }}
                        />
                      </div>

                      <div className="rs-form-group" style={{ display: "flex", flexDirection: "column", gap: "var(--rs-space-2)" }}>
                        <label style={{ fontSize: "var(--rs-font-size-sm)", fontWeight: "var(--rs-font-weight-medium)", color: "var(--rs-color-text)" }}>
                          Ý tưởng / Chủ đề dàn ý cần sinh
                        </label>
                        <textarea
                          className="rs-input"
                          rows={4}
                          value={outlineTopic}
                          onChange={(e) => setOutlineTopic(e.target.value)}
                          placeholder="Ví dụ: Báo cáo đồ án xây dựng trang web bán hàng quần áo thời trang bằng Next.js, có 5 chương gồm giới thiệu, phân tích thiết kế hệ thống, kiểm thử và kết luận."
                          style={{
                            width: "100%",
                            padding: "var(--rs-space-2) var(--rs-space-3)",
                            borderRadius: "var(--rs-radius-md)",
                            border: "1px solid var(--rs-color-border)",
                            backgroundColor: "var(--rs-color-surface)",
                            color: "var(--rs-color-text)",
                            fontSize: "var(--rs-font-size-sm)",
                            resize: "vertical",
                          }}
                        />
                      </div>

                      {aiError && (
                        <div style={{ display: "flex", gap: "var(--rs-space-2)", padding: "var(--rs-space-3)", borderRadius: "var(--rs-radius-md)", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--rs-color-danger)", fontSize: "var(--rs-font-size-sm)" }}>
                          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                          <span>{aiError}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--rs-space-3)" }}>
                      <div style={{ fontSize: "var(--rs-font-size-sm)", color: "var(--rs-color-text-muted)" }}>
                        Xem trước dàn ý đề xuất ({generatedSections.length} mục):
                      </div>
                      <div style={{
                        maxHeight: "220px",
                        overflowY: "auto",
                        border: "1px solid var(--rs-color-border)",
                        borderRadius: "var(--rs-radius-md)",
                        padding: "var(--rs-space-3)",
                        backgroundColor: "rgba(0, 0, 0, 0.02)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "var(--rs-space-2)"
                      }}>
                        {generatedSections.map((sec, idx) => (
                          <div key={sec.id} style={{
                            fontSize: "var(--rs-font-size-sm)",
                            padding: "var(--rs-space-2)",
                            borderRadius: "var(--rs-radius-sm)",
                            backgroundColor: "var(--rs-color-surface)",
                            border: "1px solid var(--rs-color-border)",
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--rs-space-2)"
                          }}>
                            <span style={{ color: "var(--rs-color-text-muted)", fontSize: "var(--rs-font-size-xs)" }}>#{idx + 1}</span>
                            <span style={{ fontWeight: "var(--rs-font-weight-medium)" }}>{sec.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          
          {initMode === "template" && (
            <div style={footerStyle}>
              <Button type="button" onClick={handleSubmitTemplate} variant="primary" fullWidth>
                Tạo báo cáo
              </Button>
            </div>
          )}

          {initMode === "blank" && (
            <div style={footerStyle}>
              <Button type="button" onClick={onStartBlank} variant="primary" fullWidth>
                Tạo tài liệu trống
              </Button>
            </div>
          )}

          {initMode === "import" && (
            <div style={footerStyle}>
              {importedMarkdown && (
                <>
                  <p style={helperStyle}>
                    <Lightbulb size={14} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "4px", color: "var(--rs-color-warning)" }} />
                    <span style={{ verticalAlign: "middle" }}>File Markdown của bạn sẽ được tự động phân tích thành các mục báo cáo tương ứng.</span>
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => onImportMarkdown(importedMarkdown)}
                    fullWidth
                  >
                    Nhập báo cáo
                  </Button>
                </>
              )}
              {!importedMarkdown && (
                <p style={{ ...helperStyle, textAlign: "center", width: "100%" }}>
                  Vui lòng chọn hoặc thả file Markdown ở trên để tiếp tục.
                </p>
              )}
            </div>
          )}

          {initMode === "outline" && getGatewayState() === "ready" && (
            <div style={footerStyle}>
              {generatedSections.length === 0 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleGenerateOutline}
                  disabled={isGenerating || !outlineTopic.trim()}
                  fullWidth
                >
                  {isGenerating ? "Đang tạo dàn ý..." : "Tạo dàn ý bằng AI"}
                </Button>
              ) : (
                <div style={{ display: "flex", gap: "var(--rs-space-2)", width: "100%" }}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setGeneratedSections([]);
                      setAiError("");
                    }}
                    style={{ flex: 1 }}
                  >
                    Tạo lại
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      if (onApplyAiOutline) {
                        onApplyAiOutline(generatedSections, outlineTitle || "Báo cáo từ AI");
                      }
                    }}
                    style={{ flex: 2 }}
                  >
                    Áp dụng dàn ý
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const containerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "calc(100vh - 50px)",
  backgroundColor: "var(--rs-color-bg)",
  padding: "var(--rs-space-6)",
};

const cardStyle = {
  width: "100%",
  maxWidth: "520px",
  maxHeight: "calc(100vh - 80px)",
  display: "flex",
  flexDirection: "column" as const,
  backgroundColor: "var(--rs-color-surface)",
  border: "1px solid var(--rs-color-border)",
  borderRadius: "var(--rs-radius-lg)",
  boxShadow: "var(--rs-elevation-1)",
  padding: "var(--rs-space-6)",
};

const headerStyle = {
  flexShrink: 0,
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

const formContainerStyle = {
  display: "flex",
  flexDirection: "column" as const,
  flex: 1,
  minHeight: 0,
  gap: "var(--rs-space-4)",
};

const scrollAreaStyle = {
  flex: 1,
  overflowY: "auto" as const,
  paddingRight: "var(--rs-space-2)",
  display: "flex",
  flexDirection: "column" as const,
  gap: "var(--rs-space-4)",
};

const dividerStyle = {
  height: "1px",
  backgroundColor: "var(--rs-color-border)",
  margin: "var(--rs-space-2) 0",
  flexShrink: 0,
};

const footerStyle = {
  flexShrink: 0,
  borderTop: "1px solid var(--rs-color-border)",
  paddingTop: "var(--rs-space-4)",
  marginTop: "var(--rs-space-2)",
  backgroundColor: "var(--rs-color-surface)",
  display: "flex",
  flexDirection: "column" as const,
  gap: "var(--rs-space-2)",
};

const helperStyle = {
  fontSize: "var(--rs-font-size-xs)",
  color: "var(--rs-color-text-muted)",
  margin: 0,
  lineHeight: 1.4,
};

const tabContainerStyle = {
  display: "flex",
  gap: "var(--rs-space-1)",
  backgroundColor: "var(--rs-color-surface-muted, #f1f5f9)",
  padding: "4px",
  borderRadius: "var(--rs-radius-md)",
  marginBottom: "var(--rs-space-4)",
  flexShrink: 0,
};

const tabStyle = {
  flex: 1,
  padding: "var(--rs-space-2) var(--rs-space-3)",
  border: "none",
  borderRadius: "var(--rs-radius-sm)",
  backgroundColor: "transparent",
  color: "var(--rs-color-text-muted)",
  fontSize: "var(--rs-font-size-xs)",
  fontWeight: "var(--rs-font-weight-medium)",
  cursor: "pointer",
  textAlign: "center" as const,
  transition: "all 0.15s ease",
};

const activeTabStyle = {
  ...tabStyle,
  backgroundColor: "var(--rs-color-surface)",
  color: "var(--rs-color-text)",
  boxShadow: "var(--rs-elevation-1)",
};
