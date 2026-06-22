# Contract For AI - W1 Project Bootstrap

## 1. Micro-task Target

Implement Week 1 bootstrap from `Design/TaskBrief/Core/month1/w1.md`.

The result should be a runnable Next.js + Node project shell for ReportSupporter, with a workspace-first UI direction and enough structure to start Markdown editing in Week 2.

## 2. Scope

In scope:

- Initialize app dependencies and scripts.
- Add TypeScript app structure.
- Add first workspace shell.
- Define initial report/template/checker types.
- Add placeholder services for export.
- Run build verification.

Out of scope:

- Real PDF/DOCX export.
- Login.
- Cloud storage.
- Realtime collaboration.
- AI assistant.

## 3. Checklist

- [ ] Create Next.js project files in the repo root.
- [ ] Add `package.json` scripts: `dev`, `build`, `lint`, `typecheck`.
- [ ] Add initial app route with workspace-first layout.
- [ ] Add report template schema and software project template seed.
- [ ] Add report project, report section, and checker issue types.
- [ ] Add Markdown editor placeholder and preview placeholder.
- [ ] Add local draft storage proof of concept.
- [ ] Add checker panel placeholder.
- [ ] Add HTML export stub and PDF/DOCX service placeholders.
- [ ] Run build/typecheck and record result in `Design/Reports/`.

## 4. Expected Interfaces

```ts
type ReportProject = {
  id: string;
  title: string;
  templateId: string;
  metadata: Record<string, string | string[]>;
  sections: ReportSection[];
  updatedAt: string;
};

type ReportSection = {
  id: string;
  order: number;
  title: string;
  markdown: string;
  status: "draft" | "review" | "done";
};

type ReportIssue = {
  id: string;
  severity: "error" | "warning" | "info";
  module: "write" | "format" | "check" | "export";
  message: string;
  suggestion: string;
  sectionId?: string;
  line?: number;
};
```

## 5. Risks

| Risk | Level | Mitigation |
|---|---:|---|
| Bootstrap pulls scope into full editor | Medium | Use placeholder editor in W1, leave rich editor for W2. |
| Export libraries add heavy dependencies too early | Medium | Stub export services until W4. |
| UI becomes landing-page oriented | High | First route must be the workspace, not a marketing hero. |

## 6. Verification Plan

- Run dependency install.
- Run `npm run build`.
- Run `npm run lint` if configured.
- Run `npm run typecheck` if configured.
- Confirm app shell renders locally.
- Record evidence in `Design/Reports/Month1/W1/`.

## 7. Status

`WAITING_FOR_APPROVAL`

