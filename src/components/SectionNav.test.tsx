// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SectionNav } from "./SectionNav";

const sections = [
  { id: "intro", title: "Intro", status: "done" as const },
  { id: "body", title: "Body", status: "draft" as const },
];

afterEach(cleanup);

describe("SectionNav", () => {
  it("keeps move buttons as an accessible reorder fallback", () => {
    const onMoveSection = vi.fn();

    render(
      <SectionNav
        sections={sections}
        activeSectionId="body"
        onSectionSelect={() => {}}
        isDesktop
        onMoveSection={onMoveSection}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Di chuyển lên|Di chuyen len/ }));

    expect(onMoveSection).toHaveBeenCalledWith("body", "up");
  });

  it("drops files onto the intended section", () => {
    const onSectionFilesDrop = vi.fn();
    const file = new File(["# Notes"], "notes.md", { type: "text/markdown" });

    render(
      <SectionNav
        sections={sections}
        activeSectionId="intro"
        onSectionSelect={() => {}}
        isDesktop
        onSectionFilesDrop={onSectionFilesDrop}
      />,
    );

    const bodyItem = screen.getByRole("button", { name: "2. Body" }).closest("li");
    expect(bodyItem).not.toBeNull();

    const files = { 0: file, length: 1, item: () => file };

    fireEvent.dragOver(bodyItem as HTMLElement, {
      dataTransfer: { types: ["Files"], files },
    });
    fireEvent.drop(bodyItem as HTMLElement, {
      dataTransfer: { files },
    });

    expect(onSectionFilesDrop).toHaveBeenCalledWith("body", [file]);
  });
});
