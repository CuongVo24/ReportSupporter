# Contract For AI - W15 Group A: A11y Automation (axe)

> **Lane / Week:** Core / Month 4 / W15 - Day 1 (`Design/TaskBrief/Core/month4/w15.md` `[C156]`-`[C157]`).
> **Branch:** `feature/W15-ui-hardening`.
> **Builds on:** W13 primitives (`src/components/ui/*`), W14 adoption (panels), W12 `a11y_checklist.md` (baseline thủ công — `w12.md` C132/C133), `Frontend/Other/Accessibility.md`.
> **Depended on by:** Group B–E (gate axe 0 critical xuyên W15), đóng Phase 4.
> **Sources:** `w15.md` Locked #2/#4, `MasterRoadMap.md` W15, `TechnicalStack §7` (Playwright deferred → axe ở jsdom), `Conventions/TestStrategy.md`.

---

## 1. Micro-task Target

Dựng **axe automation** lần đầu của Phase 4: cài `axe-core` (devDependency, exact pin) chạy trong **Vitest + jsdom**, quét mọi primitive + shared states + màn chính, fix **tối thiểu** đến **0 critical**. Không Playwright, không runtime dep.

> **🔒 Axe = devDependency, jsdom (Locked #2).** Không kéo Playwright; axe không vào bundle runtime.
> **🔒 Axe gate hội tụ ở W15 (Locked #4).** W12–W14 a11y thủ công; W15 chốt 0 critical.

## 2. Scope

### In scope (`[C156]`/`[C157]`)
- `package.json`/`package-lock.json` (MODIFY): add **devDependency** `axe-core` (+ `vitest-axe` nếu dùng matcher), exact pin, `npm install --save-exact`.
- Harness a11y trong Vitest + jsdom (`*.a11y.test.tsx` hoặc `src/components/ui/__a11y__/`) (**NEW**).
- Chạy axe trên `src/components/ui/*` + `src/components/states/*` + màn chính; fix tối thiểu → 0 critical (không đổi shape/behavior).

### Out of scope
- ❌ Playwright/E2E axe (deferred).
- ❌ Axe như runtime dep; import vào bundle.
- ❌ Visual QA §11 (Group B), dark/motion/responsive (C), edge-state (D), evidence (E).

## 3. Checklist
- [ ] `axe-core` devDependency exact pin; lockfile commit; `npm ci` xanh.
- [ ] Harness axe chạy trong Vitest+jsdom (không Playwright).
- [ ] Quét primitive + states + màn chính; **0 critical**.
- [ ] Fix tối thiểu, không đổi shape/behavior; axe không vào bundle runtime.
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `package.json` / `package-lock.json` | MODIFY | `axe-core` (+`vitest-axe`) devDep exact |
| `src/components/ui/__a11y__/*.a11y.test.tsx` | NEW | harness jsdom |
| `src/components/**` | MODIFY (nếu critical) | fix a11y tối thiểu |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Cài axe như runtime nhầm | Medium | devDependency; không import vào bundle (Locked #2). |
| "Fix a11y" lén đổi behavior | Medium | Fix tối thiểu; không đổi shape (Locked #1 tuần). |
| Critical nhiều, tràn ngày | Medium | Ưu tiên critical; spillover sang Day 4 buffer. |
| Kéo Playwright ngoài lịch | Low | jsdom-only; Playwright deferred (`§7`). |

## 6. Verification Plan
- `npm ci` xanh; `vitest` chạy harness axe.
- axe trên primitive/states/màn chính → 0 critical.
- grep: `axe-core` không import trong code runtime (chỉ test).
- 4 gates xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. ⚠️ Approve bao gồm cài `axe-core` (+`vitest-axe`) **devDependency** exact pin. Đề xuất commit: `chore(a11y): add axe-core (dev) + jsdom harness`; `fix(a11y): drive primitives/panels to 0 critical`; `docs(ui): commit w15a contract`.
