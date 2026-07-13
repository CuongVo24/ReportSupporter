# Contract For AI — W23 Decide: Import Làm Phẳng Phân Cấp Heading (H2 Thành Mục Top-Level)

> **Lane:** Core / break_task / week23_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** **Decide** — chốt chủ ý trước, **chưa** sửa code. (Kiểu contract "decide" như W16.)
> **Findings:**
> - **S1** (🟢) — **Import làm phẳng phân cấp.** Nhập file `.md` có `# Chương Một` / `## Phần 1.1` / `# Chương Hai`: QA quan sát nav sinh ra **mục top-level ngang hàng** — "9. Chương Một", "10. Phần 1.1", "11. Chương Hai" — H2 "Phần 1.1" **không** lồng dưới "Chương Một" mà thành mục cấp cao. Preview có nhãn **"H+0"** cạnh mỗi mục nhưng không giải thích. Một báo cáo 20 trang import vào có thể thành ~40 mục phẳng, mất cấu trúc gốc.
> **Builds on:** luồng import (`modules/import/*`), map heading → `ReportSection`, nhãn "H+0" trong preview import, mô hình dữ liệu **flat-section** hiện tại của app.
> **Sources:** QA session 2026-07-13, phát hiện #16 [[w25-ui-redesign]].

---

## 1. Vì sao là "Decide" chứ chưa "Fix"

App vốn theo mô hình **danh sách mục phẳng** (mỗi mục = markdown độc lập, đánh số tự động khi xuất bản). Việc import tách **mỗi heading thành một mục** có thể là **chủ đích thiết kế**, không phải bug. Nhãn "H+0" gợi ý có **chuẩn hoá cấp heading** khi nhập. Trước khi sửa phải **chốt nhánh**:

- **Nhánh (a) — Flat là chủ đích.** Giữ mỗi heading = một mục; **không** đổi hành vi. Việc cần làm chỉ là **giải thích nhãn "H+0"** và cho người dùng thấy trước cách map (đã có preview import) + tuỳ chọn gộp. → chuyển thành contract **polish nhỏ** (copy/tooltip cho "H+0").
- **Nhánh (b) — Cần giữ phân cấp.** Người dùng kỳ vọng H2 lồng trong H1 (mục con). → cần **thiết kế mục con** (sub-section) hoặc giữ markdown nhiều heading trong **một mục** thay vì tách phẳng. Đây là thay đổi **mô hình dữ liệu/IA lớn**, phải có contract feature riêng ở W24+, **không** làm vội trong break_task.

## 2. Câu hỏi cần chốt (đưa cho chủ dự án)
1. Import một tài liệu nhiều cấp (H1/H2/H3) — kỳ vọng ra **danh sách mục phẳng** (mỗi heading một mục) hay **giữ phân cấp** (mục con / gộp theo chương)?
2. Nhãn **"H+0"** ý nghĩa gì với người dùng — có nên hiển thị, hay thay bằng chỉ báo cấp heading dễ hiểu (vd "Chương"/"Mục con")?
3. Ngưỡng chấp nhận: báo cáo lớn (20+ trang) import ra bao nhiêu mục là hợp lý; có cần **tuỳ chọn gộp** heading con vào mục cha lúc nhập không?

## 3. Đầu ra của contract này (chưa chạm `src/`)
- [ ] Ghi lại quyết định (a)/(b) + lý do vào PR/roadmap.
- [ ] Nếu (a): mở contract polish "giải thích H+0 + tuỳ chọn gộp khi import" (nhỏ, W23/W24).
- [ ] Nếu (b): mở contract feature "sub-section / giữ phân cấp import" ở W24+ (ngoài break_task), kèm tác động `ReportSection`/nav/đánh số/xuất.
- [ ] Cập nhật `w23_break_index.md` map #16 trỏ tới contract kết quả.

## 4. Scope
### In scope
- Điều tra + quyết định (docs). Đọc luồng import (`modules/import`), xác nhận map heading→section và ý nghĩa "H+0".
### Out of scope
- ❌ Sửa code import/section trong contract này.
- ❌ Thiết kế sub-section (nếu nhánh b) — thuộc contract feature riêng.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Sửa vội theo giả định sai chủ ý | Med | Bắt buộc chốt nhánh trước; không code trong contract decide. |
| Nhánh (b) kéo theo đổi mô hình lớn giữa break_task | High | Đẩy sang contract feature W24+; break_task chỉ sửa lỗi, không đổi IA lớn. |

## 6. Verification Plan
- Không có thay đổi `src/`. "Verify" = quyết định được ghi rõ + contract kết quả được mở đúng nhánh.

## 7. Status

`PROPOSED — chờ Approve (Decide)`

> ⛔ Không chạm `src/`. Đề xuất commit: `docs(w23): decide import heading hierarchy (flat vs nested)`.
