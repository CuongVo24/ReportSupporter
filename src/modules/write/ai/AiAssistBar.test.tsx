// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AiRequestOptions, AiSuggestion, ReportSection } from "@/types";
import { contentHash } from "@/lib/content-hash";
import { registerAdapter } from "./ai-gateway";
import { saveAiConfig } from "./ai-config";
import { AiAssistBar } from "./AiAssistBar";

const request = vi.fn();

function section(markdown = "Bản gốc", revision = 0, id = "section-1"): ReportSection {
  return { id, order: 0, title: "Mở đầu", markdown, status: "draft", revision };
}

function openRewrite(): void {
  fireEvent.click(screen.getByRole("button", { name: /Trợ lý AI/i }));
  fireEvent.click(screen.getByRole("option", { name: /Viết lại đoạn/i }));
}

function suggestionFor(base: ReportSection, options: AiRequestOptions): AiSuggestion {
  return {
    id: options.requestId ?? "request",
    requestId: options.requestId,
    action: "rewrite",
    original: base.markdown,
    suggestion: "Bản đề xuất",
    projectId: options.context?.projectId,
    sectionId: base.id,
    baseRevision: base.revision,
    baseHash: contentHash(base.markdown),
  };
}

describe("AiAssistBar safety guards", () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveAiConfig({ enabled: true, provider: "openai", apiKey: "local-test-key" });
    request.mockReset();
    registerAdapter({ request });
  });
  afterEach(() => {
    cleanup();
    registerAdapter(null);
  });

  it("marks an out-of-date response stale and disables Apply", async () => {
    let resolveRequest!: (value: AiSuggestion) => void;
    let capturedOptions!: AiRequestOptions;
    const base = section();
    request.mockImplementation((_action, _input, options: AiRequestOptions) => {
      capturedOptions = options;
      return new Promise<AiSuggestion>((resolve) => { resolveRequest = resolve; });
    });

    const { rerender } = render(
      <AiAssistBar projectId="project-1" section={base} onChange={vi.fn()} />,
    );
    openRewrite();
    rerender(
      <AiAssistBar projectId="project-1" section={section("Người dùng đã sửa", 1)} onChange={vi.fn()} />,
    );

    await act(async () => resolveRequest(suggestionFor(base, capturedOptions)));
    expect(await screen.findByText(/Nội dung đã thay đổi trong khi AI xử lý/i)).toBeDefined();
    expect((screen.getByRole("button", { name: /Áp dụng đề xuất/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("aborts the active request when switching sections", async () => {
    let capturedSignal: AbortSignal | undefined;
    request.mockImplementation((_action, _input, options: AiRequestOptions) => {
      capturedSignal = options.signal;
      return new Promise<AiSuggestion>(() => {});
    });
    const { rerender } = render(
      <AiAssistBar projectId="project-1" section={section()} onChange={vi.fn()} />,
    );
    openRewrite();
    rerender(
      <AiAssistBar projectId="project-1" section={section("Khác", 0, "section-2")} onChange={vi.fn()} />,
    );
    await waitFor(() => expect(capturedSignal?.aborted).toBe(true));
  });

  it("creates a required snapshot before applying a current suggestion", async () => {
    const base = section();
    request.mockImplementation((_action, _input, options: AiRequestOptions) =>
      Promise.resolve({ suggestion: suggestionFor(base, options).suggestion }));
    const onBeforeApply = vi.fn().mockResolvedValue(undefined);
    const onChange = vi.fn();
    render(
      <AiAssistBar
        projectId="project-1"
        section={base}
        onChange={onChange}
        onBeforeApply={onBeforeApply}
      />,
    );
    openRewrite();
    const apply = await screen.findByRole("button", { name: /Áp dụng đề xuất/i });
    fireEvent.click(apply);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("Bản đề xuất"));
    expect(onBeforeApply).toHaveBeenCalledTimes(1);
    expect(onBeforeApply.mock.invocationCallOrder[0]).toBeLessThan(onChange.mock.invocationCallOrder[0]);
  });
});
