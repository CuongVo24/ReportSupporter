# Contract For AI - W15 Group B: Cross-screen Visual QA (Art Direction)

> **Lane / Week:** Core / Month 4 / W15 - Day 2 (`Design/TaskBrief/Core/month4/w15.md` `[C158]`-`[C159]`).
> **Branch:** `feature/W15-ui-hardening`.
> **Builds on:** W14 adoption (mọi màn dùng primitive/pattern), `0.ArtDirection.md §11/§6`, `Frontend/3.Patterns/*`, `Frontend/4.Layouts/*`, `Frontend/5.Flows/*`.
> **Depended on by:** Group E (evidence), đóng Phase 4.
> **Sources:** `w15.md` Locked #1/#3, `MasterRoadMap.md` W15, `0.ArtDirection.md §11` (6 câu) + §6 (anti-patterns).

---

## 1. Micro-task Target

**Visual QA toàn màn** (Write/Check/Export/Submission/Evidence/Present/Shell) theo `0.ArtDirection.md §11` (6 câu) + anti-patterns §6; fix **tối thiểu** điểm trượt — không thêm feature/redesign. Đây là gate visual dời từ W14 Day 5 sang W15.

> **🔒 Verify + fix tối thiểu (Locked #1).** Không redesign; không đổi behavior/shape.
> **🔒 W15 gánh QA của W14 (Locked #3).**

## 2. Scope

### In scope (`[C158]`/`[C159]`)
- Visual QA mọi màn chính (Write/Check/Export/Submission/Evidence/Present/Shell) theo §11: một primary/màn, màu "kiếm được chỗ", đủ trạng thái, lấy từ component chung; không anti-pattern §6.
- Fix tối thiểu các điểm trượt (token/spacing/primary/state) — `src/**` MODIFY khi cần, không thêm feature.
- Ghi pass/fix theo từng màn (vào QA report Group E).

### Out of scope
- ❌ Axe (Group A), dark/motion/responsive (C), edge-state (D).
- ❌ Redesign/feature mới; đổi `--rs-report-*`/pipeline.

## 3. Checklist
- [ ] Mỗi màn qua §11 6 câu; không anti-pattern §6.
- [ ] Một primary/màn; màu có ngữ nghĩa (severity/primary), không trang trí.
- [ ] Đủ trạng thái; UI lấy từ component chung (ui/ + states/).
- [ ] Fix tối thiểu; không đổi behavior/shape; 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/**` | MODIFY (nếu trượt §11/§6) | fix tối thiểu visual |
| (ghi chú pass/fix) | — | tổng hợp ở `W15_QA_Report.md` (Group E) |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| "Polish" lén đổi behavior | Medium | Fix tối thiểu visual; diff review (Locked #1). |
| Redesign ngoài scope | Medium | Chỉ theo §11/§6; không thêm feature. |
| Bỏ sót màn | Medium | Checklist pin đủ live panels trong `Workspace.tsx`: Check/Export/Submission/Evidence/Present + Write/Shell. |

## 6. Verification Plan
- Duyệt từng màn theo §11; ghi pass/fix.
- Không màu trang trí thừa; một primary/màn.
- 4 gates xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `fix(ui): visual QA gate fixes per art direction (minimal)`; `docs(ui): commit w15b contract`.
