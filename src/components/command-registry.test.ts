import { describe, expect, it, vi } from "vitest";
import {
  buildWorkspaceCommands,
  commandGroupLabels,
  filterCommands,
  groupCommands,
  type CommandHandlers,
} from "./command-registry";

function createHandlers(): CommandHandlers {
  return {
    createSection: vi.fn(),
    duplicateSection: vi.fn(),
    moveSectionUp: vi.fn(),
    moveSectionDown: vi.fn(),
    runCheck: vi.fn(),
    openPreview: vi.fn(),
    openExport: vi.fn(),
    saveDraft: vi.fn(),
    openAiSettings: vi.fn(),
    openMarkdownImport: vi.fn(),
    createReport: vi.fn(),
    toggleFocusMode: vi.fn(),
  };
}

describe("command registry", () => {
  it("builds the workspace command list with existing shortcut hints", () => {
    const commands = buildWorkspaceCommands(createHandlers());

    expect(commands.map((command) => command.id)).toEqual([
      "create-section",
      "duplicate-section",
      "move-section-up",
      "move-section-down",
      "save-draft",
      "import-markdown",
      "create-report",
      "run-check",
      "open-preview",
      "toggle-focus-mode",
      "open-export",
      "open-ai-settings",
    ]);
    expect(commands.find((command) => command.id === "create-section")?.hint).toBe("Ctrl+Shift+N");
    expect(commands.find((command) => command.id === "duplicate-section")?.hint).toBe("Ctrl+Shift+D");
    expect(commands.find((command) => command.id === "move-section-up")?.hint).toBe("Alt+Up");
    expect(commands.find((command) => command.id === "move-section-down")?.hint).toBe("Alt+Down");
    expect(commands.find((command) => command.id === "run-check")?.hint).toBe("Ctrl+Enter");
    expect(commands.find((command) => command.id === "open-preview")?.hint).toBe("Ctrl+P");
    expect(commands.find((command) => command.id === "toggle-focus-mode")?.hint).toBe("Ctrl+Shift+F");
    expect(commands.find((command) => command.id === "open-export")?.hint).toBe("Ctrl+Shift+E");
    expect(commands.find((command) => command.id === "save-draft")?.hint).toBe("Ctrl+S");
  });

  it("filters commands by label, group, hint, and keyword", () => {
    const commands = buildWorkspaceCommands(createHandlers());

    expect(filterCommands(commands, "soat").map((command) => command.id)).toEqual(["run-check"]);
    expect(filterCommands(commands, commandGroupLabels.export).map((command) => command.id)).toEqual(["open-export"]);
    expect(filterCommands(commands, "ctrl+shift+e").map((command) => command.id)).toEqual(["open-export"]);
    expect(filterCommands(commands, "readme").map((command) => command.id)).toEqual(["import-markdown"]);
  });

  it("groups commands in stable command palette sections", () => {
    const commands = buildWorkspaceCommands(createHandlers());
    const grouped = groupCommands(commands);

    expect(grouped.write.map((command) => command.id)).toEqual([
      "create-section",
      "duplicate-section",
      "move-section-up",
      "move-section-down",
      "save-draft",
      "import-markdown",
      "create-report",
    ]);
    expect(grouped.review.map((command) => command.id)).toEqual(["run-check"]);
    expect(grouped.view.map((command) => command.id)).toEqual(["open-preview", "toggle-focus-mode"]);
    expect(grouped.export.map((command) => command.id)).toEqual(["open-export"]);
    expect(grouped.setup.map((command) => command.id)).toEqual(["open-ai-settings"]);
  });

  it("runs the handler attached to a command", () => {
    const handlers = createHandlers();
    const command = buildWorkspaceCommands(handlers).find((item) => item.id === "run-check");

    command?.run();

    expect(handlers.runCheck).toHaveBeenCalledOnce();
  });
});
