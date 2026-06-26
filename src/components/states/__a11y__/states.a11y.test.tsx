// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import React from "react";
import { render, cleanup } from "@testing-library/react";
import { axe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";
import "vitest-axe/extend-expect";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  LoadingState,
  SuccessState
} from "../index";

expect.extend(matchers);

afterEach(cleanup);

async function assertNoViolations(container: HTMLElement) {
  const results = await axe(container);
  (expect(results) as unknown as { toHaveNoViolations: () => void }).toHaveNoViolations();
}

describe("States Components a11y", () => {
  it("EmptyState has no critical a11y violations", async () => {
    const { container } = render(<EmptyState title="Tiêu đề" message="Mô tả tin nhắn" />);
    await assertNoViolations(container);
  });

  it("ErrorState has no critical a11y violations", async () => {
    const { container } = render(<ErrorState message="Lỗi xảy ra" actionLabel="Thử lại" onAction={() => {}} />);
    await assertNoViolations(container);
  });

  it("LoadingSkeleton has no critical a11y violations", async () => {
    const { container } = render(<LoadingSkeleton variant="panel" />);
    await assertNoViolations(container);
  });

  it("LoadingState has no critical a11y violations", async () => {
    const { container } = render(<LoadingState message="Đang xử lý..." />);
    await assertNoViolations(container);
  });

  it("SuccessState has no critical a11y violations", async () => {
    const { container } = render(<SuccessState message="Thành công" actionLabel="Xong" onAction={() => {}} />);
    await assertNoViolations(container);
  });
});
