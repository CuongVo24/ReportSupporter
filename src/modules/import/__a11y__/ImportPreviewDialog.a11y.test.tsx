// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, cleanup } from "@testing-library/react";
import { axe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";
import "vitest-axe/extend-expect";
import { ImportPreviewDialog } from "../ImportPreviewDialog";
import type { ImportDraft } from "@/types";

vi.mock("@/modules/evidence", () => ({
  buildEvidenceAppendix: vi.fn().mockReturnValue({ type: "root", children: [] }),
  toQrDataUrl: vi.fn().mockResolvedValue("data:image/png;base64,mock"),
  injectQrImages: vi.fn().mockImplementation((node) => node),
}));

vi.mock("@/components/PreviewPane", () => ({
  PreviewPane: ({ markdown }: { markdown: string }) => <div data-testid="preview-pane">{markdown}</div>,
}));

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
  }
});

async function assertNoViolations(container: HTMLElement) {
  const results = await axe(container, {
    rules: {
      "color-contrast": { enabled: false },
    },
  });
  (expect(results) as unknown as { toHaveNoViolations: () => void }).toHaveNoViolations();
}

describe("ImportPreviewDialog A11y", () => {
  const mockDrafts: ImportDraft[] = [
    {
      result: {
        sourceFormat: "markdown",
        fileName: "doc1.md",
        markdown: "# Heading 1\nSome text.",
        assets: [],
        warnings: [],
        convertedAt: new Date().toISOString(),
      },
      sections: [
        {
          id: "sec-0",
          order: 0,
          title: "Heading 1",
          markdown: "# Heading 1\nSome text.",
          status: "draft",
          revision: 0,
        },
      ],
      mode: "append",
    },
  ];

  it("should have no critical a11y violations when open", async () => {
    const { container } = render(
      <ImportPreviewDialog
        isOpen={true}
        onOpenChange={() => {}}
        drafts={mockDrafts}
        onCommit={() => {}}
        onCancel={() => {}}
      />
    );
    await assertNoViolations(container);
  });
});
