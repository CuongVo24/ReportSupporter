// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { SuggestionDiff } from "./SuggestionDiff";

afterEach(cleanup);

describe("SuggestionDiff Component", () => {
  it("renders side-by-side texts and default title", () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();

    render(
      <SuggestionDiff
        original="Original content"
        suggestion="AI suggested content"
        onAccept={onAccept}
        onReject={onReject}
      />
    );

    expect(screen.getByText("So sánh đề xuất thay đổi")).toBeDefined();
    expect(screen.getByText("Original content")).toBeDefined();
    expect(screen.getByText("AI suggested content")).toBeDefined();
  });

  it("renders dynamic title based on action", () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();

    const { rerender } = render(
      <SuggestionDiff
        original="Original content"
        suggestion="AI suggested content"
        onAccept={onAccept}
        onReject={onReject}
        action="tone"
      />
    );
    expect(screen.getByText("Cải thiện văn phong học thuật")).toBeDefined();

    rerender(
      <SuggestionDiff
        original="Original content"
        suggestion="AI suggested content"
        onAccept={onAccept}
        onReject={onReject}
        action="rewrite"
      />
    );
    expect(screen.getByText("So sánh đề xuất viết lại")).toBeDefined();
  });

  it("disables the Accept button when suggestion is empty or identical to original", () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();

    // Case 1: Empty suggestion
    const { rerender } = render(
      <SuggestionDiff
        original="Original content"
        suggestion=""
        onAccept={onAccept}
        onReject={onReject}
      />
    );

    const acceptBtn = screen.getByRole("button", { name: /Áp dụng đề xuất/i }) as HTMLButtonElement;
    expect(acceptBtn.disabled).toBe(true);

    fireEvent.click(acceptBtn);
    expect(onAccept).not.toHaveBeenCalled();

    // Case 2: Suggestion is identical to original
    rerender(
      <SuggestionDiff
        original="Original content"
        suggestion="Original content"
        onAccept={onAccept}
        onReject={onReject}
      />
    );
    expect(acceptBtn.disabled).toBe(true);

    fireEvent.click(acceptBtn);
    expect(onAccept).not.toHaveBeenCalled();
  });

  it("enables Accept button and triggers callback when suggestion is valid and changed", () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();

    render(
      <SuggestionDiff
        original="Original content"
        suggestion="AI suggested content"
        onAccept={onAccept}
        onReject={onReject}
      />
    );

    const acceptBtn = screen.getByRole("button", { name: /Áp dụng đề xuất/i }) as HTMLButtonElement;
    expect(acceptBtn.disabled).toBe(false);

    fireEvent.click(acceptBtn);
    expect(onAccept).toHaveBeenCalledWith("AI suggested content");
  });

  it("triggers onReject callback on Reject button click", () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();

    render(
      <SuggestionDiff
        original="Original"
        suggestion="Suggestion"
        onAccept={onAccept}
        onReject={onReject}
      />
    );

    const rejectBtn = screen.getByRole("button", { name: /Bỏ qua/i });
    fireEvent.click(rejectBtn);

    expect(onReject).toHaveBeenCalled();
  });
});
