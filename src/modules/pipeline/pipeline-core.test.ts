import { describe, expect, it } from "vitest";
import { executePipelineRequest } from "./pipeline-core";

describe("pipeline worker core", () => {
  it("returns request/project revisions with parsed preview results", async () => {
    const response = await executePipelineRequest({
      requestId: "request-1",
      projectId: "project-1",
      operation: "preview",
      sectionRevisions: { "section-1": 3 },
      cacheKey: "project-1:3:format:assets",
      payload: {
        parts: ["# Heading", "```mermaid\ngraph TD; A-->B\n```"],
        sections: [{ id: "section-1", markdown: "# Heading" }],
        assets: [],
      },
    });
    expect(response.ok).toBe(true);
    expect(response.sectionRevisions).toEqual({ "section-1": 3 });
    if (response.ok && response.operation === "preview") {
      expect(response.result.parsedParts[0].ast?.type).toBe("root");
      expect(response.result.parsedParts[1].isMermaid).toBe(true);
    }
  });
});
