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
};

export const commandGroupLabels: Record<CommandGroup, string> = {
  write: "Viet bao cao",
  review: "Kiem tra",
  view: "Hien thi",
  export: "Xuat ban",
  setup: "Thiet lap",
};

export function buildWorkspaceCommands(handlers: CommandHandlers): Command[] {
  return [
    {
      id: "create-section",
      label: "Them muc moi",
      group: "write",
      hint: "Ctrl+Shift+N",
      keywords: ["new", "section", "muc"],
      run: handlers.createSection,
    },
    {
      id: "duplicate-section",
      label: "Nhan doi muc hien tai",
      group: "write",
      hint: "Ctrl+Shift+D",
      keywords: ["copy", "duplicate", "section"],
      run: handlers.duplicateSection,
    },
    {
      id: "move-section-up",
      label: "Chuyen muc len tren",
      group: "write",
      hint: "Alt+Up",
      keywords: ["move", "up", "len"],
      run: handlers.moveSectionUp,
    },
    {
      id: "move-section-down",
      label: "Chuyen muc xuong duoi",
      group: "write",
      hint: "Alt+Down",
      keywords: ["move", "down", "xuong"],
      run: handlers.moveSectionDown,
    },
    {
      id: "save-draft",
      label: "Luu nhap",
      group: "write",
      hint: "Ctrl+S",
      keywords: ["save", "draft", "luu"],
      run: handlers.saveDraft,
    },
    {
      id: "import-markdown",
      label: "Nhap Markdown",
      group: "write",
      keywords: ["markdown", "import", "readme"],
      run: handlers.openMarkdownImport,
    },
    {
      id: "create-report",
      label: "Tao bao cao moi",
      group: "write",
      keywords: ["reset", "new", "template"],
      run: handlers.createReport,
    },
    {
      id: "run-check",
      label: "Soat loi bao cao",
      group: "review",
      hint: "Ctrl+Enter",
      keywords: ["check", "lint", "kiem tra"],
      run: handlers.runCheck,
    },
    {
      id: "open-preview",
      label: "Mo ban xem truoc",
      group: "view",
      hint: "Ctrl+P",
      keywords: ["preview", "xem truoc"],
      run: handlers.openPreview,
    },
    {
      id: "open-export",
      label: "Mo bang xuat ban",
      group: "export",
      hint: "Ctrl+Shift+E",
      keywords: ["export", "pdf", "docx", "nop bai"],
      run: handlers.openExport,
    },
    {
      id: "open-ai-settings",
      label: "Cai dat Tro ly AI",
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
