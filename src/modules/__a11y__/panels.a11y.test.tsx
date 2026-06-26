// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, cleanup } from "@testing-library/react";
import { axe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";
import "vitest-axe/extend-expect";
import { CheckerPanel } from "@/modules/check";
import { ExportPanel, SubmissionPanel } from "@/modules/export";
import { EvidencePanel } from "@/modules/evidence";
import { PresentPanel } from "@/modules/present";
import type { ReportProjectBundle, CheckResult } from "@/types";

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

const mockBundle: ReportProjectBundle = {
  project: {
    id: "test-proj",
    title: "Báo cáo thử nghiệm",
    templateId: "software-project",
    metadata: {
      school: "Đại học Công nghệ",
      members: ["Nguyễn Văn A"],
    },
    sections: [
      { id: "sec1", order: 0, title: "Mở đầu", markdown: "Nội dung mở đầu", status: "done" },
    ],
    updatedAt: "2026-06-24T22:00:00.000Z",
  },
  assets: [],
  evidence: [],
  formatSettings: {
    presetId: "academic-default",
    includeToc: true,
    includeListOfFigures: true,
    includeListOfTables: true,
    captionNumbering: "continuous",
  },
  schemaVersion: 1,
};

const mockCheck: CheckResult = {
  issues: [
    {
      id: "issue1",
      severity: "warning",
      module: "check",
      message: "Heading level skipped",
      suggestion: "Sửa cấp tiêu đề",
      sectionId: "sec1",
      line: 1,
    }
  ],
  grouped: {
    error: [],
    warning: [
      {
        id: "issue1",
        severity: "warning",
        module: "check",
        message: "Heading level skipped",
        suggestion: "Sửa cấp tiêu đề",
        sectionId: "sec1",
        line: 1,
      }
    ],
    info: [],
  },
  readinessScore: 85,
  ranAt: "2026-06-24T22:00:00.000Z",
};

describe("Feature Panels a11y", () => {
  it("CheckerPanel has no critical a11y violations", async () => {
    const { container } = render(
      <CheckerPanel
        result={mockCheck}
        onRun={() => {}}
        onJump={() => {}}
        hasRun={true}
      />
    );
    await assertNoViolations(container);
  });

  it("ExportPanel has no critical a11y violations", async () => {
    const { container } = render(
      <ExportPanel
        bundle={mockBundle}
        check={mockCheck}
        jobs={[]}
        runExport={async () => {}}
        retry={async () => {}}
      />
    );
    await assertNoViolations(container);
  });

  it("SubmissionPanel has no critical a11y violations", async () => {
    const { container } = render(
      <SubmissionPanel
        bundle={mockBundle}
        check={mockCheck}
        exportedBlobs={{}}
        jobs={[]}
      />
    );
    await assertNoViolations(container);
  });

  it("EvidencePanel has no critical a11y violations", async () => {
    const { container } = render(
      <EvidencePanel
        evidence={[]}
        onChange={() => {}}
      />
    );
    await assertNoViolations(container);
  });

  it("PresentPanel has no critical a11y violations", async () => {
    const { container } = render(
      <PresentPanel
        bundle={mockBundle}
        checkResult={mockCheck}
      />
    );
    await assertNoViolations(container);
  });
});
