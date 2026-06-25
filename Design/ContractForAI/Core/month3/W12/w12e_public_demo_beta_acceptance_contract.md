# Contract For AI - W12 Group E: Public Demo & Beta Acceptance

> **Lane / Week:** Core / Month 3 / W12 - Day 5 (`Design/TaskBrief/Core/month3/w12.md` `[C134]`-`[C135]`).
> **Branch:** `feature/W12-beta-readiness`.
> **Builds on:** Groups A–D (E2E + export validation + states + a11y), W1–W11 toàn app.
> **Depended on by:** Phase 4 (W13–W15 UI investment trên app beta-ready), `Design/Reports/Month3/`.
> **Sources:** `w12.md` Locked #1/#5/#7, `MasterRoadMap.md` W12, `ProductPRD.md §7` (Success Criteria), `Conventions/WorkFlow.md` (DoD).

---

## 1. Micro-task Target

Chuẩn bị **public demo + README evidence** (demo workspace, không marketing page) + **Beta Acceptance Report** đối chiếu `ProductPRD.md §7` Success Criteria; final build/lint/typecheck/Vitest gate. **Đóng phần lõi Phase 1–3** (Phase 4 nối tiếp).

> **🔒 Demo no-AI (Locked #5).** Demo chạy được khi tắt AI (W11 optional).
> **🔒 Phase 4 nối tiếp (Locked #7).** W12 đóng lõi, không hết dự án.

## 2. Scope

### In scope (`[C134]`/`[C135]`)
- README evidence (**NEW**) trong `Design/Reports/Month3/W12/`: demo workspace, ảnh chụp, export samples (3 format đa template).
- `Design/Reports/Month3/W12/W12_Beta_Acceptance_Report.md` (**NEW**): đối chiếu Success Criteria (skeleton <2 phút, export 3 format, checker concrete, first screen = workspace).
- `Design/Reports/Month3/W12/build_output.txt` (**NEW**): final 4 gates log.

### Out of scope
- ❌ Cloud deploy bắt buộc / login (Non-goal).
- ❌ Marketing/landing page; tính năng mới.
- ❌ Axe automation (→ W15).

## 3. Checklist
- [ ] README evidence: demo workspace + ảnh + export samples đa template.
- [ ] Beta Acceptance đối chiếu `ProductPRD.md §7` đạt.
- [ ] Demo chạy được khi tắt AI; first screen = workspace.
- [ ] Final lint/typecheck/test/build xanh; `build_output.txt` lưu.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `Design/Reports/Month3/W12/` README evidence | NEW | demo + ảnh + export samples |
| `Design/Reports/Month3/W12/W12_Beta_Acceptance_Report.md` | NEW | Success Criteria |
| `Design/Reports/Month3/W12/build_output.txt` | NEW | final gate log |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Demo phụ thuộc AI | Medium | Demo no-AI; AI điểm cộng (Locked #5). |
| Thiếu evidence beta | Low | README evidence + acceptance chuẩn hoá. |
| Hiểu nhầm hết dự án | Low | Reconcile Phase 4 nối tiếp (Locked #7). |

## 6. Verification Plan
- Demo workspace chạy (AI OFF) đủ tính năng; export 3 format ra file.
- Đối chiếu từng Success Criteria `ProductPRD.md §7`.
- 4 gates xanh; evidence đầy đủ.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `docs(w12): public demo + README evidence`; `docs(w12): beta acceptance report`; `docs(w12): commit w12e contract`. Đóng phần lõi Phase 1–3 (Phase 4 W13–W15 nối tiếp).
