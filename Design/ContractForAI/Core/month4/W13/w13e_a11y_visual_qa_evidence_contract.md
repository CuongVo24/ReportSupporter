# Contract For AI - W13 Group E: A11y, Visual QA & Evidence Gate

> **Lane / Week:** Core / Month 4 / W13 - Day 5 (`Design/TaskBrief/Core/month4/w13.md` `[C144]`-`[C145]`).
> **Branch:** `feature/W13-ui-foundation`.
> **Builds on:** Group A–D (8 primitive + gallery), `Frontend/Other/Accessibility.md`, `0.ArtDirection.md` §11, `DesignSystem_Tokens.md §7b`.
> **Depended on by:** W14 adoption (dùng primitive đã pass a11y), `Design/Reports/Month4/`.
> **Sources:** `w13.md` Locked #2/#5, `MasterRoadMap.md` W13, `Conventions/WorkFlow.md` (DoD gate).

---

## 1. Micro-task Target

A11y pass toàn bộ primitive + Visual QA theo Art Direction, chạy 4 gates, và viết QA report + evidence (screenshots gallery light/dark). Cập nhật trạng thái component trong `Frontend/`.

> **🔒 States/A11y là điều kiện done (Locked #2).** Thiếu state/focus/aria = chưa xong.

## 2. Scope

### In scope (`[C144]`/`[C145]`)
- A11y pass (MODIFY tối thiểu primitive nếu lộ lỗi): keyboard reachable, focus-visible token (cấm `outline:none`), target ≥24px, severity không-chỉ-màu, `prefers-reduced-motion`.
- `Design/Reports/Month4/W13/W13_QA_Report.md` (**NEW**): map DoD + bảng coverage 8 component × states; `build_output.txt`; screenshots gallery (light/dark).
- `Design/Frontend/README.md` (MODIFY): trạng thái component → "implemented".

### Out of scope
- ❌ Thêm component mới / feature; refactor panel (W14).
- ❌ Đổi behavior/shape/CanonicalTypes.
- ❌ Full axe E2E (đã có ở W12; adoption-level a11y ở W14).

## 3. Checklist
- [ ] Mọi primitive keyboard reachable + focus-visible token.
- [ ] Target ≥24px; severity icon+chữ; reduced-motion honored.
- [ ] Visual QA `0.ArtDirection.md §11` (6 câu) + anti-patterns §6 pass.
- [ ] lint/typecheck/test/build xanh; `build_output.txt` lưu.
- [ ] QA report + screenshots light/dark; `Frontend/README.md` cập nhật.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/ui/*` | MODIFY (nếu cần) | fix a11y tối thiểu |
| `Design/Reports/Month4/W13/W13_QA_Report.md` | NEW | DoD + coverage |
| `Design/Reports/Month4/W13/build_output.txt` | NEW | gate log |
| `Design/Frontend/README.md` | MODIFY | trạng thái "implemented" |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| A11y lỗi ẩn (focus/aria) | Medium | Keyboard pass + checklist `Accessibility.md`. |
| "Fix a11y" lén đổi behavior | Low | MODIFY tối thiểu; không đổi shape (DoD). |
| Coverage thiếu state | Low | Bảng coverage 8 component × states bắt buộc. |

## 6. Verification Plan
- Tab toàn gallery → focus order hợp lý, ring rõ mọi primitive.
- Severity/readiness badge có icon+chữ; reduced-motion tắt animation.
- 4 gates xanh; report + evidence đầy đủ.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `fix(ui): a11y pass primitives (focus/keyboard/aria)`; `docs(reports): add W13 QA report + evidence`; `docs(ui): commit w13e contract`.
