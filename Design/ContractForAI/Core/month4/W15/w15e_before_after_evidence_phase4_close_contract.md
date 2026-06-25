# Contract For AI - W15 Group E: Before/After Evidence & Phase 4 Close

> **Lane / Week:** Core / Month 4 / W15 - Day 5 (`Design/TaskBrief/Core/month4/w15.md` `[C164]`-`[C165]`).
> **Branch:** `feature/W15-ui-hardening`.
> **Builds on:** Groups A–D (axe + visual QA + dark/motion/responsive + edge-state), W13/W14 adoption, `0.ArtDirection.md §11`, `Frontend/3.Patterns|4.Layouts|5.Flows/*`.
> **Depended on by:** **Đóng Phase 4**; `Design/Reports/Month4/`.
> **Sources:** `w15.md` Locked #1/#3, `MasterRoadMap.md` W15, `Conventions/WorkFlow.md` (DoD), `Conventions/TestStrategy.md`.

---

## 1. Micro-task Target

**Before/after evidence** (light/dark × ≥3 viewport) các màn chính (Write/Check/Export/Submission/Evidence/Present/Shell) + QA report (DoD + Art Direction §11 + axe summary + coverage + contrast manual note) + cập nhật trạng thái Frontend (Flows/Layouts/Patterns → implemented, "axe automated"). Chạy 4 gates + axe (0 critical). **Đóng Phase 4.**

> **🔒 Verify + document; fix tối thiểu khi gate đỏ (Locked #1).**
> **🔒 W15 gánh evidence của W13/W14 (Locked #3).** Before/after toàn diện hội tụ ở đây.

## 2. Scope

### In scope (`[C164]`/`[C165]`)
- `Design/Reports/Month4/W15/screenshots/` (**NEW**): before/after (light/dark × ≥3 viewport) các màn chính (Write/Check/Export/Submission/Evidence/Present/Shell).
- `Design/Reports/Month4/W15/W15_QA_Report.md` (**NEW**): map DoD + `0.ArtDirection.md §11` + axe summary (0 critical) + Pattern/Layout/Flow coverage + ghi rõ axe-jsdom không cover `color-contrast` và kết quả contrast manual.
- `Design/Reports/Month4/W15/build_output.txt` (**NEW**): 4 gates + axe log.
- `Design/Frontend/README.md` + tầng (MODIFY): trạng thái Flows/Layouts/Patterns → "implemented"; ghi "axe automated (W15)".

### Out of scope
- ❌ Thêm feature / đổi shape / redesign.
- ❌ Đụng `--rs-report-*`/pipeline.

## 3. Checklist
- [ ] Before/after screenshots (light/dark × ≥3 viewport) các màn chính (Write/Check/Export/Submission/Evidence/Present/Shell).
- [ ] lint/typecheck/test/build xanh; axe 0 critical (light+dark; contrast manual riêng).
- [ ] QA report map DoD + §11 + axe summary + coverage + manual contrast note.
- [ ] `Frontend/` trạng thái cập nhật "implemented" + "axe automated".
- [ ] `build_output.txt` lưu; Phase 4 đóng.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/**` | MODIFY (nếu gate đỏ) | fix tối thiểu |
| `Design/Reports/Month4/W15/screenshots/` | NEW | before/after light/dark |
| `Design/Reports/Month4/W15/W15_QA_Report.md` | NEW | DoD + §11 + axe summary + contrast note |
| `Design/Reports/Month4/W15/build_output.txt` | NEW | gate + axe log |
| `Design/Frontend/README.md` + tầng | MODIFY | implemented + axe automated |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| "Polish" lén đổi behavior | Medium | Chỉ verify/fix tối thiểu (Locked #1). |
| Gate/axe đỏ cuối tuần | Medium | Fix tối thiểu; không thêm feature; ưu tiên critical. |
| Evidence thiếu (1 theme/viewport) | Low | Bắt buộc light+dark × ≥3 viewport. |
| Bỏ sót màn trong QA | Medium | Pin danh sách live panels từ `Workspace.tsx`: Check/Export/Submission/Evidence/Present + Write/Shell. |
| Hiểu nhầm axe summary là contrast pass | Medium | QA report tách `axe 0 critical` và `manual contrast pass/fix`. |

## 6. Verification Plan
- Đối chiếu before/after: cải thiện thị giác rõ, behavior không đổi.
- axe light+dark 0 critical; 4 gates xanh; contrast manual pass/fix được ghi riêng.
- Report + evidence đầy đủ; `Frontend/` trạng thái cập nhật.
- Phase 4 đóng.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `fix(ui): final gate fixes (minimal)`; `docs(reports): W15 QA report + before/after evidence`; `docs(ui): commit w15e contract`. **Đóng Phase 4 (W13–W15).**
