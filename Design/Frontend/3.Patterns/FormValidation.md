# ✅ FORM VALIDATION

> **STATUS: 🟡 SKELETON.** **AI RULE:** Validate **đúng lúc** (không gắt khi đang gõ), message gắn field, đọc được bằng screen reader.

## Áp ở đâu
- [ ] Metadata form (Module 1: title, author, …) · evidence link manager · cấu hình export.

## Quy ước thời điểm
- [ ] Validate khi **blur** / khi submit, không phải mỗi keystroke. Lỗi đã hiện thì cập nhật realtime khi sửa.
- [ ] Field hợp lệ không cần tô xanh ồn ào.

## Hiển thị
- [ ] Viền `--rs-field-border` → error; message dưới field, `aria-describedby`; icon + chữ.

## Do / Don't
- [ ] ✅ chỉ rõ cách sửa · ❌ chặn submit mà không nói thiếu gì · ❌ chỉ đổi màu viền.

## Cross-refs
- `2.Components/Input.md` · `ErrorStates.md` · `Modules/1.Write.md` · token §6.5 / §7b.
