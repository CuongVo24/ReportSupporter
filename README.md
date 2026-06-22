# ReportSupporter

ReportSupporter is a web workspace for students and project teams to turn raw report content into a complete submission package: report, formatted exports, evidence, checklist, README, and later slides.

The product is not positioned as a generic file converter. The core promise is:

> Write once, export the formats you need to submit.

## MVP

The first version focuses on Markdown-based reports:

- Markdown editor with live preview.
- Student report templates.
- Local draft storage by default.
- Automatic report formatting rules for A4-style academic reports.
- Pre-submit checker for missing sections, weak evidence, TODO text, captions, and code block issues.
- Export Markdown to HTML, PDF, and DOCX.

## Product Modules

1. **Write** - author report content with Markdown, images, tables, code, math, Mermaid, and callouts.
2. **Format** - normalize report structure, cover page, headings, captions, table of contents, figures, and references.
3. **Check** - detect missing content and submission risks before export.
4. **Export** - generate PDF, DOCX, HTML, README, and later ZIP evidence packs.
5. **Present** - generate slide outline, script, Q&A, and defense checklist after the report is stable.

## Technical Direction

- Web stack: Next.js + Node.
- Privacy-first default: core authoring and draft behavior should work without mandatory login.
- Cloud/team features are intentionally outside the first MVP.

## Design Docs

The initial product design lives in `Design/`:

- `Design/ProductPRD.md`
- `Design/Modules/`
- `Design/RoadMap/MasterRoadMap.md`
- `Design/TaskBrief/Core/month1/w1.md`
- `Design/ContractForAI/`
- `Design/Reports/README.md`

