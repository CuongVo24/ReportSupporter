# Contract For AI - W15 Group A: A11y Automation (axe)

> **Lane / Week:** Core / Month 4 / W15 - Day 1 (`Design/TaskBrief/Core/month4/w15.md` `[C156]`-`[C157]`).
> **Branch:** `feature/W15-ui-hardening`.
> **Builds on:** W13 primitives (`src/components/ui/*`), W14 adoption (panels), W12 `a11y_checklist.md` (baseline thủ công — `w12.md` C132/C133), `Frontend/Other/Accessibility.md`.
> **Depended on by:** Group B–E (gate axe 0 critical xuyên W15), đóng Phase 4.
> **Sources:** `w15.md` Locked #2/#4, `MasterRoadMap.md` W15, `TechnicalStack §7` (Playwright deferred → axe ở jsdom), `Conventions/TestStrategy.md`.

---

## 1. Micro-task Target

Dựng **axe automation** lần đầu của Phase 4: cài `axe-core` (devDependency, exact pin) chạy trong **Vitest + jsdom**, quét mọi primitive + shared states + màn chính, fix **tối thiểu** đến **0 critical**. Không Playwright, không runtime dep. **Lưu ý:** axe trong jsdom không cover rule `color-contrast`; contrast tối/dark/focus vẫn là manual/visual gate ở W15C/W15E.

> **🔒 Axe = devDependency, jsdom (Locked #2).** Không kéo Playwright; axe không vào bundle runtime.
> **🔒 Axe gate hội tụ ở W15 (Locked #4).** W12–W14 a11y thủ công; W15 chốt 0 critical.
> **⚠️ Giới hạn jsdom.** `0 critical` của axe-jsdom không đồng nghĩa đạt WCAG color contrast; phải ghi riêng kết quả kiểm contrast thủ công ở W15C/W15E.

## 2. Scope

### In scope (`[C156]`/`[C157]`)
- `package.json`/`package-lock.json` (MODIFY): add **devDependency** `axe-core` (+ `vitest-axe` nếu dùng matcher), exact pin, `npm install --save-exact`.
- Harness a11y trong Vitest + jsdom (`*.a11y.test.tsx` hoặc `src/components/ui/__a11y__/`) (**NEW**).
- Chạy axe trên `src/components/ui/*` + `src/components/states/*` + màn chính (Write/Check/Export/Submission/Evidence/Present/Shell); fix tối thiểu → 0 critical (không đổi shape/behavior).
- Harness màn chính render qua test-wrapper từng panel/shell (`CheckerPanel`, `ExportPanel`, `SubmissionPanel`, `EvidencePanel`, `PresentPanel`, Write surfaces), không dựng nguyên Next route nếu provider/router làm jsdom giòn.
- Ghi rõ trong test/report: axe-jsdom không kiểm color contrast; contrast được verify thủ công/visual ở W15C/W15E.

### Out of scope
- ❌ Playwright/E2E axe (deferred).
- ❌ Axe như runtime dep; import vào bundle.
- ❌ Visual QA §11 (Group B), dark/motion/responsive + contrast manual (C), edge-state (D), evidence (E).

## 3. Checklist
- [ ] `axe-core` devDependency exact pin; lockfile commit; `npm ci` xanh.
- [ ] Harness axe chạy trong Vitest+jsdom (không Playwright).
- [ ] Quét primitive + states + màn chính (Write/Check/Export/Submission/Evidence/Present/Shell); **0 critical**.
- [ ] Test-wrapper từng panel/shell; không phụ thuộc render full Next app-route trong jsdom.
- [ ] Report ghi rõ axe-jsdom không cover `color-contrast`; contrast chuyển sang W15C/W15E.
- [ ] Fix tối thiểu, không đổi shape/behavior; axe không vào bundle runtime.
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `package.json` / `package-lock.json` | MODIFY | `axe-core` (+`vitest-axe`) devDep exact |
| `src/components/ui/__a11y__/*.a11y.test.tsx` | NEW | harness jsdom |
| `src/components/Workspace.tsx` / `WorkspaceLayout.tsx` | TEST TARGET | shell wrapper, không full route nếu giòn |
| `src/modules/{check,export,evidence,present}/**/*Panel.tsx` | TEST TARGET | panel wrappers, gồm Submission/Evidence |
| `src/components/**` | MODIFY (nếu critical) | fix a11y tối thiểu |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Cài axe như runtime nhầm | Medium | devDependency; không import vào bundle (Locked #2). |
| "Fix a11y" lén đổi behavior | Medium | Fix tối thiểu; không đổi shape (Locked #1 tuần). |
| Critical nhiều, tràn ngày | Medium | Ưu tiên critical; spillover sang Day 4 buffer. |
| Hiểu nhầm axe-jsdom đã bắt contrast | Medium | Ghi limitation; W15C/W15E phải kiểm contrast thủ công/visual. |
| Full route jsdom giòn | Medium | Render từng panel qua test-wrapper/provider tối thiểu. |
| Kéo Playwright ngoài lịch | Low | jsdom-only; Playwright deferred (`§7`). |

## 6. Verification Plan
- `npm ci` xanh; `vitest` chạy harness axe.
- axe trên primitive/states/màn chính → 0 critical; màn chính render qua test-wrapper từng panel/shell.
- Contrast dark/focus không lấy từ axe-jsdom; ghi pending/pass manual check cho W15C/W15E.
- grep: `axe-core` không import trong code runtime (chỉ test).
- 4 gates xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. ⚠️ Approve bao gồm cài `axe-core` (+`vitest-axe`) **devDependency** exact pin. Đề xuất commit: `chore(a11y): add axe-core (dev) + jsdom harness`; `fix(a11y): drive primitives/panels to 0 critical`; `docs(ui): commit w15a contract`.
