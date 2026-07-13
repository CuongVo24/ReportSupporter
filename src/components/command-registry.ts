export type CommandGroup =
  | "write"
  | "review"
  | "view"
  | "export"
  | "setup";

export type Command = {
  id: string;
  label: string;
  group: CommandGroup;
  hint?: string;
  keywords?: string[];
  run: () => void;
};

export type CommandHandlers = {
  createSection: () => void;
  duplicateSection: () => void;
  moveSectionUp: () => void;
  moveSectionDown: () => void;
  runCheck: () => void;
  openPreview: () => void;
  openExport: () => void;
  saveDraft: () => void;
  openAiSettings: () => void;
  openMarkdownImport: () => void;
  createReport: () => void;
  toggleFocusMode: () => void;
};

export const commandGroupLabels: Record<CommandGroup, string> = {
  write: "Viết báo cáo",
  review: "Kiểm tra",
  view: "Hiển thị",
  export: "Xuất bản",
  setup: "Thiết lập",
};

export function buildWorkspaceCommands(handlers: CommandHandlers): Command[] {
  return [
    {
      id: "create-section",
      label: "Thêm mục mới",
      group: "write",
      hint: "Ctrl+Shift+N",
      keywords: ["new", "section", "muc"],
      run: handlers.createSection,
    },
    {
      id: "duplicate-section",
      label: "Nhân đôi mục hiện tại",
      group: "write",
      hint: "Ctrl+Shift+D",
      keywords: ["copy", "duplicate", "section"],
      run: handlers.duplicateSection,
    },
    {
      id: "move-section-up",
      label: "Chuyển mục lên trên",
      group: "write",
      hint: "Alt+Up",
      keywords: ["move", "up", "len"],
      run: handlers.moveSectionUp,
    },
    {
      id: "move-section-down",
      label: "Chuyển mục xuống dưới",
      group: "write",
      hint: "Alt+Down",
      keywords: ["move", "down", "xuong"],
      run: handlers.moveSectionDown,
    },
    {
      id: "save-draft",
      label: "Lưu nháp",
      group: "write",
      hint: "Ctrl+S",
      keywords: ["save", "draft", "luu"],
      run: handlers.saveDraft,
    },
    {
      id: "import-markdown",
      label: "Nhập Markdown",
      group: "write",
      keywords: ["markdown", "import", "readme"],
      run: handlers.openMarkdownImport,
    },
    {
      id: "create-report",
      label: "Tạo báo cáo mới",
      group: "write",
      keywords: ["reset", "new", "template"],
      run: handlers.createReport,
    },
    {
      id: "run-check",
      label: "Soát lỗi báo cáo",
      group: "review",
      hint: "Ctrl+Enter",
      keywords: ["check", "lint", "kiem tra"],
      run: handlers.runCheck,
    },
    {
      id: "open-preview",
      label: "Mở bản xem trước",
      group: "view",
      hint: "Ctrl+P",
      keywords: ["preview", "xem truoc"],
      run: handlers.openPreview,
    },
    {
      id: "toggle-focus-mode",
      label: "Bật/tắt chế độ Focus",
      group: "view",
      hint: "Ctrl+Shift+F",
      keywords: ["focus", "zen", "tap trung"],
      run: handlers.toggleFocusMode,
    },
    {
      id: "open-export",
      label: "Mở bảng xuất bản",
      group: "export",
      hint: "Ctrl+Shift+E",
      keywords: ["export", "pdf", "docx", "nop bai"],
      run: handlers.openExport,
    },
    {
      id: "open-ai-settings",
      label: "Cài đặt Trợ lý AI",
      group: "setup",
      keywords: ["ai", "settings", "config"],
      run: handlers.openAiSettings,
    },
  ];
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function filterCommands(commands: Command[], query: string): Command[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return commands;

  return commands.filter((command) => {
    const haystack = [
      command.label,
      commandGroupLabels[command.group],
      command.hint ?? "",
      ...(command.keywords ?? []),
    ]
      .map(normalizeSearchText)
      .join(" ");

    return haystack.includes(normalizedQuery);
  });
}

export function groupCommands(commands: Command[]) {
  return commands.reduce<Record<CommandGroup, Command[]>>(
    (groups, command) => {
      groups[command.group].push(command);
      return groups;
    },
    {
      write: [],
      review: [],
      view: [],
      export: [],
      setup: [],
    },
  );
}
