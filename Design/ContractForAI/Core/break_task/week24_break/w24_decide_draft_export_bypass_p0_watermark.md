# Contract For AI — W24 Decide: Có Cho "Xuất Bản Nháp" Bỏ Qua P0 (Watermark DRAFT) Để Xem Thử Word/PDF?

> **Lane:** Core / break_task / week24_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** **Decide** — chốt chủ ý trước, **chưa** sửa code. (Kiểu contract "decide" như W16/W23.)
> **Findings:**
> - **S1** (🟡) — **Gate P0 cứng chặn cả việc xem thử.** `executeExport` ném lỗi khi có bất kỳ P0 nào ([use-export.ts:23](src/modules/export/use-export.ts#L23)-L33); dialog preflight disable "Vẫn xuất bản" khi `hasP0` ([ExportPanel.tsx:158](src/modules/export/ExportPanel.tsx#L158), W23-A). ⇒ Sinh viên **không thể xuất bất kỳ file Word/PDF nào** để xem bố cục khi báo cáo còn P0 — mà P0 rất dễ dính (thiếu đủ 4 evidence github/demo/deploy/video, một ảnh body chưa nhúng). Trong lúc soạn dở, muốn xem thử bản in cũng không được.
> - **S2** (🟡) — **Căng thẳng với W23 lock "không nới lỏng gate".** W23-A cố tình chặn cứng để bản **nộp** không lỗi. Nhu cầu "xem thử" **chính đáng** nhưng nếu mở phải **có kiểm soát** (watermark, không nhầm là bản nộp), nếu không sẽ phá đúng thứ W23-A bảo vệ.
> **Builds on:** gate P0 (`use-export.ts`/`preflight.ts`, W23-A), `exportHtml`/`exportPdf`/`exportDocx`, `prepare-export` (nơi có thể chèn watermark), placeholder ảnh từ [[w24_fix_preview_unembedded_image_placeholder_no_network]].
> **Sources:** QA session 2026-07-14, phát hiện #3/#8 [[w25-health-check-root-causes]].

---

## 1. Vì sao là "Decide" chứ chưa "Fix"

Đây là **quyết định sản phẩm**, không phải bug rõ ràng. Gate cứng có thể là **chủ đích** (ép hoàn thiện trước khi có bất kỳ file nào). Nhưng nó **giảm trải nghiệm** khi người dùng chỉ muốn **xem thử bố cục**. Hai nhánh, phải chốt trước khi chạm `src/`:

- **Nhánh (a) — Giữ gate cứng.** Không cho xuất khi còn P0. Việc cần làm chỉ là **microcopy rõ hơn** ("Sửa N lỗi bắt buộc để mở xuất bản; xem preview trực tiếp trong app để kiểm bố cục") + trỏ người dùng sang **preview trong app** (đã có, A làm sạch ảnh vỡ). → chuyển thành **polish nhỏ**.
- **Nhánh (b) — Cho "Xuất bản nháp".** Thêm hành động **riêng biệt** "Xuất nháp (xem thử)" tạo file **có watermark DRAFT**, **bỏ qua P0 không phá file** (evidence thiếu, caption thiếu) nhưng **vẫn chặn P0 phá file** (nếu có). Bản nháp **không** ghi vào lịch sử "đã nộp", tên file có hậu tố `-NHAP`. → cần **contract feature riêng ở W24+** (ngoài break_task), kèm tác động preflight/tên file/lịch sử.

## 2. Câu hỏi cần chốt (đưa cho chủ dự án)
1. Có nên cho xuất **bản nháp watermark** khi còn P0 để xem thử Word/PDF không? Hay giữ cứng và dẫn người dùng dùng **preview trong app** là đủ?
2. Nếu cho: **P0 nào vẫn chặn kể cả nháp** (vd lỗi khiến file hỏng/không mở được), P0 nào được bỏ qua trong nháp (evidence, ảnh body — hiển thị placeholder)?
3. Nháp cần **phân biệt** thế nào với bản nộp: watermark chéo trang? hậu tố tên file `-NHAP`? **không** vào lịch sử nộp bài / **không** đóng gói được vào `evidence.zip`?
4. Chỉ cho nháp **PDF/DOCX xem bố cục**, hay cả HTML? PPTX (slide) đã tách ở [[w24_fix_export_gate_scope_per_target_pptx]] — không thuộc phạm vi này.

## 3. Đầu ra của contract này (chưa chạm `src/`)
- [ ] Ghi lại quyết định (a)/(b) + lý do vào `Design/Decisions/` (theo mẫu `w23_import_heading_hierarchy_decision.md`) + PR/roadmap.
- [ ] Nếu (a): mở contract **polish** "microcopy gate + dẫn sang preview" (nhỏ).
- [ ] Nếu (b): mở contract **feature** "Xuất bản nháp (watermark, bỏ P0 không phá file)" ở W24+ — kèm thiết kế watermark, phân loại P0-chặn-nháp vs P0-bỏ-qua, tên file `-NHAP`, tách khỏi lịch sử nộp/zip.
- [ ] Cập nhật `w24_break_index.md` map #8 trỏ tới contract kết quả.

## 4. Scope

### In scope
- Điều tra + quyết định (docs). Đọc gate P0 (`preflight.ts`/`use-export.ts`), khả năng chèn watermark ở `prepare-export`/`print-css`, phân loại severity checker để biết P0 nào "phá file".
### Out of scope
- ❌ Sửa code gate/xuất trong contract này.
- ❌ Thiết kế watermark chi tiết (nếu nhánh b) — thuộc contract feature riêng.
- ❌ Nới gate cho html/pdf/docx **bản nộp** (luôn giữ cứng — nháp là **đường riêng**, không thay bản nộp).

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Nháp bị nhầm thành bản nộp | High | Watermark bắt buộc + hậu tố tên file + không vào lịch sử nộp/zip; copy cảnh báo rõ. |
| Mở nháp làm rỗng động lực sửa P0 | Med | Nháp chỉ để **xem thử**; vẫn hiển thị đủ cảnh báo P0; bản nộp vẫn chặn cứng. |
| Phá W23-A lock nếu làm ẩu | High | Quyết định phải ghi rõ nháp **không** nới gate bản nộp; là deliverable tách biệt có kiểm soát. |

## 6. Verification Plan (cho contract quyết định)
- Có văn bản quyết định (a)/(b) trong `Design/Decisions/` + lý do.
- Nếu (b): có danh sách **P0-chặn-nháp** vs **P0-bỏ-qua** rõ ràng, cơ chế watermark + tên file + tách lịch sử.
- `w24_break_index.md` cập nhật trỏ đúng.

## 7. Status

`PROPOSED (Decide) — chờ chủ dự án chốt nhánh (a)/(b) trước khi mở contract thi công.`
