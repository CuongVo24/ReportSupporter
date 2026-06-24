# Quality Assurance & Acceptance Report - Week 4 (Phase-1 MVP Close)

**Project**: ReportSupporter  
**Date**: 2026-06-24  
**Branch**: `feature/W4-export-mvp`  
**Status**: Phase-1 MVP Closed — All Quality Gates Passed (Green)

---

## 1. Quality Gates Summary

All four quality gates compile and execute cleanly in our test environment:

| Gate | Status | Command | Outcome |
| :--- | :---: | :--- | :--- |
| **Unit Tests** | PASS | `npm run test` | **136 / 136 tests passed** |
| **Type Check** | PASS | `npm run typecheck` | Clean, 0 compilation errors |
| **Linter** | PASS | `npm run lint` | 0 errors, 0 warnings |
| **Production Build** | PASS | `npm run build` | Next.js compilation succeeds |

The complete console log output is preserved in [build_output.txt](file:///e:/ReportSupporter/Design/Reports/Month1/W4/build_output.txt).

---

## 2. Quality Control (QC) Checklist Verification

We walked the canonical QC checklist from `4.Export.md` §8 to verify formatting and structure parity across the three export targets:

| Checklist Item | Target | Status | Verification Detail / Parity Evidence |
| :--- | :---: | :---: | :--- |
| **Cover Page** | HTML / PDF / DOCX | **PASS** | Title, school, course, lecturer, member lists, and dates render centered with correct styles. A page break is inserted immediately following the cover page. |
| **Heading Numbering Parity** | HTML / PDF / DOCX | **PASS** | Heading numbering (e.g. `1`, `1.1`, `1.1.1`) is compiled sequentially in the shared pipeline and directly mapped to all three targets. No re-numbering occurs, guaranteeing 100% parity. |
| **Document Structure** | HTML / PDF / DOCX | **PASS** | Structural hierarchy (blockquotes, nested lists, thematic breaks) maps cleanly to corresponding HTML tags and DOCX block structures. |
| **GFM Tables** | HTML / PDF / DOCX | **PASS** | Table cells and rows are fully preserved. Columns are equally spaced based on percentage calculations, and cell content maps to styled phrasing. |
| **Fenced Code Blocks** | HTML / PDF / DOCX | **PASS** | Monospaced Courier New fonts are applied. Shaded gray backgrounds are rendered for readability. Original language labels (e.g., `[Mã nguồn: typescript]`) are displayed. |
| **Chapter Separation** | HTML / PDF / DOCX | **PASS** | First-level headings (H1) trigger page breaks (if `chapterStartsNewPage` is enabled in format settings), starting fresh chapters on new pages. |
| **Orphan Asset Images** | HTML / PDF / DOCX | **PASS** | Images with base64 data URLs render inline. Orphan `asset:<id>` or broken links render as descriptive warning placeholders (red italic text) rather than throwing compilation errors. |
| **Math & Equation Fallbacks** | HTML / PDF / DOCX | **PASS** | Inline and display math blocks compile to styled LaTeX expressions in HTML/PDF (via client KaTeX). In Word/DOCX, they fallback to structured bracketed monospaced strings to prevent crashes. |
| **Browser Print (PDF)** | PDF | **PASS** | Browser window print surface writes HTML content cleanly and opens the standard printer dialog without native `puppeteer` library imports. |
| **Async Zip Packer** | DOCX | **PASS** | DOCX document compiles synchronously, while the packer zips binary bytes asynchronously at download time, yielding a valid ZIP Blob (with `PK` header). |
| **Pre-export Warning Banner** | UI Panel | **PASS** | Warning banner displays formatting issues detected by Module 3, prompting the user but leaving the export buttons fully enabled. |
| **Export Job Lifecycle** | UI Panel | **PASS** | Export status displays loading spinners on processing, checkmarks on done, and cross-marks with recoverable messages and "Retry" buttons on failures. |

---

## 3. Known MVP Limitations & Hardening Plan
* **Header/Footer / Page Numbering**: When saving as PDF via browser print, page headers, footers, and page numbers are managed by the browser's native print settings. Word-native DOCX page numbers are deferred to phase-2 hardening.
* **Math Native Word Equations**: DOCX math equations are currently exported as plain monospaced text blocks (KaTeX is HTML-only). Hardening Word math objects is scheduled for W7.
* **Mermaid Headless Fallback**: Headless rendering of Mermaid graphs is currently handled via client-side libraries during HTML view. PDF/DOCX targets render diagrams if pre-rendered, otherwise listing the raw Mermaid code block.

---

## 4. Phase-1 MVP Deliverables Location
All generated MVP sample exports are saved under:
* **HTML**: [report.html](file:///e:/ReportSupporter/Design/Reports/Month1/W4/samples/report.html)
* **PDF**: [report.pdf](file:///e:/ReportSupporter/Design/Reports/Month1/W4/samples/report.pdf)
* **DOCX**: [report.docx](file:///e:/ReportSupporter/Design/Reports/Month1/W4/samples/report.docx)
