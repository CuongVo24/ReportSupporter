# Contract For AI - W12 Group A: End-to-end Scenario

> **Lane / Week:** Core / Month 3 / W12 - Day 1 (`Design/TaskBrief/Core/month3/w12.md` `[C126]`-`[C127]`).
> **Branch:** `feature/W12-beta-readiness`.
> **Builds on:** Toàn bộ W1–W11 (template/metadata/write/check/format/evidence/export/present + AI optional).
> **Depended on by:** Group B–E (issues fix + acceptance), W13–W15 Phase 4 (UI trên app ổn định).
> **Sources:** `w12.md` Locked #1/#5, `MasterRoadMap.md` W12, `ProductPRD.md §7` (Success Criteria).

---

## 1. Micro-task Target

Chạy **kịch bản end-to-end** một báo cáo dự án thật từ đầu đến gói nộp + present; ghi lỗi tích hợp thành issues fix cục bộ trong tuần. **Feature freeze** — không tính năng mới.

> **🔒 Feature freeze; localized fix (Locked #1).** Chỉ sửa cục bộ khi E2E lộ lỗi; không đổi shape/CanonicalTypes.
> **🔒 First screen = workspace; demo no-AI (Locked #5).**

## 2. Scope

### In scope (`[C126]`/`[C127]`)
- `Design/Reports/Month3/W12/e2e_scenario.md` (**NEW**): kịch bản từng bước (template → metadata → skeleton → write → check → format → evidence → export 3 format → present outline/script).
- Chạy kịch bản; ghi issues; localized fix (chỉ nếu lộ lỗi thật) — không đổi shape.

### Out of scope
- ❌ Tính năng mới; đổi CanonicalTypes/pipeline.
- ❌ Export validation đa template (Group B), states (C), a11y (D), demo (E).

## 3. Checklist
- [ ] `e2e_scenario.md` mô tả trọn vòng từng bước.
- [ ] Chạy thông đường E2E chính; issues ghi lại.
- [ ] First screen = workspace; đường chạy không phụ thuộc AI.
- [ ] Chỉ localized fix; không đổi shape; 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `Design/Reports/Month3/W12/e2e_scenario.md` | NEW | kịch bản trọn vòng |
| `src/**` | MODIFY (chỉ nếu E2E fail) | localized fix, không đổi shape |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Lỗi tích hợp lộ muộn | High | Ưu tiên đường E2E chính; localized fix (Locked #1). |
| "Tiện tay" thêm feature | Medium | Feature freeze; diff review. |
| Đường E2E phụ thuộc AI | Medium | Chạy với AI OFF (Locked #5). |

## 6. Verification Plan
- Chạy trọn vòng 1 báo cáo thật → không chặn; export 3 format ra file.
- `/` = workspace; AI OFF vẫn đủ tính năng.
- 4 gates xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `docs(w12): e2e scenario script`; `fix(*): localized e2e issues (no shape change)`; `docs(w12): commit w12a contract`.
