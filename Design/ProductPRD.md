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

Build a useful first version around Markdown reports:

- User chooses a report template.
- User fills project/school/member metadata.
- App generates a Markdown report structure.
- User writes content with preview.
- User adds evidence links through Evidence Kit.
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
5. Add screenshots, tables, code blocks, Mermaid diagrams, and evidence links.
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

### Evidence Kit

- Manage video demo, GitHub, deploy link, Drive, Figma, slide, API docs, and test account evidence.
- Feed evidence requirements into Checker.
- Generate an evidence appendix later.
- Store QR intent through `qrEnabled`; actual QR generation is Phase 2.

## 6. Non-goals For MVP

- No mandatory login.
- No realtime collaboration.
- No cloud file storage.
- No AI writing assistant in the first build.
- No full PDF toolbox as the product core.
- No "convert every file format" promise.

## 7. Success Criteria

- A student can create a clean report skeleton in under two minutes.
- A Markdown report can export to HTML, browser-print PDF, and editable DOCX.
- Checker output gives concrete, fixable issues before submission.
- The first screen is the actual workspace, not a marketing landing page.
