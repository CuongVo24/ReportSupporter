# Master Roadmap - ReportSupporter (12 Weeks)

## Project Overview

- **Goal:** Build a reporting workspace that helps students and project teams write, format, check, and export complete submission-ready reports.
- **Core value:** Fast report creation, usable export, academic formatting, pre-submit checking, and evidence-aware submission workflow.
- **MVP stack:** Next.js (App Router) — **client-first**, gần như không server: editor/format/check/export đều chạy trong trình duyệt, PDF qua browser-print, **không backend bắt buộc** ở Core MVP (Node chỉ là runtime dev/build; Puppeteer server-side là hardening tùy chọn sau — xem `Design/Modules/Other/TechnicalStack.md`).
- **Privacy posture:** Core report editing should work without mandatory login.

## Phase 1 - Core MVP: Report Workspace (Weeks 1-4)

### Week 1: Project Bootstrap and Design System

- Initialize Next.js + Node project structure.
- Build the first workspace shell.
- Define local draft storage approach.
- Implement initial template schema.
- Prepare design tokens and UI conventions.

### Week 2: Markdown Authoring

- Build Markdown editor and live preview.
- Add template picker and metadata form.
- Generate report skeleton from selected template.
- Add local auto-save.
- Add basic image insertion flow.

### Week 3: Format and Check Foundation

- Implement heading parser and numbering.
- Implement basic table of contents generation.
- Add checker engine with MVP rules.
- Display issues grouped by severity.
- Add report readiness score draft.

### Week 4: Export MVP

- Export Markdown to HTML.
- Export formatted report to PDF through browser print / print CSS.
- Export formatted report to basic editable DOCX.
- Add export status and error handling.
- Produce first acceptance report in `Design/Reports/`.

## Build Priority

- **P0 Write core:** template picker, Markdown editor, preview, autosave, image insert.
- **P1 Export usable:** HTML export, browser-print PDF, DOCX basic.
- **P2 Format academic:** A4 preset, heading numbering, TOC, captions.
- **P3 Check before submit:** missing sections, TODO, broken image, evidence gaps, readiness score.
- **P4 Evidence Kit:** evidence manager, appendix, QR later.
- **P5 Present:** slide outline, script, Q&A, PPTX later.

## Phase 2 - Submission MVP / Evidence MVP (Weeks 5-8)

### Week 5: Evidence Kit

- Add evidence link manager.
- Track video demo, GitHub, deploy link, slide, Figma, Drive, test account, and API documentation.
- Generate evidence appendix table.
- Generate QR codes for evidence links after `qrEnabled` is already stored in MVP data.

### Week 6: Advanced Templates

- Add software project report template.
- Add lab report template.
- Add internship report template.
- Add README-to-report template.
- Add member responsibility and timeline sections.

### Week 7: Format Hardening

- Improve caption normalization.
- Add list of figures and list of tables.
- Add references section rules.
- Improve PDF page-break behavior.
- Add DOCX layout verification checklist.

### Week 8: Submission Package

- Generate `evidence.zip`.
- Generate `README.md` from report metadata.
- Add final submission checklist.
- Add export history stored locally.

## Phase 3 - Present and AI Layer (Weeks 9-12)

### Week 9: Slide Outline

- Generate slide outline from report sections.
- Add presentation timeline.
- Assign speakers to sections.

### Week 10: Script and Q&A

- Generate speaker script.
- Generate defense Q&A.
- Add weak-section review hints.

### Week 11: Optional AI Assistant

- Add AI-assisted outline generation behind explicit user action.
- Add section rewrite suggestions.
- Add academic tone improvement.
- Keep user content control visible.

### Week 12: Beta Readiness

- Run end-to-end project report scenario.
- Validate exports on sample reports.
- Polish UI states and accessibility.
- Prepare public demo and README evidence.
