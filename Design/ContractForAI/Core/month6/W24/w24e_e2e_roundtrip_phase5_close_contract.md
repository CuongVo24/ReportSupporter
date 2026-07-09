# Contract For AI - W24 Group E: E2E Round-trip & Phase 5 Close

> **Lane / Week:** Core / Month 6 / W24 - Day 5 (`Design/TaskBrief/Core/month6/w24.md` `[C204]`-`[C205]`).
> **Branch:** `feature/W24-import-hardening`.
> **Builds on:** Toàn bộ W21-W24 A-D; fixtures W21E/W22E/W23E; Export pipeline hiện có (HTML/PDF/DOCX).
> **Depended on by:** — (đóng Phase 5).
> **Sources:** `w24.md` Locked #5/#6, `TotalMonth6.md` Phase Exit Criteria, tiền lệ W12 (`e2e_scenario.md`).

---

## 1. Micro-task Target

Đóng Phase 5: chạy **E2E round-trip** — import cả 4 format (fixtures các tuần) → edit → check → export HTML/PDF/DOCX — ghi `e2e_roundtrip.md` từng bước; lập **`W24_Phase5_Acceptance_Report.md`** đối chiếu DoD 4 tuần + Phase Exit Criteria (`TotalMonth6.md`) + **bundle size gate** + **offline check**; cập nhật status `6.Import.md` §9. **Feature freeze — chỉ localized fix từ E2E.**

> **🔒 Close = freeze (Locked #5).** Lỗi lớn phát hiện Day 5 → break task tuần sau, không vá nóng.
> **🔒 Offline gate (Locked #6).** Toàn bộ import (kể cả pdf.js worker, OCR assets khi bật) không network call — chứng minh bằng network log trong report.
> **⚠️ E2E chạy sáng Day 5** — chừa buffer chiều cho localized fix.

## 2. Scope

### In scope (`[C204]`/`[C205]`)
- E2E scenario (**NEW** `Design/Reports/Month6/W24/e2e_roundtrip.md`): import `report-word.docx` + `report-word.pdf` + bảng điểm `.xlsx` + `defense-ppt.pptx` → preview (remap 1 heading, bỏ 1 section, xem issues) → commit → edit 1 section → check → export 3 format → mở file export kiểm mắt thường. Nhánh phụ: PDF scan → OCR (flag bật) → commit.
- Acceptance report (**NEW** `W24_Phase5_Acceptance_Report.md`): DoD map 4 tuần (`week21..24.md` §8); Phase Exit Criteria checklist (`TotalMonth6.md`); bundle size trước/sau Phase 5 (main bundle không phình quá gate — số cụ thể); offline evidence; perf số liệu từ W24D; tổng warning-honesty (mục "Không sang được" hợp nhất 4 tuần); + `build_output.txt`.
- `6.Import.md` §9 (MODIFY): status per tuần → done/ghi chú.
- Localized fix từ E2E (nhỏ, có kiểm soát, ghi trong report).

### Out of scope
- ❌ Feature mới/refactor (freeze); fix lỗi lớn (→ break task, ghi rõ trong report).
- ❌ Public demo/marketing (không thuộc Phase 5).

## 3. Checklist
- [ ] E2E 4 format pass trọn vòng; từng bước có ghi chép + kết quả.
- [ ] Nhánh OCR: flag bật → scan → text → commit OK; flag tắt → không dấu vết.
- [ ] Export 3 format từ nội dung import mở được, cấu trúc đúng (mắt thường + checker xanh).
- [ ] Bundle size gate: số trước/sau, main bundle trong ngưỡng; converters ở async chunks.
- [ ] Offline: import 4 format + OCR không network request (log đính kèm).
- [ ] DoD 4 tuần + Phase Exit Criteria tích đủ hoặc ghi rõ mục fail + break task tương ứng.
- [ ] `6.Import.md` §9 cập nhật; 4 gates xanh + `build_output.txt`.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `Design/Reports/Month6/W24/e2e_roundtrip.md` | NEW | kịch bản + kết quả |
| `Design/Reports/Month6/W24/W24_Phase5_Acceptance_Report.md` | NEW | DoD + exit criteria + gates |
| `Design/Reports/Month6/W24/build_output.txt` | NEW | 4 gates log |
| `Design/Modules/6.Import.md` | MODIFY | §9 status |
| `src/**` | MODIFY (nếu localized fix) | nhỏ, ghi trong report |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| E2E lộ lỗi tích hợp lớn | High | Chạy sáng Day 5; lớn → break task (Locked #5), report ghi trung thực. |
| Report "tô hồng" | Medium | Mục fail/limitation bắt buộc; đối chiếu số liệu W22E heading accuracy. |
| Bundle gate fail giờ chót | Medium | Đã kiểm per-tuần (W21-23); Day 5 chỉ xác nhận lại. |
| Export DOCX từ nội dung import lệch | Medium | Checker + mắt thường; lệch nhỏ ghi limitation, lớn → break task. |

## 6. Verification Plan
- Chạy trọn kịch bản e2e_roundtrip.md, đánh dấu pass/fail từng bước.
- 4 gates + toàn bộ Vitest Phase 5 xanh; axe 0 critical surface import.
- Review chéo acceptance report với `TotalMonth6.md` Phase Exit Criteria từng dòng.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `docs(reports): e2e roundtrip scenario + results`; `docs(reports): W24 Phase 5 acceptance report`; `docs(import): close phase 5 — update module status + commit w24e contract`.
