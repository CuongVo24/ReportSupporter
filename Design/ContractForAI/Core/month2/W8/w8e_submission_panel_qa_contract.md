# Contract For AI - W8 Group E: Submission Panel & QA

> **Lane / Week:** Core / Month 2 / W8 - Day 5 (`Design/TaskBrief/Core/month2/w8.md` `[C94]`-`[C95]`).
> **Branch:** `feature/W8-submission-package`.
> **Builds on:** Group A (`buildSubmissionZip`), Group B (`generateReadme`), Group C (`buildSubmissionChecklist`), Group D (`loadExportHistory`), W4 `ExportPanel.tsx`/`useExport`, `src/components/Workspace.tsx`.
> **Depended on by:** Phase 2 quality gate (đóng "Submission MVP"), Phase 3 (Present đọc submission checklist surface).
> **Sources:** `w8.md` Locked Decisions #1/#2, `MasterRoadMap.md` W8, `4.Export.md`, `5.Present.md §4`, prior `W7_QA_Report.md` format, `Reports/README.md`.

---

## 1. Micro-task Target

Ghép các mảnh W8 thành **một luồng nộp bài** trong UI: nút "Tải evidence.zip" gọi zip (Group A) với README (B) + appendix (W5) + các blob export; hiển thị final checklist (C) và export history (D); rồi chạy 4 gates + viết QA evidence W8 (đóng Phase 2 Submission MVP).

> **🔒 Điều phối, không re-render (Locked #1).** Panel gom blob đã export + README + appendix vào zip; không gọi exporter/render lại. Checklist/history chỉ hiển thị dữ liệu engine.
> **🔒 Local-first (Locked #2).** Zip tải qua `a[download]`; history từ IndexedDB; không upload.
> **📌 Surfaces thực tế.** Mở rộng `src/modules/export/ExportPanel.tsx` (hoặc `SubmissionPanel.tsx` mới cùng module) + wiring trong `Workspace.tsx`; CSS chỉ `var(--rs-*)`.

## 2. Scope

### In scope (`[C94]`/`[C95]`)
- `src/modules/export/SubmissionPanel.tsx` (**NEW**) hoặc mở rộng `ExportPanel.tsx`: nút "Tải evidence.zip" (gọi `buildSubmissionZip` rồi download), danh sách `SubmissionChecklistItem` (done/fail + detail), danh sách export history (target · file · thời gian · trạng thái) + nút clear.
- `src/components/Workspace.tsx` (MODIFY): render panel; truyền bundle + `CheckResult` + `DocxLayoutCheck[]` + history.
- `src/modules/export/index.ts` (MODIFY): export panel.
- QA evidence: `Design/Reports/Month2/W8/W8_QA_Report.md` (map DoD `w8.md` + `4.Export.md`/`MasterRoadMap` W8), `submission_samples/` (cây `evidence.zip` mẫu, `README.md` sinh ra, ảnh checklist/history), `build_output.txt`.
- Vitest (component/logic ở mức khả thi): luồng zip nhận đúng input; checklist render đúng done/fail; history hiển thị từ store mock.

### Out of scope
- ❌ Viết lại logic zip/README/checklist/history (Groups A–D — chỉ wiring + hiển thị).
- ❌ Exporter mới / Puppeteer.
- ❌ Tính năng Present (→ W9).
- ❌ Dep mới / network.

## 3. Checklist
- [ ] Panel: nút tải `evidence.zip` (zip Group A từ export blob + README + appendix).
- [ ] Hiển thị final checklist (done/fail + detail) + export history (+ clear).
- [ ] Wiring trong `Workspace.tsx`; CSS chỉ `var(--rs-*)`.
- [ ] Không re-render export; local-first (download + IDB).
- [ ] `Design/Reports/Month2/W8/` có QA report + `submission_samples/` + build output.
- [ ] 4 gates xanh (lint/typecheck/test/build).

## 4. Expected Interfaces / Files

> Chủ yếu UI wiring + QA; tiêu thụ public surface Groups A–D, không thêm interface mới.

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/export/SubmissionPanel.tsx` | NEW | nút zip + checklist + history |
| `src/components/Workspace.tsx` | MODIFY | render + truyền props |
| `src/modules/export/index.ts` | MODIFY | export panel |
| `src/modules/export/SubmissionPanel.test.tsx` | NEW | zip input / checklist render / history list |
| `Design/Reports/Month2/W8/W8_QA_Report.md` | NEW | kết quả QC + DoD |
| `Design/Reports/Month2/W8/submission_samples/` | NEW | cây evidence.zip + README + ảnh checklist/history |
| `Design/Reports/Month2/W8/build_output.txt` | NEW | log 4 gates |

> **Import boundary:** panel import `@/modules/export` (A–D) + `@/types`. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Panel render lại export thay vì gom blob | Medium | Lấy blob từ `useExport`/cache; chỉ `buildSubmissionZip` (Locked #1). |
| Zip lớn block UI | Medium | `await` async + trạng thái "đang đóng gói"; cap evidence/ảnh nếu cần. |
| QA report lệch format các tuần trước | Low | Theo `W7_QA_Report.md` + `Reports/README.md`. |
| Checklist/history hiển thị sai nguồn | Low | Chỉ map dữ liệu Groups C/D; test render done/fail. |
| Scope creep sang Present | Low | Present để W9; chỉ chừa surface checklist. |

## 6. Verification Plan
- Bấm "Tải evidence.zip" → file zip tải về có report.*, README.md, evidence/appendix.md, manifest.json.
- Báo cáo chưa đạt readiness → checklist hiện mục fail + detail; đạt → tất cả done.
- Export vài lần → history liệt kê đúng, clear xoá sạch.
- `submission_samples/` chứng minh end-to-end (zip tree + README + checklist/history).
- lint/typecheck/test/build xanh; `build_output.txt` lưu.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(export): submission panel (evidence.zip + checklist + history)`; (2) `docs(w8): W8 QA report + submission samples`; +1 docs commit. Đóng Submission MVP (Phase 2).
