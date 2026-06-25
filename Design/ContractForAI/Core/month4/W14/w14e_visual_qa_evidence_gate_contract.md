# Contract For AI - W14 Group E: Adoption Self-check & Coverage Report

> **Lane / Week:** Core / Month 4 / W14 - Day 5 (`Design/TaskBrief/Core/month4/w14.md` `[C154]`-`[C155]`).
> **Branch:** `feature/W14-ui-adoption`.
> **Builds on:** Group A–D (UI đã adopt + polish), `0.ArtDirection.md` §11/§6, `Frontend/3.Patterns/*`, `Frontend/4.Layouts/*`, `Frontend/5.Flows/*`.
> **Depended on by:** **W15** (`w15a`–`w15e`: axe automation + Visual QA toàn diện + before/after evidence + **đóng Phase 4**).
> **Sources:** `w14.md` Locked #1/#6, `MasterRoadMap.md` W14/W15, `Conventions/WorkFlow.md` (DoD), `Conventions/TestStrategy.md`.

---

## 1. Micro-task Target

**Self-check adoption W14**: duyệt nhanh các màn vừa adopt theo Art Direction (§11 6 câu + anti-patterns §6), a11y **checklist thủ công**, chạy 4 gates, và viết **adoption coverage report** + screenshots cơ bản (light/dark). Gate toàn diện + before/after evidence + đóng Phase 4 **thuộc W15**.

> **🔒 Không đổi behavior/shape (Locked #1).** Chỉ verify + document; fix tối thiểu khi gate đỏ.
> **🔒 QA nặng dời sang W15.** Axe automation + Visual QA toàn màn + before/after ≥3 viewport + đóng Phase 4 → `w15b`–`w15e`.

## 2. Scope

### In scope (`[C154]`/`[C155]`)
- Self Visual QA các màn **vừa adopt** theo `0.ArtDirection.md §11` (6 câu) + anti-patterns §6: một primary/màn, đủ trạng thái, lấy từ component chung.
- A11y **checklist thủ công** (keyboard/focus/ARIA) sau adoption; fix tối thiểu nếu đỏ.
- 4 gates (lint/typecheck/test/build); fix tối thiểu nếu đỏ.
- `Design/Reports/Month4/W14/W14_QA_Report.md` (**NEW**): map DoD + adoption coverage (Pattern/Layout/Flow đã thay primitive); `build_output.txt`.
- Screenshots cơ bản (light/dark) các màn vừa adopt (**NEW**).

### Out of scope
- ❌ Axe automation (→ W15 `w15a`).
- ❌ Before/after evidence đầy đủ ≥3 viewport + cập nhật `Frontend/` "implemented" + đóng Phase 4 (→ W15 `w15e`).
- ❌ Thêm feature / đổi shape / redesign; đụng `--rs-report-*`/pipeline.

## 3. Checklist
- [ ] Mỗi màn vừa adopt qua §11 6 câu; không anti-pattern §6.
- [ ] A11y checklist thủ công (keyboard/focus/ARIA) pass.
- [ ] lint/typecheck/test/build xanh; `build_output.txt` lưu.
- [ ] W14 QA report map DoD + adoption coverage.
- [ ] Screenshots cơ bản (light/dark) các màn adopt.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/**` | MODIFY (nếu gate đỏ) | fix tối thiểu |
| `Design/Reports/Month4/W14/W14_QA_Report.md` | NEW | DoD + adoption coverage |
| `Design/Reports/Month4/W14/build_output.txt` | NEW | gate log |
| `Design/Reports/Month4/W14/screenshots/` | NEW | light/dark màn adopt (cơ bản) |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| "Self-check" lén đổi behavior | Medium | Chỉ verify/fix tối thiểu (Locked #1). |
| Gate đỏ cuối tuần | Medium | Fix tối thiểu, không thêm feature; spillover edge-state → W15 buffer. |
| Trùng việc với W15 | Low | W14 self-check theo tuần; gate toàn diện + đóng Phase 4 ở W15. |
| Bỏ sót màn adopt | Low | Checklist theo Flows/Layouts đã thay primitive. |

## 6. Verification Plan
- Duyệt từng màn vừa adopt theo §11; ghi pass/fix.
- A11y checklist thủ công pass; 4 gates xanh.
- W14 QA report + screenshots cơ bản đầy đủ.
- *(Axe 0 critical + before/after toàn diện + đóng Phase 4 verify ở W15.)*

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `fix(ui): adoption self-check fixes (minimal)`; `docs(reports): add W14 adoption coverage report`; `docs(ui): commit w14e contract`.
