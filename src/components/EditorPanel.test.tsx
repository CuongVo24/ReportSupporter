// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import React, { useState } from "react";
import { render, screen, act } from "@testing-library/react";
import { EditorPanel } from "./EditorPanel";

// Mock ResizeObserver
beforeEach(() => {
  if (typeof window !== "undefined") {
    if (!window.Range.prototype.getClientRects) {
      window.Range.prototype.getClientRects = () => ({
        length: 0,
        item: () => null,
        [Symbol.iterator]: function* () {},
      } as unknown as DOMRectList);
    }
    if (!window.Range.prototype.getBoundingClientRect) {
      window.Range.prototype.getBoundingClientRect = () => ({
        bottom: 0, height: 0, left: 0, right: 0, top: 0, width: 0, x: 0, y: 0, toJSON: () => {}
      } as DOMRect);
    }
    if (!window.ResizeObserver) {
      window.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }
  }
});

// A wrapper component to simulate section switching
function TestWorkspace() {
  const [activeSection, setActiveSection] = useState("A");
  const [sections, setSections] = useState<Record<string, string>>({
    A: "Content of Section A",
    B: "Content of Section B",
  });

  const handleChange = (newValue: string) => {
    setSections((prev) => ({
      ...prev,
      [activeSection]: newValue,
    }));
  };

  return (
    <div>
      <div data-testid="section-value">{sections[activeSection]}</div>
      <button data-testid="switch-to-a" onClick={() => setActiveSection("A")}>Go A</button>
      <button data-testid="switch-to-b" onClick={() => setActiveSection("B")}>Go B</button>
      <EditorPanel
        value={sections[activeSection]}
        onChange={handleChange}
        ariaLabel="markdown-editor"
      />
    </div>
  );
}

describe("EditorPanel Stale Callback Regression Test", () => {
  it("maintains separate section contents when switching sections", async () => {
    render(<TestWorkspace />);

    // Initially active section is A
    expect(screen.getByTestId("section-value").textContent).toBe("Content of Section A");

    // Switch to section B
    await act(async () => {
      screen.getByTestId("switch-to-b").click();
    });
    
    // Value should sync to B's content
    expect(screen.getByTestId("section-value").textContent).toBe("Content of Section B");

    // Switch back to A
    await act(async () => {
      screen.getByTestId("switch-to-a").click();
    });

    expect(screen.getByTestId("section-value").textContent).toBe("Content of Section A");
  });
});
