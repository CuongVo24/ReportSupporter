# MCP / Connector Markdown Ingestion Strategy

> Status: Accepted for Week 16 spike
> Date: 2026-06-27
> Scope: Design decision only. No `src/` changes.

## Context

The user need is to bring Markdown produced by NotebookLM, Gemini, ChatGPT, Codex, Claude, or similar agents into ReportSupporter with less friction.

ReportSupporter is currently browser-only, offline-first, and local-first:

- Draft storage lives in the user's browser through IndexedDB.
- The MVP has no mandatory login, no cloud storage, and no backend database.
- The core value proposition depends on privacy, local control, and deterministic Markdown processing.

MCP is useful for agent-to-tool integration, but it is not a small browser feature. MCP clients normally run in desktop/server agent environments and connect through transports such as stdio or HTTP/SSE. A browser-only app cannot cleanly act as an MCP client because of transport limits, CORS boundaries, and secret handling.

Also, an external MCP server cannot write directly into a user's browser IndexedDB. If an agent must push content directly into ReportSupporter, the app needs server-side persistence plus browser sync. That is a larger architectural change and would alter the current offline/privacy-first posture.

## Options

### A. First-class Markdown import

Do not add MCP for Week 16. Make importing Markdown easy through the planned global Markdown import/drop/paste flow, then let users export or copy Markdown from NotebookLM, Gemini, ChatGPT, Codex, Claude, or other tools and bring it into ReportSupporter.

This solves about 95% of the real ingestion need:

- The upstream tools already produce Markdown or Markdown-like text.
- Users keep control over what enters the report.
- ReportSupporter stays browser-only and offline-first.
- No secrets, auth, MCP transport, or server persistence are required.
- The feature composes with the AI outline/import work already planned for Week 16.

Trade-off: the flow is user-mediated instead of automatic agent push.

### B. Real MCP server / connector endpoint

Expose ReportSupporter capabilities as server-side tools, for example:

- `import_report_markdown(markdown, source, mode)`
- `add_section(title, markdown, position)`
- `replace_section(sectionId, markdown)`
- `get_report_outline(reportId)`

This allows an agent to push Markdown or sections directly into a report, but only after the product accepts a server-backed architecture.

Activation conditions:

- Move report persistence, or at least an import inbox, to a server-side store.
- Add authentication and authorization for user/report access.
- Define browser synchronization back into the workspace.
- Update the PRD and technical stack to reflect the privacy and offline trade-offs.
- Treat the work as a separate epic with security review, not a Week 16 feature.

Trade-off: better automation, but it changes the storage and trust model.

### C. Browser as an MCP client

Reject for the current product shape.

Reasons:

- MCP stdio transport is not available to normal browser JavaScript.
- HTTP/SSE MCP endpoints would run into CORS and deployment constraints.
- Provider or agent secrets must not live in the client.
- Even if a browser could call a connector, the app would still need a safe persistence and sync story.

Trade-off: it sounds direct, but it is fragile and conflicts with the browser-only local-first boundary.

## Decision

Choose Option A for Week 16: first-class Markdown import.

MCP is not the right first solution for this product stage. The best immediate path is to make Markdown ingestion excellent, because NotebookLM, Gemini, ChatGPT, Codex, Claude, and similar tools already produce Markdown that users can copy, export, drag, or paste.

Option B remains a valid future epic only if ReportSupporter explicitly decides to introduce server-side persistence, auth, and browser sync. Option C is rejected.

## Product Guidance

- Prioritize the global Markdown import/drop/paste contract.
- Preserve offline-first behavior for the MVP.
- Do not add MCP packages, connector servers, backend databases, or auth for this decision.
- If direct agent push becomes a product requirement, open a new architecture decision before implementation.

## Future MCP Tool Sketch

If Option B is later approved, a minimal tool surface could look like this:

```ts
type ImportMode = "new-report" | "append-section" | "replace-section";

interface ImportReportMarkdownInput {
  reportId?: string;
  markdown: string;
  source: "notebooklm" | "gemini" | "chatgpt" | "codex" | "claude" | "other";
  mode: ImportMode;
  sectionId?: string;
}

interface ImportReportMarkdownResult {
  reportId: string;
  importedSectionIds: string[];
  warnings: string[];
}
```

This sketch is documentation only. It does not authorize implementation.

## Verification

- The decision lists Options A, B, and C with trade-offs.
- The recommendation is Option A and explicitly says it solves about 95% of the ingestion need through import.
- Option B has explicit activation conditions: server-side persistence, auth, browser sync, and architecture/PRD updates.
- Option C is rejected for CORS, secret, and transport reasons.
- No `src/` changes are required or allowed by this decision.
