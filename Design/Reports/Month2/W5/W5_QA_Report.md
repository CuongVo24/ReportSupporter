# Quality Assurance & Acceptance Report - Week 5 (Evidence Kit)

**Project**: ReportSupporter  
**Date**: 2026-06-24  
**Branch**: `feature/W5-evidence-kit`  
**Status**: Week 5 Completed — All Quality Gates Passed (Green)

---

## 1. Quality Gates Summary

All four quality gates compile and execute cleanly in our test environment:

| Gate | Status | Command | Outcome |
| :--- | :---: | :--- | :--- |
| **Unit Tests** | PASS | `npm run test` | **175 / 175 tests passed** |
| **Type Check** | PASS | `npm run typecheck` | Clean, 0 compilation errors |
| **Linter** | PASS | `npm run lint` | 0 errors, 0 warnings |
| **Production Build** | PASS | `npm run build` | Next.js compilation succeeds |

The complete console log output is preserved in [build_output.txt](file:///e:/ReportSupporter/Design/Reports/Month2/W5/build_output.txt).

---

## 2. Quality Control (QC) Checklist Verification

We verified the quality control test scenarios mapped from `Support.Evidence.md §6` and DoD criteria:

| Scenario / QC Check | Target | Status | Verification Detail / Parity Evidence |
| :--- | :---: | :---: | :--- |
| **Missing required kinds** | Checker | **PASS** | If `software-project` requires `["github", "video", "deploy"]` and `video` is missing, `missing-required-evidence` (error) triggers with the missing kind label. |
| **URL format validation** | Checker | **PASS** | If an evidence item URL contains a malformed shape (e.g. `"abc"`), `broken-evidence-url-shape` (warning) triggers. Validation is 100% offline (no network requests). |
| **No false-positives on links** | Checker | **PASS** | If `github` and `deploy` kinds are supplied, `missing-project-links` does not trigger (confirmed by unit tests). |
| **Appendix generation** | Preview & Export | **PASS** | `buildEvidenceAppendix` yields a deterministic GFM Markdown table mapping Vietnamese labels (`kindMeta`), titles, links, and notes. Cell `|` characters are escaped to `\|` and newlines are replaced with spaces to prevent layout breakdown. |
| **Appendix page styling** | Live Preview | **PASS** | The appendix table is appended to the final section's source markdown, undergoing heading numbering (`## Phụ lục minh chứng` gets global numbering) and TOC indexing. |
| **Offline QR Generation** | Live Preview | **PASS** | Dynamic QR codes are generated asynchronously using `qrcode` and rendered next to links on-demand. |
| **IndexedDB Quota Safety** | Live Preview | **PASS** | QR base64 strings are generated dynamically in the client via React Portals and are **not** persisted in the draft state (IndexedDB), ensuring database size remains small. |
| **Export Image Sizing** | DOCX Export | **PASS** | Any image node in the MDAST with alt starting with `"QR:"` is resized to a small square dimension (`80x80`) in the exported Word document. |
| **Export Embedding** | HTML & DOCX | **PASS** | Exporters pre-resolve QR codes asynchronously in `executeExport` and replace placeholders with base64 `image` nodes in MDAST before rendering. |

---

## 3. Weekly Deliverables Location
All W5 evidence implementation samples are saved under:
* **Evidence Samples**: [evidence_samples.md](file:///e:/ReportSupporter/Design/Reports/Month2/W5/evidence_samples.md)
* **Build Terminal Output**: [build_output.txt](file:///e:/ReportSupporter/Design/Reports/Month2/W5/build_output.txt)
