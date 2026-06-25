# Contract For AI - W13 Group A: UI Stack Bootstrap + Button + Badge

> **Lane / Week:** Core / Month 4 / W13 - Day 1 (`Design/TaskBrief/Core/month4/w13.md` `[C136]`-`[C137]`).
> **Branch:** `feature/W13-ui-foundation`.
> **Builds on:** `DesignSystem_Tokens.md` (`var(--rs-*)`), `Design/Frontend/2.Components/_ComponentSpecRule.md` · `Button.md` · `Badge.md` · `Other/Icons.md`.
> **Depended on by:** Group B–D (mọi primitive dùng convention `ui/` + Button/Badge), W14 adoption.
> **Sources:** `w13.md` Locked #1/#2/#6, `MasterRoadMap.md` W13, `TechnicalStack §2b/§8c` (Radix+Lucide), `0.ArtDirection.md` §1/§3/§11.

---

## 1. Micro-task Target

Bootstrap **UI stack** (Radix headless + Lucide, exact pin) + convention `src/components/ui/` (co-located `.tsx`+`.css`, public `index.ts`), rồi build hai primitive nền: **Button** (4 variant × 2 size × icon-only/full-width × đủ states) và **Badge** (3 nhóm severity/readiness/status, icon+chữ, clickable).

> **🔒 Headless + token-only (Locked #1).** Style 100% `var(--rs-*)`; không hardcode hex/px; không UI kit có style.
> **🔒 States là điều kiện done (Locked #2).** Đủ default/hover/active/focus-visible/disabled/loading theo `_ComponentSpecRule.md` §3.
> **🔒 Không refactor panel (Locked #3).** Chỉ thêm `ui/`; không đụng module.

## 2. Scope

### In scope (`[C136]`/`[C137]`)
- `package.json` (MODIFY): add `@radix-ui/react-{dialog,tabs,toast,select}` + `lucide-react` exact; `npm install --save-exact` → sync `package-lock.json`.
- `src/components/ui/` (**NEW**): convention co-located + `index.ts` public surface.
- `src/components/ui/Button.tsx` + `Button.css` (**NEW**): theo `Button.md`.
- `src/components/ui/Badge.tsx` + `Badge.css` (**NEW**): theo `Badge.md` (icon Lucide + chữ; clickable = `<button>`).

### Out of scope
- ❌ Form primitives (Group B), overlays (Group C), Tabs/gallery (Group D).
- ❌ Refactor panel/module, đổi behavior/shape/CanonicalTypes.
- ❌ Token mới (nếu thiếu → bổ sung `DesignSystem_Tokens.md` trước, không hardcode).

## 3. Checklist
- [ ] Radix×4 + lucide-react exact pin; lockfile commit; `npm ci` xanh.
- [ ] `ui/` convention + `index.ts`; CSS co-located, token-only.
- [ ] Button: primary/secondary/ghost/danger · md/sm · icon-only(`aria-label`)/full-width.
- [ ] Button states: default/hover/active/**focus-visible**/disabled/**loading**(`Loader2`,`aria-busy`,khoá click).
- [ ] Badge: severity/readiness/section-status; **icon + chữ** luôn; clickable = button focus-visible + aria-label.
- [ ] No hardcode hex/px (grep). 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `package.json` / `package-lock.json` | MODIFY | Radix×4 + lucide-react exact |
| `src/components/ui/index.ts` | NEW | public surface |
| `src/components/ui/Button.{tsx,css}` | NEW | `Button.md` |
| `src/components/ui/Badge.{tsx,css}` | NEW | `Badge.md`, icon+chữ |

> **Import boundary:** module ngoài import qua `components/ui/index.ts`; component đọc token, icon từ `lucide-react`.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Style đè / hardcode màu | Medium | Token-only; grep no-hex (Locked #1). |
| Thiếu state (happy-path) | Medium | `_ComponentSpecRule.md §3` checklist (Locked #2). |
| Radix lệch React 19 | Low | Exact pin kiểm; `npm install` resolve. |
| Badge phân biệt chỉ màu (a11y) | Medium | icon + nhãn chữ bắt buộc (`Badge.md §4`). |
| File > 200 dòng | Low | Tách `.css`/subcomponent (`VibeCode §3`). |

## 6. Verification Plan
- `npm ci` + lint/typecheck/test/build xanh.
- Render Button mọi variant×state (tab → focus ring token; loading khoá click lặp).
- Badge 3 nhóm có icon+chữ; clickable Enter/Space hoạt động.
- grep: không hex/px mới ngoài token.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. ⚠️ Approval bao gồm cài Radix×4 + `lucide-react` (exact pin, runtime). Đề xuất commit: `chore(ui): bootstrap ui/ + add radix+lucide (exact pin)`; `feat(ui): add Button primitive (variants/states/a11y)`; `feat(ui): add Badge primitive (severity/readiness/status)`; `docs(ui): commit w13a contract`.
