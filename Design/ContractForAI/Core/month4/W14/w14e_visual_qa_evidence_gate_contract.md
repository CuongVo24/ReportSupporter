# Contract For AI - W14 Group E: Visual QA Gate & Before/After Evidence

> **Lane / Week:** Core / Month 4 / W14 - Day 5 (`Design/TaskBrief/Core/month4/w14.md` `[C154]`-`[C155]`).
> **Branch:** `feature/W14-ui-adoption`.
> **Builds on:** Group A–D (UI đã adopt + polish), `0.ArtDirection.md` §11/§6, `Frontend/3.Patterns/*`, `Frontend/4.Layouts/*`, `Frontend/5.Flows/*`.
> **Depended on by:** Đóng Phase 4; `Design/Reports/Month4/`.
> **Sources:** `w14.md` Locked #1/#6, `MasterRoadMap.md` W14, `Conventions/WorkFlow.md` (DoD), `Conventions/TestStrategy.md`.

---

## 1. Micro-task Target

Visual QA toàn màn theo Art Direction (§11 6 câu + anti-patterns §6), chạy 4 gates + axe (0 critical, giữ chuẩn W12), và viết QA report + **before/after evidence** (light/dark, ≥3 viewport). Cập nhật trạng thái Frontend (Flows/Layouts/Patterns → implemented). Đóng Phase 4.

> **🔒 Không đổi behavior/shape (Locked #1).** Chỉ verify + document; fix tối thiểu khi gate đỏ.

## 2. Scope

### In scope (`[C154]`/`[C155]`)
- Visual QA mọi màn chính theo `0.ArtDirection.md §11`: một primary/màn, màu "kiếm được chỗ", đủ trạng thái, lấy từ component chung, không anti-pattern §6.
- 4 gates + axe (0 critical, light+dark); fix tối thiểu nếu đỏ.
- `Design/Reports/Month4/W14/W14_QA_Report.md` (**NEW**): map DoD + Art Direction checklist + Pattern/Layout/Flow coverage; `build_output.txt`.
- Before/after screenshots (light/dark, ≥3 viewport) các màn chính (**NEW**).
- `Design/Frontend/` (MODIFY): trạng thái Flows/Layouts/Patterns → "implemented".

### Out of scope
- ❌ Thêm feature / đổi shape / redesign mới.
- ❌ Đụng `--rs-report-*` / pipeline.

## 3. Checklist
- [ ] Mỗi màn qua §11 6 câu; không anti-pattern §6.
- [ ] lint/typecheck/test/build xanh; axe 0 critical (light+dark).
- [ ] QA report map DoD + checklist + coverage.
- [ ] Before/after screenshots (light/dark, ≥3 viewport).
- [ ] `Frontend/` trạng thái cập nhật; `build_output.txt` lưu.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/**` | MODIFY (nếu gate đỏ) | fix tối thiểu |
| `Design/Reports/Month4/W14/W14_QA_Report.md` | NEW | DoD + AD checklist |
| `Design/Reports/Month4/W14/build_output.txt` | NEW | gate log |
| `Design/Reports/Month4/W14/screenshots/` | NEW | before/after light/dark |
| `Design/Frontend/README.md` + tầng | MODIFY | trạng thái implemented |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| "Polish" lén đổi behavior | Medium | Chỉ verify/fix tối thiểu (Locked #1). |
| Gate đỏ cuối tuần | Medium | Fix tối thiểu, không thêm feature. |
| Evidence thiếu (1 theme/viewport) | Low | Bắt buộc light+dark × ≥3 viewport. |
| Bỏ sót màn trong QA | Low | Checklist theo Flows/Layouts. |

## 6. Verification Plan
- Duyệt từng màn theo §11; ghi pass/fix.
- axe light+dark 0 critical; 4 gates xanh.
- Đối chiếu before/after: cải thiện thị giác rõ, behavior không đổi.
- Report + evidence đầy đủ; Phase 4 đóng.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `fix(ui): visual QA gate fixes (minimal)`; `docs(reports): add W14 QA report + before/after evidence`; `docs(ui): commit w14e contract`.
