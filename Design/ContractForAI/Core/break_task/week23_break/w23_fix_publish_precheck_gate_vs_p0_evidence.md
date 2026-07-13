# Contract For AI — W23 Fix (A): Dialog Tiền-Kiểm Xuất Bản Mâu Thuẫn Với Gate P0 Evidence (Nói "Xuất Được" Rồi Fail)

> **Lane:** Core / break_task / week23_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Bug UX/correctness luồng nộp bài. **Keystone tuần**, làm trước tiên.
> **Findings:**
> - **S1** (🔴) — **Hai nguồn validation lệch nhau; P0 vô hình ở dialog.** Bấm "Xuất HTML/DOCX": `handleExportClick` gọi `validateExport(bundle)` — **chỉ** kiểm caption/format ([ExportPanel.tsx:73](src/modules/export/ExportPanel.tsx#L73)-L84); nếu có issue thì mở dialog "Kiểm tra chất lượng báo cáo" với thông điệp **"Báo cáo có một số cảnh báo định dạng nhẹ. Bạn vẫn có thể xuất bản."** ([ExportPanel.tsx:339](src/modules/export/ExportPanel.tsx#L339)). Người dùng bấm **"Vẫn xuất bản"** ([ExportPanel.tsx:184](src/modules/export/ExportPanel.tsx#L184)). Nhưng `executeExport` **bên trong** lại chạy `runChecker(bundle)`, lọc `severity === "error"` (P0: thiếu evidence github/video/deploy) và **ném `ExportError`** với message "Không thể xuất bản báo cáo do có lỗi nghiêm trọng (P0)…" ([use-export.ts:22](src/modules/export/use-export.ts#L22)-L32). Kết quả: job chuyển "Lỗi", user bị dẫn **2 bước** rồi mới biết bị chặn bởi lỗi **không hề xuất hiện** trong dialog.
> - **S2** (🔴) — **Nút "Vẫn xuất bản" không phản ánh lỗi chặn.** `validationDialogFooter` đổi `variant` theo `validationResult?.ok` ([ExportPanel.tsx:181](src/modules/export/ExportPanel.tsx#L181)) — nhưng `validationResult` từ `validateExport` **không** chứa P0 evidence, nên nút luôn cho phép bấm dù có lỗi chặn thật. Không disable, không cảnh báo P0.
> - **S3** (🟡) — **Cùng lỗi ở luồng nộp bài.** `SubmissionPanel` cũng dùng `validateExport` cho dialog tiền-đóng-gói ([SubmissionPanel.tsx:104](src/modules/export/SubmissionPanel.tsx#L104), thông điệp [SubmissionPanel.tsx:227](src/modules/export/SubmissionPanel.tsx#L227)) trong khi zip cũng phụ thuộc export blob (gián tiếp gate P0). Cần đồng bộ chung.
> **Builds on:** `ExportPanel.tsx` (`handleExportClick`, `handleConfirmValidationExport`, dialog), `use-export.ts` (`executeExport` P0 gate), `validate-export.ts` (`validateExport`), `run-checker.ts` (`runChecker`), `SubmissionPanel.tsx`.
> **Sources:** QA session 2026-07-13 (drive dev server), phát hiện #1–#2 [[w25-ui-redesign]].

---

## 1. Micro-task Target

Bảo đảm dialog tiền-kiểm và gate thực thi **cùng một sự thật**: nếu có **P0 chặn** (thiếu evidence bắt buộc / thiếu chương bắt buộc), dialog phải **hiển thị chính xác** các lỗi đó, **disable "Vẫn xuất bản"**, và chỉ đường sửa; nếu chỉ có **warning** (caption/format nhẹ) thì cho phép "Vẫn xuất bản" như hiện tại. Không bao giờ để user bấm "xuất" rồi mới fail bởi lỗi ẩn.

- **S1 — Một nguồn kiểm trước xuất.** Dialog tiền-kiểm phải chạy **cùng `runChecker`** (hoặc hợp nhất kết quả `validateExport` + `runChecker`) để **phân loại**: có P0 → trạng thái "chặn"; chỉ warning → trạng thái "cảnh báo, vẫn xuất được". Thông điệp và danh sách lỗi khớp đúng phân loại.
- **S2 — Chặn đúng lúc.** Khi có P0: đổi thông điệp sang "Còn N lỗi bắt buộc phải sửa trước khi xuất", liệt kê từng lỗi kèm **tên mục** (không UUID — xem [[w23_fix_issues_panel_section_title_not_uuid]]) và lối dẫn (vd "Thêm minh chứng github trong Evidence Kit"); **disable** nút xuất; giữ nút "Đóng"/"Đi tới sửa".
- **S3 — Đồng bộ luồng nộp bài.** `SubmissionPanel` dùng cùng logic phân loại.

> 🔒 **Không nới lỏng gate.** P0 vẫn chặn; chỉ làm nó **hiển thị + chặn ở dialog** thay vì fail thầm sau khi bấm. Warning vẫn cho xuất.
> 🔒 Không đổi `runChecker`/`validateExport` (luật); chỉ hợp nhất & surface. Microcopy theo `§7`.

## 2. Scope

### In scope
- [src/modules/export/ExportPanel.tsx](src/modules/export/ExportPanel.tsx) (MODIFY): `handleExportClick` hợp nhất `validateExport` + `runChecker`; dialog phân biệt P0 (chặn, disable nút) vs warning (cho xuất); liệt kê lỗi P0 với tên mục + lối dẫn.
- [src/modules/export/use-export.ts](src/modules/export/use-export.ts) (MODIFY nhẹ nếu cần): expose kết quả checker để panel dùng chung, tránh chạy 2 lần; giữ gate ném lỗi làm lớp bảo vệ cuối (defense-in-depth) nhưng path thường phải chặn **trước** khi tới đây.
- [src/modules/export/SubmissionPanel.tsx](src/modules/export/SubmissionPanel.tsx) (MODIFY): áp cùng phân loại P0/warning cho dialog tiền-đóng-gói.
- Test (NEW/UPDATE): báo cáo thiếu evidence github → bấm xuất → dialog **hiển thị P0 + nút disable**, không tạo job "Lỗi"; báo cáo đủ evidence, chỉ thiếu caption → dialog warning, "Vẫn xuất" chạy được.

### Out of scope
- ❌ Đổi luật `runChecker`/`validateExport`/quy tắc evidence bắt buộc.
- ❌ Đổi cơ chế export blob / lịch sử (thuộc [[w23_fix_silent_actions_feedback_zip_pptx_history]]).
- ❌ Tên file (thuộc [[w23_fix_export_filename_diacritics_slug]]).

## 3. Checklist
- [ ] **S1** Dialog tiền-kiểm chạy cùng nguồn checker; phân loại P0 vs warning đúng.
- [ ] **S2** Có P0 → thông điệp "phải sửa", liệt kê lỗi + tên mục + lối dẫn, **disable** "Vẫn xuất bản".
- [ ] **S2** Chỉ warning → cho phép "Vẫn xuất bản" như cũ; xuất thành công.
- [ ] **S3** `SubmissionPanel` đồng bộ phân loại; không đóng gói khi còn P0 mà không báo.
- [ ] Không còn cảnh "bấm xuất → job Lỗi P0 không báo trước". 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/export/ExportPanel.tsx` | MODIFY | hợp nhất validate+checker; dialog phân loại P0/warning; disable nút khi P0 |
| `src/modules/export/use-export.ts` | MODIFY nhẹ | expose checker result dùng chung; giữ gate cuối |
| `src/modules/export/SubmissionPanel.tsx` | MODIFY | đồng bộ phân loại cho tiền-đóng-gói |
| `src/modules/export/ExportPanel.test.tsx` hoặc `use-export.test.ts` | NEW/UPDATE | test P0 chặn ở dialog + warning cho xuất |

> **Import boundary:** không lib mới; dùng `runChecker`/`validateExport` sẵn có.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Hợp nhất làm chạy checker 2 lần (dialog + executeExport) gây chậm | Low | Tính checker một lần, truyền xuống; `executeExport` giữ gate như lớp cuối rẻ. |
| Nới lỏng nhầm gate khi refactor | High→mitigated | Test bắt buộc: thiếu evidence → **không** tạo job done; giữ gate ném lỗi trong `executeExport`. |
| Warning bị nâng nhầm thành chặn (chặn caption) | Med | Chỉ `severity==="error"` mới chặn; caption/format = warning, vẫn cho xuất. |
| Tên mục trong danh sách P0 hiện UUID | Low | Phụ thuộc [[w23_fix_issues_panel_section_title_not_uuid]]; dùng map sectionId→title chung. |

## 6. Verification Plan
- Tạo báo cáo template (thiếu evidence github/video/deploy). Bấm "Xuất HTML": dialog hiển thị **"Còn 3 lỗi bắt buộc"** liệt kê 3 evidence thiếu + tên mục; nút "Vẫn xuất bản" **disabled**; đóng dialog **không** sinh job "Lỗi".
- Thêm đủ 3 evidence, còn 2 cảnh báo caption. Bấm "Xuất HTML": dialog warning "cảnh báo nhẹ, vẫn xuất được"; bấm "Vẫn xuất bản" → job **Hoàn thành**.
- Lặp cho DOCX và luồng "Tải evidence.zip" (SubmissionPanel): cùng hành vi phân loại.
- Kiểm bằng bàn phím/screen-reader: lỗi P0 được announce; nút disabled có `aria-disabled`. 4 gate xanh.

## 7. Status

`PROPOSED — chờ Approve`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `fix(export): surface P0 blocking issues in pre-flight dialog and gate publish button`.
