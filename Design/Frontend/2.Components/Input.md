# ⌨️ Input / Field (text · number)

> Spec theo khuôn `_ComponentSpecRule.md`. **Phạm vi:** chỉ `text` + `number` 1 dòng. `Select` và `Textarea` là **component riêng** (`Select.md`, `Textarea.md`). **Nền tảng:** `<input>` thuần + CSS co-located + token.

## 0. Meta
- **Vai trò:** nhập text/số 1 dòng — chủ yếu metadata form (Module 1), cấu hình export.
- **Map src:** `src/components/ui/Input.tsx` + `Input.css`.

## 1. Anatomy
```
Label (trên field)
[ (leadingIcon?) · <input> · (trailingIcon?) ]
Helper text  /  Error text
```
- Field: nền `--rs-field-bg`, border `--rs-field-border`, radius `--rs-field-radius` (`sm`), padding `--rs-space-2`/`--rs-space-3`.
- Label trên field (`A5`), `--rs-field-label-size`, gap `--rs-field-gap`.

## 2. Variants
- `type: text | number`. Modifiers: có/không leading-icon, `full-width` (mặc định full trong form).

## 3. States ★
| State | Thị giác | Hành vi |
| :--- | :--- | :--- |
| **default** | border `--rs-field-border` | |
| **hover** | border đậm nhẹ | |
| **focus** | border `--rs-field-border-focus` + ring `--rs-color-focus-ring` | |
| **disabled** | nền muted, opacity ~.6 | không nhập |
| **readonly** | giống disabled nhưng chọn-copy được | |
| **invalid/error** | border `--rs-color-severity-error` + error text dưới field | xem `3.Patterns/FormValidation.md` |
| **filled** | giá trị hợp lệ — **không** tô xanh ồn ào | |

## 4. Accessibility ★
- `<label for>` gắn `id` input (label thật, **không** dùng placeholder thay label).
- Error text có `id`, input trỏ qua `aria-describedby`; khi invalid set `aria-invalid="true"`.
- `number`: dùng `inputmode="numeric"` khi hợp lý.

## 5. Content / Microcopy
- Label ngắn gọn. Placeholder = ví dụ định dạng, không phải hướng dẫn bắt buộc. Error = giúp đỡ ("Tiêu đề không được để trống"). `Other/VoiceAndContent.md`.

## 6. Motion
- Border/ring transition ~120ms. Không animation rung khi lỗi (reduced-motion an toàn).

## 7. Do / Don't
| ✅ Do | ❌ Don't |
| :--- | :--- |
| Label trên, luôn hiện | Dùng placeholder làm label |
| Error kèm text + aria | Chỉ đổi màu viền để báo lỗi |
| Validate khi blur/submit | Báo đỏ ngay từng keystroke |

## 8. Cross-refs
- `Select.md` · `Textarea.md` · `3.Patterns/FormValidation.md` · token §6.5 · `Modules/1.Write.md` (metadata form).
