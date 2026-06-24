# Quality Assurance & Acceptance Report - Week 6 (Advanced Templates)

**Project**: ReportSupporter  
**Date**: 2026-06-24  
**Branch**: `feature/W6-advanced-templates`  
**Status**: Week 6 Completed — All Quality Gates Passed (Green)

---

## 1. Quality Gates Summary

All four quality gates compile and execute cleanly in our test environment:

| Gate | Status | Command | Outcome |
| :--- | :---: | :--- | :--- |
| **Unit Tests** | PASS | `npm run test` | **216 / 216 tests passed** |
| **Type Check** | PASS | `npm run typecheck` | Clean, 0 compilation errors |
| **Linter** | PASS | `npm run lint` | 0 errors, 0 warnings |
| **Production Build** | PASS | `npm run build` | Next.js compilation succeeds |

The complete console log output is preserved in [build_output.txt](file:///e:/ReportSupporter/Design/Reports/Month2/W6/build_output.txt).

---

## 2. Quality Control (QC) Checklist Verification

We verified the quality control test scenarios mapped from the week 6 briefs and DoD criteria:

| Scenario / QC Check | Target | Status | Verification Detail / Parity Evidence |
| :--- | :---: | :---: | :--- |
| **Centralized Registry** | Templates | **PASS** | Centralized registry (`ALL_TEMPLATES`, `getTemplate`) collects all schemas and exposes them via the write module's public surface, avoiding deep-imports. |
| **Template-as-Data** | Templates | **PASS** | Templates (`lab-report`, `internship-report`) are pure data schemas, running through the same shared generator (`generateSkeleton`) and linter checks. |
| **Clean Headings** | Templates | **PASS** | Natively generated sections from templates contain clean headings with no hardcoded chapter numbers, keeping separation from format numbering. |
| **Deterministic README Import** | Importer | **PASS** | Slices Markdown README at H1/H2 levels deterministically using MDAST offsets. Unknown/leading text goes into a "Mở đầu" section. Purely offline, non-AI. |
| **Database Size Protection** | Importer | **PASS** | The `readmeContent` text field is deleted from final project metadata in `Workspace.tsx` prior to saving to IndexedDB, keeping database writes lean. |
| **Monospace TextArea UI** | UI Form | **PASS** | In the MetadataForm, fields with key `readmeContent` render as monospace height-adjustable `<textarea>` instead of standard `<input>`. |
| **Reusable Section Blocks** | Section Blocks | **PASS** | `buildMemberResponsibility` and `buildProjectTimeline` generate reusable GFM Markdown tables with proper headings, satisfying linter rules. |
| **Template-Aware Checker** | Checker | **PASS** | Checker rules (`toc-disabled`, `missing-conclusion`, `missing-references`, `missing-member-table`) dynamically fetch the active template definition to verify required sections. |
| **No False Positives** | Checker | **PASS** | If a section is not required by the active template (e.g., "Kết luận" in internship report), the linter does not flag it as missing. |

---

## 3. Hardening & Registry Syncing

* **Synchronized Template Resolution**:
  - **Issue**: The check engine originally had a duplicate, hardcoded `ALL_TEMPLATES` registry inside [src/modules/check/rules/utils.ts](file:///e:/ReportSupporter/src/modules/check/rules/utils.ts), which only recognized `software-project`. This caused rules (like `missing-conclusion` and `toc-disabled`) to return false-positives or skip validation when running on new templates because they returned `undefined` schema definitions.
  - **Resolution**: Cleaned up the local duplicate registry in linter utilities. Modified `getTemplateSchema` in [src/modules/check/rules/utils.ts](file:///e:/ReportSupporter/src/modules/check/rules/utils.ts) to dynamically retrieve templates by ID from the centralized write module's public surface `getTemplate` API. All template linter rules are now fully synchronized with the registry.

---

## 4. Weekly Deliverables Location
All W6 template schema configurations, sample generated skeletons, and issues checker outcomes are saved under:
* **Template Samples & Outcomes**: [template_samples.md](file:///e:/ReportSupporter/Design/Reports/Month2/W6/template_samples.md)
