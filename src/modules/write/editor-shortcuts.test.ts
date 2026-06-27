import { describe, expect, it } from "vitest";
import {
  buildImageMarkdownDraft,
  buildLinkMarkdownDraft,
  buildWrappedMarkdownDraft,
} from "./editor-shortcuts";

describe("editor shortcut markdown drafts", () => {
  it("wraps selected text and keeps the original text selected", () => {
    expect(buildWrappedMarkdownDraft("abc", "**", "**", "đậm")).toEqual({
      text: "**abc**",
      selectionFrom: 2,
      selectionTo: 5,
    });
  });

  it("inserts a placeholder when the selection is empty", () => {
    expect(buildWrappedMarkdownDraft("", "`", "`", "code")).toEqual({
      text: "`code`",
      selectionFrom: 1,
      selectionTo: 5,
    });
  });

  it("builds link markdown and selects the url target", () => {
    expect(buildLinkMarkdownDraft("ReportSupporter")).toEqual({
      text: "[ReportSupporter](url)",
      selectionFrom: 18,
      selectionTo: 21,
    });
  });

  it("builds image markdown and selects the asset reference", () => {
    expect(buildImageMarkdownDraft("Demo")).toEqual({
      text: "![Demo](image:asset_id)",
      selectionFrom: 8,
      selectionTo: 22,
    });
  });
});
