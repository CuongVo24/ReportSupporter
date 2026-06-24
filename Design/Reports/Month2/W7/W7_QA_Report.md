# Quality Assurance & Acceptance Report - Week 7 (Format & Export Hardening)

**Project**: ReportSupporter  
**Date**: 2026-06-24  
**Branch**: `feature/W7-format-hardening`  
**Status**: Week 7 Completed — All Quality Gates Passed (Green)

---

## 1. Quality Gates Summary

All four quality gates compile and execute cleanly in our test environment:

| Gate | Status | Command | Outcome |
| :--- | :---: | :--- | :--- |
| **Unit Tests** | PASS | `npm run test` | **243 / 243 tests passed** |
| **Type Check** | PASS | `npm run typecheck` | Clean, 0 compilation errors |
| **Linter** | PASS | `npm run lint` | 0 errors, 0 warnings |
| **Production Build** | PASS | `npm run build` | Next.js compilation succeeds |

The complete console log output is preserved in [build_output.txt](file:///e:/ReportSupporter/Design/Reports/Month2/W7/build_output.txt).

---

## 2. Quality Control (QC) Checklist Verification

We verified the quality control test scenarios mapped from the Week 7 briefs and DoD criteria:

| Scenario / QC Check | Target | Status | Verification Detail / Parity Evidence |
| :--- | :---: | :---: | :--- |
| **Caption Normalization** | Format | **PASS** | `normalizeCaptions` mutates AST in-place to inject stable IDs (`fig-X`, `table-Y`) and normalized label paragraphs, supporting both continuous and per-chapter numbering. |
| **Caption Registry** | Format | **PASS** | `buildCaptionRegistry` provides a single registry of figures and tables so body captions, LoF/LoT, and both export targets read from the same source. |
| **LoF/LoT Generation** | Format | **PASS** | `generateListOfFigures` and `generateListOfTables` extract entries from the unified registry and render right after TOC in `PreviewPane.tsx`. |
| **References Rules** | Checker | **PASS** | `referencesRule` warns on empty sections, malformed entries, and incorrect numeric ordering, registered in `RULES_REGISTRY` in `registry.ts`. |
| **PDF Chapter Breaks** | Export | **PASS** | Chapter headings (`h1`) use `break-before: page` for print media when `chapterStartsNewPage` is true, with a conditional override to avoid double page-breaks on the first H1. |
| **Orphan Heading Avoidance** | Export | **PASS** | Print CSS applies `break-after: avoid` and `page-break-after: avoid` to all headings (`h1` through `h6`) to prevent orphan headings at the bottom of pages. |
| **Caption Keeping** | Export | **PASS** | Figure captions (`.fig-caption`) use `break-before: avoid` and table captions (`.tbl-caption`) use `break-after: avoid` to keep captions together with figures/tables across pages. |
| **Widow/Orphan Paragraphs** | Export | **PASS** | Print CSS applies `orphans: 3; widows: 3;` for paragraphs and lists to ensure stable text layouts when exporting. |
| **Stable running headers/footers** | Export | **PASS** | Running headers/footers are styled via `@page` rules with `@top-center` and `@bottom-center` margin boxes, hidden on the first page (`@page :first`). |
| **DOCX Layout Checklist** | Export | **PASS** | `verifyDocxLayout` verifies page setup (A4/margins), heading levels, caption numbering parity, table structures, and chapter page breaks. |
| **DOCX/PDF Layout Parity** | Export | **PASS** | `mdast-to-docx.ts` reads the same caption registry and format presets to generate matching captions and chapter page breaks (`PageBreak` before h1). |

---

## 3. Hardening & Single-Source Parity

* **Unified Caption Numbering in Exporters**:
  - **Issue**: The export pipeline in `prepare-export.ts` had a duplicate walking and numbering logic which hazarded layout drift between the preview (running on the new caption registry) and HTML/PDF/DOCX exports.
  - **Resolution**: Refactored `prepare-export.ts` to call the format module's `buildCaptionRegistry` and `normalizeCaptions` in-place. This ensures the output AST sent to all exporters contains identical stable IDs, numbering labels, and caption paragraphs as the editor's live preview.
* **DOCX Paragraph Centering**:
  - Center-aligned figures and table captions in the DOCX output (mapping `.fig-caption` and `.tbl-caption` paragraph classes in `mdast-to-docx.ts` to centered styles), keeping formatting parity with print CSS.

---

## 4. Weekly Deliverables Location
All W7 formatting samples, PDF before/after comparisons, and DOCX layout checklists are saved under:
* **Format Samples & Outcomes**: [format_samples/readme.md](file:///e:/ReportSupporter/Design/Reports/Month2/W7/format_samples/readme.md)
