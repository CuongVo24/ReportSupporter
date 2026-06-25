# 📤 FLOW — Export (Module 4)

> **STATUS: 🟡 SKELETON.** Wireframe-level cho luồng xuất HTML/PDF/DOCX. Logic ở `Modules/4.Export.md`.

## Màn / bước chính
- [ ] Chọn định dạng → (cảnh báo nếu còn error từ Module 3) → chạy job → kết quả/tải về.

## Mỗi bước: trạng thái phải cover ★
- [ ] disabled (chưa đủ điều kiện) · **loading/progress** (job lifecycle) · success (tải file) · **error + retry**.
- [ ] Nếu còn issue blocking → hiển thị rõ trước khi cho export.

## Điểm nhấn gu
- [ ] Trustworthy: trạng thái job thật, không giả tiến trình.

## Cross-refs
- `Modules/4.Export.md` · `3.Patterns/LoadingSkeleton.md` · `3.Patterns/ErrorStates.md` · `2.Components/Button.md` (loading).
