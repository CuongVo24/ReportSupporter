# 🔽 Select

> Spec theo khuôn `_ComponentSpecRule.md`. **Nền tảng:** `@radix-ui/react-select` (headless — lo sẵn keyboard/aria/typeahead), style bằng token + CSS co-located. Tách riêng khỏi `Input` (B4).

## 0. Meta
- **Vai trò:** chọn 1 giá trị từ danh sách (template, định dạng export, preset A4…).
- **Map src:** `src/components/ui/Select.tsx` + `Select.css`.

## 1. Anatomy
```
Label
[ Trigger: value · ChevronDown(Lucide) ]   ← Radix Trigger
└ Content (popover, --rs-z-dropdown, --rs-elevation-2):
   [ Item · (Check khi selected) ] ...
```
- Trigger giống field Input (border `--rs-field-border`, radius `sm`). Content radius `md`.

## 2. Variants
- `size: md | sm`. `full-width` (mặc định trong form). Có/không leading-icon trong trigger.

## 3. States ★
| State | Thị giác |
| :--- | :--- |
| **default / hover / focus** | như Input (focus ring `--rs-color-focus-ring`) |
| **open** | Content mở, trigger giữ focus-style |
| **item hover/highlighted** | nền `--rs-color-surface-muted` |
| **item selected** | icon `Check` (Lucide) + weight medium |
| **disabled** | trigger mờ; item disabled không chọn được |
| **invalid** | border severity-error + error text (FormValidation) |

## 4. Accessibility ★
- Radix lo `role=listbox/option`, keyboard (↑↓, Home/End, typeahead), focus management, Esc đóng — **giữ nguyên, chỉ style**.
- Trigger có label gắn qua `aria-labelledby`/`<label>`.

## 5. Content / Microcopy
- Placeholder trigger khi chưa chọn ("Chọn template…"). Item label rõ ràng.

## 6. Motion
- Content fade+scale nhẹ ~150ms từ trigger; reduced-motion → fade. `Other/Motion.md`.

## 7. Do / Don't
| ✅ Do | ❌ Don't |
| :--- | :--- |
| Dùng Radix, chỉ style | Tự code dropdown từ đầu |
| Selected có icon + đậm | Chỉ đổi màu để báo selected |

## 8. Cross-refs
- `Input.md` · `3.Patterns/FormValidation.md` · token §4.2/§4.4 (elevation/z) · `Other/Accessibility.md`.
