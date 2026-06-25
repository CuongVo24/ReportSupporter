# Quality Assurance & Acceptance Report - Week 9 (Slide Outline & Timeline)

**Project**: ReportSupporter  
**Date**: 2026-06-25  
**Branch**: `feature/W9-slide-outline`  
**Status**: Week 9 Completed — All Quality Gates Passed (Green)

---

## 1. Quality Gates Summary

All four quality gates compile and execute cleanly in our test environment:

| Gate | Status | Command | Outcome |
| :--- | :---: | :--- | :--- |
| **Unit & Integration Tests** | PASS | `npm run test` | **294 / 294 tests passed** |
| **Type Check** | PASS | `npm run typecheck` | Clean, 0 compilation errors |
| **Linter** | PASS | `npm run lint` | 0 errors, 0 warnings |
| **Production Build** | PASS | `npm run build` | Next.js compilation succeeds |

The complete console log output is preserved in [build_output.txt](file:///e:/ReportSupporter/Design/Reports/Month3/W9/build_output.txt).

---

## 2. Quality Control (QC) Checklist Verification

We verified the quality control test scenarios mapped from the Week 9 briefs, DoD criteria, and `5.Present.md` §8/§9:

| Scenario / QC Check | Target | Status | Verification Detail / Parity Evidence |
| :--- | :---: | :---: | :--- |
| **Slide Outline Generation** | Present | **PASS** | `generateSlideOutline` sorts sections by order, maps headings (depth <= 2) to slides, extracts bullets, caps to 5, and filters empty chapters. |
| **Presentation Timeline** | Present | **PASS** | `buildTimeline` assigns durations based on character length (0.5s per char) + evidence refs (15s per ref) with a 60s base, and detects overLimit. |
| **Speaker Assignment** | Present | **PASS** | `buildSpeakers` normalizes string | string[] metadata members. `assignSlides` contiguously allocates blocks of slides as evenly as possible. |
| **Outline Panel UI** | UI | **PASS** | `PresentPanel` and `SlideOutlineView` render outline titles/bullets, customize limit seconds, show overLimit warning, and allow local state updates. |
| **Multi-Template Integration** | Integration | **PASS** | Integrated pipeline (outline, timeline, speakers) successfully tested on `software-project`, `lab-report`, `internship-report`, and `readme-report`. |
| **Local-first & No-AI Baseline**| Architecture | **PASS** | **Locked Decisions #2 and #3 verified.** All calculations are performed deterministically, client-side, completely offline, and without AI/LLM client dependencies. |

---

## 3. Integration & Code Hardening

* **Contiguous Block Speaker Assignment**:
  - **Issue**: Standard speaker distribution should group slides logically so that a speaker presents a cohesive topic (e.g., contiguous sections) instead of alternating slides in a round-robin fashion.
  - **Resolution**: Implemented a block distribution algorithm dividing total slides $N$ by speaker count $M$, assigning slides in contiguous blocks of size $\lfloor N / M \rfloor$, with remainders added to the first speakers.
* **Broken Evidence Warnings**:
  - **Issue**: When an evidence item is deleted, the slide outline's markdown content might still point to its URL, leading to dead references.
  - **Resolution**: Enabled detection of broken evidence links (comparing URLs containing keywords like "github", "deploy" that are missing from `bundle.evidence`) and automatically prepended a warning bullet `[Cảnh báo: Minh chứng đã bị xóa]`.
* **Lint Warning Hardening**:
  - **Issue**: Mocking React hooks in Vitest Node environment for `PresentPanel.test.tsx` triggered an ESLint warning for defined but unused variable `initial`.
  - **Resolution**: Removed the unused parameter from the mocked hook signature to ensure a warning-free build.

---

## 4. Weekly Deliverables Location
All W9 QA outputs and samples are located under:
- **Build Output Log**: [build_output.txt](file:///e:/ReportSupporter/Design/Reports/Month3/W9/build_output.txt)
- **Present Sample Outputs**: [present_samples.md](file:///e:/ReportSupporter/Design/Reports/Month3/W9/present_samples.md)
