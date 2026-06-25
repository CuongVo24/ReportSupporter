# 📝 Textarea

> Spec theo khuôn `_ComponentSpecRule.md`. **Nền tảng:** `<textarea>` thuần + token. Tách riêng khỏi `Input` (B4). *Lưu ý:* đây là field nhập nhiều dòng cho **metadata/ghi chú ngắn** — **không** phải editor Markdown chính (editor là Module 1 / CodeMirror, xem `Modules/1.Write.md`).

## 0. Meta
- **Vai trò:** nhập text nhiều dòng (mô tả, ghi chú, abstract ngắn).
- **Map src:** `src/components/ui/Textarea.tsx` + `Textarea.css`.

## 1. Anatomy
```
Label
[ <textarea> (auto-grow? / resize handle) ]
Helper / Error text · (đếm ký tự?)
```
- Style field giống `Input` (border/radius/padding token), `min-height` ~3 dòng.

## 2. Variants
- `auto-grow` (giãn theo nội dung) hoặc `fixed + resize: vertical`. `full-width` mặc định.

## 3. States ★
- default · hover · **focus** (ring) · disabled · readonly · **invalid** (border severity-error + error text) · (tuỳ) **đếm ký tự** khi có maxLength.

## 4. Accessibility ★
- `<label for>` thật · `aria-describedby` cho helper/error · `aria-invalid` khi lỗi · đếm ký tự dùng `aria-live="polite"` nếu hiển thị động.

## 5. Content / Microcopy
- Label rõ; nếu có giới hạn → helper nêu giới hạn trước khi user chạm. `Other/VoiceAndContent.md`.

## 6. Motion
- Auto-grow giãn mượt; reduced-motion → nhảy. Không animation lỗi.

## 7. Do / Don't
| ✅ Do | ❌ Don't |
| :--- | :--- |
| Dùng cho text ngắn/metadata | Dùng thay editor Markdown chính |
| Hiện giới hạn ký tự sớm | Chỉ báo khi đã vượt |

## 8. Cross-refs
- `Input.md` · `Modules/1.Write.md` (editor chính ≠ textarea) · `3.Patterns/FormValidation.md` · token §6.5.
