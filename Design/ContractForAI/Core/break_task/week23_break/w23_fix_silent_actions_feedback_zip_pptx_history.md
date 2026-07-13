# Contract For AI — W23 Fix (E): Hành Động Im Lặng — Zip/PPTX Không Phản Hồi · Lịch Sử Nộp Bài Lệch

> **Lane:** Core / break_task / week23_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Bug UX phản hồi + correctness đồng bộ. **Chốt nhánh race lịch sử trước khi sửa.**
> **Findings:**
> - **S1** (🟡) — **Tải evidence.zip không phản hồi.** `executeDownloadPackage` build zip rồi trigger `<a download>` **không toast** khi thành công; khi lỗi chỉ `console.error("Failed to build submission package:", err)` ([SubmissionPanel.tsx:96](src/modules/export/SubmissionPanel.tsx#L96)-L100). QA bấm "Tải về evidence.zip" → không toast, không lịch sử, không rõ đã tải hay chưa.
> - **S2** (🟡) — **Xuất PowerPoint không phản hồi.** Nút "Xuất PowerPoint (.pptx)" ([PresentPanel.tsx:151](src/modules/present/PresentPanel.tsx#L151), handler `disabled={slides.length===0 || isPptxExporting}` [PresentPanel.tsx:128](src/modules/present/PresentPanel.tsx#L128)) — QA bấm không thấy toast/tệp/thông báo. Cần xác nhận có sinh tệp không và luôn có phản hồi thành công/lỗi. (Lưu ý mâu thuẫn kèm: ExportPanel ghi "Xuất PPTX (Phase 3)… tạm hoãn" [ExportPanel.tsx:267](src/modules/export/ExportPanel.tsx#L267) trong khi Present panel có nút PPTX hoạt động — xử lý copy ở [[w23_polish_microcopy_diacritics_internal_labels_dialogs]], còn contract này lo **phản hồi** cho nút Present.)
> - **S3** (🟡) — **Lịch sử nộp bài lệch với lịch sử xuất bản.** `SubmissionPanel` đọc `loadExportHistory()` khi mount + khi `[jobs]` đổi ([SubmissionPanel.tsx:31](src/modules/export/SubmissionPanel.tsx#L31)-L38). `recordExport(finishedJob/failedJob)` được gọi **fire-and-forget (không await)** trong `use-export` ([use-export.ts:175](src/modules/export/use-export.ts#L175),L198,L259,L282). QA: sau 2 lần xuất **thành công** (HTML, DOCX), tab "Nộp bài" chỉ hiển thị **1 bản HTML (Lỗi)** cũ — nghi race: `refreshHistory` đọc IndexedDB **trước** khi `recordExport` ghi xong.
> **Builds on:** `SubmissionPanel.tsx` (zip, history), `PresentPanel.tsx` (pptx), `use-export.ts` (`recordExport`), `export-history.ts` (`loadExportHistory`/`recordExport`), toast pattern W13/W20.
> **Sources:** QA session 2026-07-13, phát hiện #8–#9 [[w25-ui-redesign]].

---

## 1. Micro-task Target

Mọi hành động sinh tệp (zip, pptx, export) **luôn** cho phản hồi rõ (toast thành công/lỗi, không `console.error` câm); lịch sử nộp bài **đồng bộ** với lịch sử xuất bản (không thiếu bản thành công).

- **S0 — Chốt nhánh race lịch sử (diagnose trước).** Re-test: xuất thành công → kiểm `loadExportHistory` có bản mới ngay không. Nếu thiếu → xác nhận race fire-and-forget `recordExport`.
- **S1 — Zip có phản hồi.** `executeDownloadPackage`: toast "Đã tạo gói nộp bài (.zip)" khi xong; toast lỗi rõ khi fail (thay `console.error` câm). (Tuỳ chọn) ghi vào lịch sử.
- **S2 — PPTX có phản hồi.** Nút Present PPTX: toast thành công (kèm tên tệp) hoặc lỗi; disable + spinner trong lúc chạy (đã có `isPptxExporting`) và **kết thúc luôn có kết quả hữu hình**.
- **S3 — Lịch sử đồng bộ.** `await recordExport(...)` rồi refresh, hoặc refresh sau khi ghi xong (không đọc trước ghi). `SubmissionPanel` và `ExportPanel` thấy cùng tập bản ghi.

> 🔒 **Im lặng là cấm** (kế thừa nguyên tắc W22): không hành động nào kết thúc mà không có phản hồi.
> 🔒 Không đổi schema lịch sử; dùng toast sẵn có. Không lib mới.

## 2. Scope

### In scope
- [src/modules/export/SubmissionPanel.tsx](src/modules/export/SubmissionPanel.tsx) (MODIFY): toast cho zip (thành công/lỗi); bỏ `console.error` câm; đồng bộ refresh lịch sử.
- [src/modules/present/PresentPanel.tsx](src/modules/present/PresentPanel.tsx) (MODIFY): toast cho PPTX (thành công/lỗi); bảo đảm kết thúc có phản hồi.
- [src/modules/export/use-export.ts](src/modules/export/use-export.ts) (MODIFY): `await recordExport` (hoặc bảo đảm thứ tự ghi→refresh) để lịch sử không lệch.
- [src/modules/export/export-history.ts](src/modules/export/export-history.ts) (VERIFY): `recordExport`/`loadExportHistory` atomic; không mất bản khi ghi liên tiếp.
- Test (NEW/UPDATE): xuất thành công → history có bản ngay; zip/pptx phát toast.

### Out of scope
- ❌ Đổi nội dung zip/pptx/định dạng.
- ❌ Copy "Phase 3" của ExportPanel (thuộc contract F).
- ❌ Thêm hàng đợi export mới.

## 3. Checklist
- [ ] **S0** Đã xác nhận nhánh race lịch sử; ghi vào PR.
- [ ] **S1** Zip: toast thành công + toast lỗi; không `console.error` câm.
- [ ] **S2** PPTX (Present): toast thành công/lỗi; kết thúc luôn hữu hình.
- [ ] **S3** Lịch sử nộp bài = lịch sử xuất bản (không thiếu bản thành công) sau nhiều lần xuất.
- [ ] 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/export/SubmissionPanel.tsx` | MODIFY | toast zip; đồng bộ refresh |
| `src/modules/present/PresentPanel.tsx` | MODIFY | toast pptx |
| `src/modules/export/use-export.ts` | MODIFY | await/thứ tự recordExport→refresh |
| `src/modules/export/export-history.ts` | VERIFY | atomic ghi/đọc |
| test tương ứng | NEW/UPDATE | history đồng bộ; toast |

> **Import boundary:** dùng toast/`recordExport` sẵn có; không lib mới.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Sửa sai nhánh (thêm toast nhưng race vẫn còn) | Med | Bắt buộc S0 diagnose; fix thứ tự ghi→đọc. |
| `await recordExport` làm chậm UI xuất | Low | Ghi nền nhưng refresh **sau** promise; hoặc optimistic add vào history state. |
| Toast trùng lặp khi xuất nhiều tệp | Low | Toast theo từng job/tệp, id riêng. |
| PPTX thực chất chưa sinh tệp | Med | S2 xác nhận handler tạo blob; nếu chưa, toast lỗi rõ thay vì im. |

## 6. Verification Plan
- Xuất HTML rồi DOCX (thành công) → mở tab "Nộp bài": lịch sử có **cả hai** bản Hoàn thành (không chỉ bản Lỗi cũ).
- Bấm "Tải về evidence.zip" (đủ điều kiện): toast "Đã tạo gói nộp bài"; tệp tải xuống. Ép lỗi (xoá evidence) → toast lỗi rõ.
- Tab Slide → "Xuất PowerPoint (.pptx)": toast thành công + tệp, hoặc toast lỗi; không im lặng.
- 4 gate xanh.

## 7. Status

`PROPOSED — chờ Approve`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `fix(export): add feedback for zip/pptx and sync submission history`.
