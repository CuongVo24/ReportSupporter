import { describe, it, expect, vi, beforeEach } from "vitest";
import { useExport } from "./use-export";
import type { ReportProjectBundle, ExportJob } from "@/types";
import { exportHtml } from "./export-html";
import { exportDocx, packDocx } from "./export-docx";
import type { Document } from "docx";

// Shared state array that useState will return.
// We mutate this in-place so closures referencing it see updates.
let jobsArray: ExportJob[] = [];
const mockSetJobs = vi.fn((updater: unknown) => {
  let next: ExportJob[];
  if (typeof updater === "function") {
    next = updater(jobsArray);
  } else {
    next = updater as ExportJob[];
  }
  jobsArray.length = 0;
  jobsArray.push(...next);
});

vi.mock("react", () => ({
  useState: <T>(initial: T) => {
    jobsArray = [...(initial as unknown as ExportJob[])];
    return [jobsArray, mockSetJobs];
  },
  useCallback: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

vi.mock("./export-html", () => ({
  exportHtml: vi.fn(),
}));

vi.mock("./export-pdf", () => ({
  exportPdf: vi.fn(),
}));

vi.mock("./export-docx", () => ({
  exportDocx: vi.fn(),
  packDocx: vi.fn(),
}));

describe("useExport hook logic", () => {
  const mockBundle = {
    project: {
      id: "proj-1",
      title: "Test Report Title",
      sections: [],
    },
  } as unknown as ReportProjectBundle;

  beforeEach(() => {
    vi.clearAllMocks();
    jobsArray.length = 0;
  });

  it("should initialize hook and run HTML export successfully", async () => {
    const mockBlob = new Blob(["html content"], { type: "text/html" });
    vi.mocked(exportHtml).mockReturnValue({ ok: true, blob: mockBlob });

    const { runExport } = useExport();

    await runExport("html", mockBundle);

    expect(jobsArray).toHaveLength(1);
    expect(jobsArray[0].status).toBe("done");
    expect(jobsArray[0].target).toBe("html");
    expect(jobsArray[0].fileName).toBe("test-report-title.html");
    expect(exportHtml).toHaveBeenCalledWith(mockBundle);
  });

  it("should transition HTML export lifecycle to error state on failure", async () => {
    const mockError = { stage: "render-html" as const, message: "Export failed", recoverable: true };
    vi.mocked(exportHtml).mockReturnValue({ ok: false, error: mockError });

    const { runExport } = useExport();

    await runExport("html", mockBundle);

    expect(jobsArray).toHaveLength(1);
    expect(jobsArray[0].status).toBe("error");
    expect(jobsArray[0].error).toEqual(mockError);
  });

  it("should handle DOCX export with async packDocx pack step", async () => {
    const mockDoc = { docData: "mock" } as unknown as Document;
    const mockBlob = new Blob(["docx zip content"]);
    
    vi.mocked(exportDocx).mockReturnValue({ ok: true, doc: mockDoc });
    vi.mocked(packDocx).mockResolvedValue(mockBlob);

    const { runExport } = useExport();

    await runExport("docx", mockBundle);

    expect(jobsArray).toHaveLength(1);
    expect(jobsArray[0].status).toBe("done");
    expect(exportDocx).toHaveBeenCalledWith(mockBundle);
    expect(packDocx).toHaveBeenCalledWith(mockDoc);
  });

  it("should handle DOCX packing failure and transition to error", async () => {
    const mockDoc = { docData: "mock" } as unknown as Document;
    vi.mocked(exportDocx).mockReturnValue({ ok: true, doc: mockDoc });
    vi.mocked(packDocx).mockRejectedValue(new Error("Zip compression failed"));

    const { runExport } = useExport();

    await runExport("docx", mockBundle);

    expect(jobsArray).toHaveLength(1);
    expect(jobsArray[0].status).toBe("error");
    expect(jobsArray[0].error?.stage).toBe("render-docx");
    expect(jobsArray[0].error?.message).toBe("Zip compression failed");
  });

  it("should support retrying a failed job", async () => {
    const mockError = { stage: "render-html" as const, message: "Network error", recoverable: true };
    vi.mocked(exportHtml).mockReturnValueOnce({ ok: false, error: mockError });

    const { runExport, retry } = useExport(mockBundle);

    // First attempt: fail
    await runExport("html", mockBundle);
    expect(jobsArray).toHaveLength(1);
    expect(jobsArray[0].status).toBe("error");

    // Mock success for retry
    const mockBlob = new Blob(["retry success content"]);
    vi.mocked(exportHtml).mockReturnValueOnce({ ok: true, blob: mockBlob });

    // Trigger retry
    const jobId = jobsArray[0].id;
    await retry(jobId);

    expect(jobsArray).toHaveLength(1);
    expect(jobsArray[0].status).toBe("done");
    expect(jobsArray[0].error).toBeUndefined();
    expect(exportHtml).toHaveBeenCalledTimes(2);
  });
});
