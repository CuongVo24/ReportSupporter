# Contract For AI - W14 Group B: Write/Format Panels + Core Patterns

> **Lane / Week:** Core / Month 4 / W14 - Day 2 (`Design/TaskBrief/Core/month4/w14.md` `[C148]`-`[C149]`).
> **Branch:** `feature/W14-ui-adoption`.
> **Builds on:** Group A (shell), W13 form primitives (Input/Textarea/Select/Button), `Frontend/3.Patterns/*`, `Frontend/5.Flows/Write.md`, `Frontend/Other/VoiceAndContent.md §5`.
> **Depended on by:** Group C (panel phải dùng cùng pattern), Group D (microcopy).
> **Sources:** `w14.md` Locked #1/#2, `MasterRoadMap.md` W14, `Modules/1.Write.md` (metadata/template/autosave).

---

## 1. Micro-task Target

Thay form primitive vào **Write/metadata/template** surfaces + áp pattern nền: `EmptyState`/`LoadingSkeleton`/`ErrorState` shared, `FormValidation` (blur/submit), `Feedback` (autosave quiet). Không đổi behavior.

> **🔒 Adoption only (Locked #1).** Không logic mới; metadata schema/CanonicalTypes giữ nguyên.
> **🔒 Tái dùng `src/components/states/` (W12) — nâng cấp, không lặp.**

## 2. Scope

### In scope (`[C148]`/`[C149]`)
- Write/metadata/template surfaces (MODIFY): dùng `Input`/`Textarea`/`Select`/`Button`; áp `FormValidation` (aria, blur/submit); `Feedback` autosave quiet ("Đã lưu").
- `src/components/states/` (NEW/MODIFY): `EmptyState`/`LoadingSkeleton`/`ErrorState` shared (≤200 dòng/file), token-only; copy từ `VoiceAndContent.md §5`.
- Áp empty/loading: chưa có report, report trống, preview đang render (`3.Patterns/EmptyStates.md`/`LoadingSkeleton.md`).

### Out of scope
- ❌ Panel Check/Export/Present (Group C).
- ❌ Editor CodeMirror internals (giữ nguyên); pipeline/preview logic.
- ❌ Đổi schema metadata/template.

## 3. Checklist
- [ ] Metadata/template form dùng Input/Textarea/Select/Button; aria + validate blur/submit.
- [ ] Autosave feedback quiet ("Đã lưu") — không spam toast.
- [ ] Shared states EmptyState/LoadingSkeleton/ErrorState token-only.
- [ ] Empty: chưa có report / report trống (copy `VoiceAndContent §5`, có CTA).
- [ ] Loading: preview render skeleton (<300ms không nháy).
- [ ] Behavior không đổi; 4 gates + axe 0 critical.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/write/**` surfaces | MODIFY | dùng form primitives |
| `src/components/states/*` | NEW/MODIFY | empty/loading/error shared |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Adoption đổi behavior form | High | Chỉ thay UI; giữ logic/schema (Locked #1). |
| Spam toast autosave | Medium | Autosave = quiet inline (`Feedback.md`). |
| Lặp lại states W12 | Medium | Nâng cấp shared, reconcile W12 (note). |
| Empty-state để trắng | Low | Có copy + CTA (`EmptyStates.md`). |
| File > 200 dòng | Low | Tách subcomponent. |

## 6. Verification Plan
- Nhập metadata sai → error inline + aria; blur mới validate.
- Autosave → "Đã lưu" quiet, không toast spam.
- Xoá hết report → empty-state có CTA; preview render → skeleton.
- Export mẫu parity; 4 gates + axe 0 critical.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `refactor(write): adopt form primitives + validation`; `feat(ui): shared empty/loading/error states`; `docs(ui): commit w14b contract`.
