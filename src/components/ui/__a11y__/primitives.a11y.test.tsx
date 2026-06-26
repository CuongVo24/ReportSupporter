// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, cleanup } from "@testing-library/react";
import { axe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";
import "vitest-axe/extend-expect";
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
  TabsContent
} from "../index";

expect.extend(matchers);

afterEach(cleanup);

beforeEach(() => {
  if (typeof window !== "undefined") {
    if (!window.ResizeObserver) {
      window.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    window.HTMLElement.prototype.releasePointerCapture = vi.fn();
    window.HTMLElement.prototype.hasPointerCapture = vi.fn();
  }
});

async function assertNoViolations(container: HTMLElement) {
  const results = await axe(container);
  (expect(results) as unknown as { toHaveNoViolations: () => void }).toHaveNoViolations();
}

describe("UI Primitives a11y", () => {
  it("Button has no critical a11y violations", async () => {
    const { container } = render(<Button>Click me</Button>);
    await assertNoViolations(container);
  });

  it("Badge has no critical a11y violations", async () => {
    const { container } = render(<Badge group="severity" value="error" />);
    await assertNoViolations(container);
  });

  it("Badge (clickable) has no critical a11y violations", async () => {
    const { container } = render(<Badge group="readiness" value="good" clickable onClick={() => {}} />);
    await assertNoViolations(container);
  });

  it("Input has no critical a11y violations", async () => {
    const { container } = render(<Input label="Họ tên" placeholder="Nhập tên" />);
    await assertNoViolations(container);
  });

  it("Textarea has no critical a11y violations", async () => {
    const { container } = render(<Textarea label="Mô tả" placeholder="Nhập mô tả" />);
    await assertNoViolations(container);
  });

  it("Select has no critical a11y violations", async () => {
    const options = [
      { value: "1", label: "Option 1" },
      { value: "2", label: "Option 2" },
    ];
    const { container } = render(<Select label="Lựa chọn" options={options} value="1" onValueChange={() => {}} />);
    await assertNoViolations(container);
  });

  it("Dialog has no critical a11y violations", async () => {
    const { container } = render(
      <Dialog
        isOpen={true}
        onOpenChange={() => {}}
        title="Tiêu đề Dialog"
        description="Mô tả Dialog"
        footer={<button>Đóng</button>}
      >
        <div>Nội dung Dialog</div>
      </Dialog>
    );
    await assertNoViolations(container);
  });

  it("Toast has no critical a11y violations", async () => {
    const { container } = render(
      <ToastProvider>
        <Toast open={true} onOpenChange={() => {}} title="Tiêu đề Toast" description="Mô tả Toast" />
        <ToastViewport />
      </ToastProvider>
    );
    await assertNoViolations(container);
  });

  it("Tabs has no critical a11y violations", async () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Nội dung 1</TabsContent>
        <TabsContent value="tab2">Nội dung 2</TabsContent>
      </Tabs>
    );
    await assertNoViolations(container);
  });
});
