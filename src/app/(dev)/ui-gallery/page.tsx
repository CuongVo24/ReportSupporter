"use client";

import React, { useState } from "react";
import {
  Button,
  Badge,
  Input,
  Textarea,
  Select,
  Dialog,
  Toast,
  ToastProvider,
  ToastViewport,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui";
import { Mail, Settings, AlertCircle } from "lucide-react";

export default function UiGalleryPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastVariant, setToastVariant] = useState<"success" | "info" | "error">("success");
  const [selectValue, setSelectValue] = useState("");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const triggerToast = (variant: "success" | "info" | "error") => {
    setToastVariant(variant);
    setToastOpen(true);
  };

  return (
    <ToastProvider>
      <div
        data-theme={theme}
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--rs-color-bg)",
          color: "var(--rs-color-text)",
          padding: "var(--rs-space-6)",
          fontFamily: "var(--rs-font-family-ui)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--rs-space-8)", borderBottom: "1px solid var(--rs-color-border)", paddingBottom: "var(--rs-space-4)" }}>
          <div>
            <h1 style={{ fontSize: "var(--rs-font-size-xl)", fontWeight: "var(--rs-font-weight-bold)", margin: 0 }}>UI Component Gallery</h1>
            <p style={{ fontSize: "var(--rs-font-size-sm)", color: "var(--rs-color-text-muted)", margin: "4px 0 0 0" }}>Dev-only gate for visually validating ReportSupporter components</p>
          </div>
          <Button onClick={toggleTheme} variant="secondary">
            Switch to {theme === "light" ? "Dark" : "Light"} Mode
          </Button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--rs-space-8)" }}>
          {/* Column 1: Primitives & Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--rs-space-6)" }}>
            {/* Buttons */}
            <div style={{ padding: "var(--rs-space-4)", backgroundColor: "var(--rs-color-surface)", borderRadius: "var(--rs-radius-md)", border: "1px solid var(--rs-color-border)" }}>
              <h2 style={{ fontSize: "var(--rs-font-size-lg)", fontWeight: "var(--rs-font-weight-bold)", margin: "0 0 var(--rs-space-4) 0" }}>Buttons</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--rs-space-2)", marginBottom: "var(--rs-space-4)" }}>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--rs-space-2)", alignItems: "center" }}>
                <Button size="sm" variant="primary">Small</Button>
                <Button loading variant="primary">Loading</Button>
                <Button disabled variant="primary">Disabled</Button>
                <Button iconOnly variant="secondary" aria-label="Settings"><Settings size={16} /></Button>
              </div>
            </div>

            {/* Badges */}
            <div style={{ padding: "var(--rs-space-4)", backgroundColor: "var(--rs-color-surface)", borderRadius: "var(--rs-radius-md)", border: "1px solid var(--rs-color-border)" }}>
              <h2 style={{ fontSize: "var(--rs-font-size-lg)", fontWeight: "var(--rs-font-weight-bold)", margin: "0 0 var(--rs-space-4) 0" }}>Badges</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--rs-space-2)", marginBottom: "var(--rs-space-4)" }}>
                <Badge group="severity" value="error" />
                <Badge group="severity" value="warning" />
                <Badge group="severity" value="info" />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--rs-space-2)" }}>
                <Badge group="readiness" value="good" />
                <Badge group="readiness" value="medium" />
                <Badge group="status" value="draft" />
                <Badge group="status" value="review" />
                <Badge group="status" value="done" />
              </div>
            </div>

            {/* Tabs */}
            <div style={{ padding: "var(--rs-space-4)", backgroundColor: "var(--rs-color-surface)", borderRadius: "var(--rs-radius-md)", border: "1px solid var(--rs-color-border)" }}>
              <h2 style={{ fontSize: "var(--rs-font-size-lg)", fontWeight: "var(--rs-font-weight-bold)", margin: "0 0 var(--rs-space-4) 0" }}>Tabs</h2>
              <Tabs defaultValue="tab1">
                <TabsList>
                  <TabsTrigger value="tab1" count={3} countVariant="error">Underline 1</TabsTrigger>
                  <TabsTrigger value="tab2">Underline 2</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1" style={{ paddingTop: "var(--rs-space-4)" }}>Content Underline Tab 1</TabsContent>
                <TabsContent value="tab2" style={{ paddingTop: "var(--rs-space-4)" }}>Content Underline Tab 2</TabsContent>
              </Tabs>
              
              <Tabs defaultValue="tab1" variant="segmented" style={{ marginTop: "var(--rs-space-4)" }}>
                <TabsList>
                  <TabsTrigger value="tab1">Seg 1</TabsTrigger>
                  <TabsTrigger value="tab2">Seg 2</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1" style={{ paddingTop: "var(--rs-space-4)" }}>Content Segmented Tab 1</TabsContent>
                <TabsContent value="tab2" style={{ paddingTop: "var(--rs-space-4)" }}>Content Segmented Tab 2</TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Column 2: Form & Overlays */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--rs-space-6)" }}>
            {/* Fields */}
            <div style={{ padding: "var(--rs-space-4)", backgroundColor: "var(--rs-color-surface)", borderRadius: "var(--rs-radius-md)", border: "1px solid var(--rs-color-border)", display: "flex", flexDirection: "column", gap: "var(--rs-space-4)" }}>
              <h2 style={{ fontSize: "var(--rs-font-size-lg)", fontWeight: "var(--rs-font-weight-bold)", margin: 0 }}>Form Fields</h2>
              <Input label="Họ tên" placeholder="Ví dụ: Nguyễn Văn A" leadingIcon={<Mail size={16} />} />
              <Input label="Mật khẩu" placeholder="Mật khẩu ít nhất 8 ký tự" error="Mật khẩu quá ngắn" />
              
              <Textarea label="Mô tả dự án" placeholder="Nhập tóm tắt..." maxLength={150} showCharCount autoGrow />
              
              <Select
                label="Mẫu báo cáo"
                value={selectValue}
                onValueChange={setSelectValue}
                options={[
                  { value: "technical", label: "Báo cáo kỹ thuật chuẩn" },
                  { value: "internship", label: "Báo cáo thực tập tốt nghiệp" },
                ]}
              />
            </div>

            {/* Overlays */}
            <div style={{ padding: "var(--rs-space-4)", backgroundColor: "var(--rs-color-surface)", borderRadius: "var(--rs-radius-md)", border: "1px solid var(--rs-color-border)" }}>
              <h2 style={{ fontSize: "var(--rs-font-size-lg)", fontWeight: "var(--rs-font-weight-bold)", margin: "0 0 var(--rs-space-4) 0" }}>Overlays</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--rs-space-2)", marginBottom: "var(--rs-space-4)" }}>
                <Button onClick={() => setIsDialogOpen(true)} variant="secondary">Open Modal</Button>
                <Button onClick={() => setIsDrawerOpen(true)} variant="secondary">Open Drawer</Button>
                <Button onClick={() => setIsConfirmOpen(true)} variant="danger">Open Confirm</Button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--rs-space-2)" }}>
                <Button onClick={() => triggerToast("success")} variant="secondary">Toast Success</Button>
                <Button onClick={() => triggerToast("info")} variant="secondary">Toast Info</Button>
                <Button onClick={() => triggerToast("error")} variant="secondary">Toast Error</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Dialog Modal */}
        <Dialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} title="Cấu hình xuất báo cáo" description="Chọn các mục muốn đính kèm trong tệp in" footer={<><Button onClick={() => setIsDialogOpen(false)} variant="ghost">Hủy</Button><Button onClick={() => setIsDialogOpen(false)} variant="primary">Lưu</Button></>}>
          <div style={{ padding: "var(--rs-space-2) 0" }}><p>Nội dung cấu hình xuất bản tài liệu...</p></div>
        </Dialog>

        {/* Dialog Drawer */}
        <Dialog isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen} variant="drawer" title="Chi tiết lỗi tìm kiếm" description="Thông tin chi tiết về heading bị nhảy cấp" footer={<Button onClick={() => setIsDrawerOpen(false)} variant="primary" fullWidth>Đã hiểu</Button>}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--rs-space-3)", padding: "var(--rs-space-2) 0" }}>
            <Badge group="severity" value="warning" />
            <p>Lỗi phát hiện ở Chương 2, Mục 2.3: Heading 3 trực tiếp đi sau Heading 1 mà không có Heading 2 ở giữa.</p>
          </div>
        </Dialog>

        {/* Dialog Confirm */}
        <Dialog isOpen={isConfirmOpen} onOpenChange={setIsConfirmOpen} variant="confirm" title="Xóa tài liệu?" description="Thao tác này không thể hoàn tác. Toàn bộ nội dung của chương này sẽ bị mất." footer={<><Button onClick={() => setIsConfirmOpen(false)} variant="ghost">Hủy</Button><Button onClick={() => setIsConfirmOpen(false)} variant="danger">Xác nhận xóa</Button></>}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--rs-space-2)", color: "var(--rs-color-severity-error)" }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: "var(--rs-font-size-sm)", fontWeight: "var(--rs-font-weight-medium)" }}>Hành động nguy hiểm</span>
          </div>
        </Dialog>

        {/* Toast Notification */}
        <Toast open={toastOpen} onOpenChange={setToastOpen} variant={toastVariant} title={toastVariant === "success" ? "Lưu thành công" : toastVariant === "info" ? "Thông tin mới" : "Có lỗi xảy ra"} description={toastVariant === "success" ? "Toàn bộ tiến trình soạn thảo đã được sao lưu" : toastVariant === "info" ? "Hệ thống đang chuẩn bị tài nguyên xuất bản" : "Không thể đồng bộ dữ liệu với bộ nhớ cục bộ"} action={toastVariant === "success" ? { label: "Hoàn tác", onClick: () => alert("Đã hoàn tác!") } : undefined} />
        <ToastViewport />
      </div>
    </ToastProvider>
  );
}
