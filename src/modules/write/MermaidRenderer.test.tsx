// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MermaidRenderer } from "./MermaidRenderer";

const mermaidMocks = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn().mockResolvedValue({ svg: "<svg><text>safe</text></svg>" }),
}));

vi.mock("mermaid", () => ({ default: mermaidMocks }));

describe("MermaidRenderer security", () => {
  it("initializes Mermaid in strict mode with HTML labels disabled", async () => {
    render(<MermaidRenderer code={'graph TD; A["<img onerror=alert(1)>"] --> B'} />);

    await waitFor(() => expect(mermaidMocks.initialize).toHaveBeenCalled());
    expect(mermaidMocks.initialize).toHaveBeenCalledWith(expect.objectContaining({
      securityLevel: "strict",
      flowchart: { htmlLabels: false },
    }));
  });
});
