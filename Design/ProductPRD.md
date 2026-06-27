# Product PRD - ReportSupporter

## 1. Product Positioning

ReportSupporter is a reporting workspace for students and project groups. It helps users create a structured report, format it to submission standards, check common problems, and export the final package.

ReportSupporter should not feel like a generic converter site. Its main identity is:

> A workspace specialized for creating and submitting academic/project reports.

## 2. Target Users

- Students writing individual assignments, lab reports, internship reports, and research reports.
- Student teams preparing software project reports, slides, README files, and evidence links.
- Developers who want to turn `README.md` or project notes into PDF/DOCX reports quickly.

## 3. MVP Goal

Build a useful first version around Markdown reports, structured into two incremental milestones:
- **Core MVP (Month 1 / W1–W4)**: The editor loop (write → format → check → export HTML, browser-print PDF, basic DOCX).
- **Submission MVP / Evidence MVP (Month 2 / W5)**: Verifiable submission package (adding evidence links through Evidence Kit, generating evidence appendix, and printing QR codes).

Core features:
- User chooses a report template.
- User fills project/school/member metadata.
- App generates a Markdown report structure.
- User writes content with preview.
- User adds evidence links through Evidence Kit (Submission MVP).
- App checks missing sections and formatting risks.
- User exports PDF, DOCX, and HTML.

## 4. Core User Flow

1. Choose template, for example "Software project report".
2. Enter metadata:
   - project title
   - school
   - course
   - lecturer
   - group members
3. Generate report skeleton.
4. Write content in Markdown.
5. Add screenshots, tables, code blocks, Mermaid diagrams, and evidence links (Submission MVP).
6. Run "Check before submit".
7. Fix reported issues.
8. Export:
   - `report.pdf`
   - `report.docx`
   - `report.html`
   - later: `slides.pptx`, `evidence.zip`, `README.md`

## 5. MVP Features

### Write

- Markdown editor.
- Live preview.
- Insert images by drag and drop or clipboard paste.
- Insert tables, code blocks, LaTeX blocks, Mermaid diagrams, and callouts.
- Auto-save draft locally.
- Manage report sections as multiple Markdown files later.

### Format

- A4 report layout.
- Font and size presets such as Times New Roman 13/14.
- 1.5 line spacing.
- Heading numbering: `1`, `1.1`, `1.1.1`.
- Table of contents.
- Figure and table captions.
- Header, footer, and page number configuration.

### Check

- Table of contents disabled when the selected template requires it.
- Missing conclusion.
- Missing references.
- Missing member responsibility table.
- Missing required evidence such as GitHub, demo video, or deploy link for project templates.
- Broken image paths.
- Skipped heading levels.
- Missing figure/table captions.
- Code blocks without language.
- Remaining `TODO`, `fix later`, or `lorem ipsum`.

### Export

- Markdown to HTML.
- Markdown to PDF through browser print / print CSS first.
- Markdown to DOCX as an editable best-effort version.
- README/report template to PDF/DOCX.

#### Evidence Kit (Submission MVP - Phase 2 / Week 5)

- **Tháng 1 (Core MVP) Boundary:** Chỉ hỗ trợ lưu trữ liên kết minh chứng đơn giản dưới dạng các trường metadata trong cấu trúc mẫu báo cáo hoặc hiển thị panel dạng tĩnh/placeholder. Chưa có giao diện quản lý riêng hay tự động sinh bảng.
- **Tháng 2 (Submission MVP / Week 5+) Boundary:**
  - Phát triển giao diện quản lý minh chứng đầy đủ (thêm/sửa/xóa, kiểm tra cú pháp URL ngoại tuyến).
  - Hỗ trợ quản lý 8 loại minh chứng phổ biến: video demo, GitHub, deploy link, Drive, Figma, slide, API docs, và test account — cộng `other` làm fallback (tổng 9 `EvidenceKind`, xem `Design/Modules/Other/CanonicalTypes.md` §2).
  - Tự động tạo bảng Phụ lục minh chứng (Evidence Appendix Table) tích hợp vào cuối báo cáo và tự động sinh mã QR cho mỗi liên kết minh chứng thông qua thư viện `qrcode`.
  - Tích hợp dữ liệu minh chứng thực tế vào Checker.

## 6. Non-goals For MVP

- No mandatory login.
- No realtime collaboration.
- No cloud file storage.
- AI writing assistant (introduced in Week 11 and hardened in Week 16) with local client-key configuration.
- No full PDF toolbox as the product core.
- No "convert every file format" promise.

### Privacy and AI Data Handling
- AI capabilities are entirely opt-in and disabled by default.
- When enabled, the application transmits active section/report contents to the chosen LLM provider (Google Gemini, OpenAI, or Anthropic Claude) through the first-party proxy `/api/ai`.
- The AI provider API key is entered by the user, stored locally in browser `localStorage`, and sent per request through the `x-api-key` header. The proxy does not fall back to server environment keys.
- Because `localStorage` can be read by script running in the same origin, XSS prevention remains a hard security requirement.


### Connector and AI Markdown Ingestion

For Markdown produced by NotebookLM, Gemini, ChatGPT, Codex, Claude, or similar agents, the MVP follows an import-first strategy: users copy, export, drag, or paste Markdown into ReportSupporter instead of connecting the browser app directly to MCP.

See [MCP / Connector Markdown Ingestion Strategy](Decisions/MCP_Connector_Strategy.md). Direct MCP/server connector work is a future epic only after an explicit decision to add server-side persistence, authentication, and browser synchronization.

## 7. Success Criteria

- A student can create a clean report skeleton in under two minutes.
- A Markdown report can export to HTML, browser-print PDF, and editable DOCX.
- Checker output gives concrete, fixable issues before submission.
- The first screen is the actual workspace, not a marketing landing page.
