# Contract For AI - W12 Group C: UI States Polish

> **Lane / Week:** Core / Month 3 / W12 - Day 3 (`Design/TaskBrief/Core/month3/w12.md` `[C130]`-`[C131]`).
> **Branch:** `feature/W12-beta-readiness`.
> **Builds on:** Module 1–5 panels (Editor/Preview/Checker/Export/Present), `WorkspaceLayout.tsx`, `DesignSystem_Tokens.md`.
> **Depended on by:** **W14** (`w14b` nâng cấp `src/components/states/` baseline này — reconcile, không lặp), Group E (acceptance).
> **Sources:** `w12.md` Locked #1/#6, `MasterRoadMap.md` W12 ("Polish UI states"), `ProductPRD.md §7` (first screen = workspace).

---

## 1. Micro-task Target

Dựng **shared states baseline** (`src/components/states/`: Empty/Loading/Error/Success) + áp nhất quán cho mọi panel; đảm bảo **first screen = workspace**. Đây là **nền** W14 nâng cấp bằng primitive/pattern mới.

> **🔒 Shared states là nền W14 (Locked #6).** Baseline token-only; W14 nâng cấp, không lặp.
> **🔒 First screen = workspace (`ProductPRD.md §7`).**

## 2. Scope

### In scope (`[C130]`/`[C131]`)
- `src/components/states/` (**NEW**): `EmptyState`/`LoadingState`/`ErrorState`/`SuccessState` (≤200 dòng/file), token-only, có copy + CTA cơ bản.
- Panels (MODIFY): `EditorPanel`/`PreviewPanel`/`CheckerPanel`/`ExportPanel`/`PresentPanel` dùng shared states nhất quán (loading/empty/error/success).
- `src/components/WorkspaceLayout.tsx` (MODIFY): first screen = workspace.

### Out of scope
- ❌ Primitive UI Phase 4 (Button/Dialog/Toast — W13); adoption refactor sâu (W14).
- ❌ Đổi logic/behavior panel; đổi shape.

## 3. Checklist
- [ ] `src/components/states/` baseline (Empty/Loading/Error/Success) token-only.
- [ ] Mọi panel dùng shared states nhất quán.
- [ ] First screen = workspace (`/`).
- [ ] Không đổi behavior/shape; ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/states/*` | NEW | Empty/Loading/Error/Success baseline |
| `src/modules/*/[Pp]anel*.tsx` | MODIFY | dùng shared states |
| `src/components/WorkspaceLayout.tsx` | MODIFY | first screen = workspace |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| States W12 trùng W14 | Medium | Baseline ở đây; W14 nâng cấp, không lặp (Locked #6). |
| Đổi behavior panel khi polish | Medium | Chỉ tầng trình bày states; diff review (Locked #1). |
| First screen trượt landing | Medium | Kiểm `/` = workspace. |
| File panel > 200 dòng | Low | Tách subcomponent. |

## 6. Verification Plan
- Mỗi panel: trạng thái loading/empty/error/success hiển thị nhất quán.
- `/` = workspace; không landing.
- 4 gates xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `feat(states): shared empty/loading/error/success baseline`; `refactor(panels): consistent ui states`; `docs(w12): commit w12c contract`.
