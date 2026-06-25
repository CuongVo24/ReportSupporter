# ⚠️ ERROR STATES

> **STATUS: 🟡 SKELETON.** **AI RULE:** Lỗi phải **giải thích + cho lối thoát (retry)**, không chỉ báo đỏ. Giọng giúp đỡ, không trách (`0.ArtDirection.md` §9).

## Phân loại lỗi trong ReportSupporter
- [ ] Lỗi nhập liệu (field metadata) → inline cạnh field (`FormValidation.md`).
- [ ] Lỗi render/parse Markdown → hiện trong preview, chỉ chỗ lỗi, không sập app.
- [ ] Lỗi export job (PDF/DOCX fail) → trạng thái + lý do + retry (`5.Flows/Export.md`).
- [ ] Lỗi hệ thống (IndexedDB) → thông báo + cách khắc phục.

## Mức độ hiển thị
- [ ] inline (nhẹ, gắn ngữ cảnh) · toast (thoáng qua) · dialog/blocking (nghiêm trọng cần hành động).
- [ ] Severity dùng đúng token `error`, kèm icon + chữ (a11y).

## Do / Don't
- [ ] ✅ message nêu *cái gì sai + làm gì tiếp* · ❌ "Something went wrong" cụt lủn · ❌ sập cả màn vì 1 lỗi cục bộ.

## Cross-refs
- `2.Components/Toast.md` · `2.Components/Dialog.md` · `Other/VoiceAndContent.md` · token §2.3.
