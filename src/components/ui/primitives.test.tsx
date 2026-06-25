// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Button, Badge, Input, Textarea, Select, Dialog, Toast, ToastProvider, ToastViewport, Tabs, TabsList, TabsTrigger, TabsContent } from "./index";

afterEach(cleanup);

// Polyfill mock for Radix UI Select in jsdom
beforeEach(() => {
  if (typeof window !== "undefined") {
    if (!window.ResizeObserver) {
      window.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }

    // Mock HTMLElement.prototype.scrollIntoView if needed by Radix
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  }
});

describe("UI Primitives", () => {
  describe("Button component", () => {
    it("renders children text", () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole("button", { name: "Click me" })).toBeDefined();
    });

    it("supports different variants", () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole("button").className).toContain("ws-btn-primary");

      rerender(<Button variant="danger">Danger</Button>);
      expect(screen.getByRole("button").className).toContain("ws-btn-danger");
    });

    it("prevents click when disabled or loading", () => {
      const onClick = vi.fn();
      render(<Button disabled onClick={onClick}>Disabled</Button>);
      fireEvent.click(screen.getByRole("button"));
      expect(onClick).not.toHaveBeenCalled();
    });

    it("shows loading spinner and locks click", () => {
      const onClick = vi.fn();
      render(<Button loading onClick={onClick}>Loading</Button>);
      const button = screen.getByRole("button");
      expect(button.getAttribute("aria-busy")).toBe("true");
      expect(button.className).toContain("ws-btn-loading");
      fireEvent.click(button);
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("Badge component", () => {
    it("renders severity correctly", () => {
      render(<Badge group="severity" value="error" />);
      expect(screen.getByText("Lỗi")).toBeDefined();
    });

    it("renders status correctly", () => {
      render(<Badge group="status" value="draft" />);
      expect(screen.getByText("Nháp")).toBeDefined();
    });

    it("supports clickable badge with custom click handler", () => {
      const onClick = vi.fn();
      render(<Badge group="readiness" value="good" clickable onClick={onClick} />);
      const badge = screen.getByRole("button");
      fireEvent.click(badge);
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe("Input component", () => {
    it("renders label and associates with input", () => {
      render(<Input label="Họ tên" placeholder="Nhập tên" />);
      expect(screen.getByLabelText("Họ tên")).toBeDefined();
    });

    it("handles invalid state", () => {
      render(<Input label="Email" error="Email không hợp lệ" />);
      const input = screen.getByLabelText("Email");
      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(screen.getByRole("alert").textContent).toContain("Email không hợp lệ");
    });
  });

  describe("Textarea component", () => {
    it("renders and supports custom onChange", () => {
      const onChange = vi.fn();
      render(<Textarea label="Mô tả" onChange={onChange} />);
      const textarea = screen.getByLabelText("Mô tả");
      fireEvent.change(textarea, { target: { value: "Hello" } });
      expect(onChange).toHaveBeenCalled();
    });

    it("displays character count when maxLength is set", () => {
      render(<Textarea label="Ghi chú" maxLength={100} showCharCount />);
      expect(screen.getByText("0/100")).toBeDefined();
    });
  });

  describe("Select component", () => {
    const options = [
      { value: "a4", label: "Khổ giấy A4" },
      { value: "a5", label: "Khổ giấy A5" },
    ];

    it("renders trigger and options list", () => {
      render(<Select label="Kích thước" options={options} defaultValue="a4" />);
      expect(screen.getByText("Khổ giấy A4")).toBeDefined();
    });
  });

  describe("Dialog component", () => {
    it("renders title and children when open", () => {
      const onOpenChange = vi.fn();
      render(
        <Dialog isOpen={true} onOpenChange={onOpenChange} title="Cấu hình xuất PDF">
          <div>Nội dung Dialog</div>
        </Dialog>
      );
      expect(screen.getByText("Cấu hình xuất PDF")).toBeDefined();
      expect(screen.getByText("Nội dung Dialog")).toBeDefined();
    });

    it("triggers onOpenChange when close button is clicked", () => {
      const onOpenChange = vi.fn();
      render(
        <Dialog isOpen={true} onOpenChange={onOpenChange} title="Tiêu đề">
          <div>Body</div>
        </Dialog>
      );
      const closeBtn = screen.getByRole("button", { name: "Đóng" });
      fireEvent.click(closeBtn);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Toast component", () => {
    it("renders toast title and description", () => {
      render(
        <ToastProvider>
          <ToastViewport />
          <Toast open={true} variant="success" title="Thành công" description="Đã lưu báo cáo" />
        </ToastProvider>
      );
      expect(screen.getByText("Thành công")).toBeDefined();
      expect(screen.getByText("Đã lưu báo cáo")).toBeDefined();
    });
  });

  describe("Tabs component", () => {
    it("renders tabs and toggles content active state", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" count={5}>Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Nội dung 1</TabsContent>
          <TabsContent value="tab2">Nội dung 2</TabsContent>
        </Tabs>
      );
      expect(screen.getByText("Nội dung 1")).toBeDefined();
      expect(screen.queryByText("Nội dung 2")).toBeNull();
      expect(screen.getByText("5")).toBeDefined();

      const tab2Trigger = screen.getByRole("tab", { name: "Tab 2" });
      fireEvent.mouseDown(tab2Trigger);
      fireEvent.mouseUp(tab2Trigger);
      fireEvent.click(tab2Trigger);
      expect(screen.getByText("Nội dung 2")).toBeDefined();
    });
  });
});
