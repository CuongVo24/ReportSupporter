import { describe, it, expect } from "vitest";
import { createEditorState, markdownHighlightStyle } from "./editor-setup";

describe("editor-setup", () => {
  it("should create editor state with markdown highlight extensions", () => {
    const state = createEditorState({
      doc: "## Hello World\n**bold text**",
      onChange: () => {},
    });

    expect(state.doc.toString()).toBe("## Hello World\n**bold text**");
    expect(markdownHighlightStyle).toBeDefined();
    expect(state.facet).toBeDefined();
  });
});
