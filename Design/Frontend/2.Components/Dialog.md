# 🪟 Dialog / Modal (+ Drawer variant)

> Spec theo khuôn `_ComponentSpecRule.md`. **Nền tảng:** `@radix-ui/react-dialog` (lo focus-trap, Esc, aria, scroll-lock) — style bằng token + CSS co-located. Drawer dùng chung primitive Radix Dialog, đổi vị trí/animation.

## 0. Meta
- **Vai trò:** tác vụ cần tách biệt/ xác nhận — metadata form, confirm export, confirm xoá.
- **Map src:** `src/components/ui/Dialog.tsx` + `Dialog.css` (xuất cả `Dialog` và `Drawer`).

## 1. Anatomy
```
Overlay (backdrop, --rs-z-overlay)
└ Content (--rs-z-modal, radius lg, --rs-elevation-3, padding --rs-space-6)
   ├ Title (--rs-font-size-xl) · (Close: icon-only ghost button, Lucide X)
   ├ Body
   └ Footer: [secondary] [primary]  (right-aligned)
```

## 2. Variants
| Variant | Hình thái | Khi dùng |
| :--- | :--- | :--- |
| **modal** (mặc định) | giữa màn, max-width vừa | form/confirm thường |
| **drawer** (B8) | trượt từ phải, cao full, rộng cố định | form dài / context phụ / màn hẹp (xem `4.Layouts/Responsive.md`) |
| **confirm** | nhỏ, 1 dòng mô tả + [Huỷ][hành động] | xác nhận (danger dùng Button `danger`) |

## 3. States ★
| State | Hành vi |
| :--- | :--- |
| **open/close** | Radix mount/unmount + animation §6 |
| **loading** (submit) | primary button → loading, khoá đóng tình cờ |
| **error trong dialog** | hiện inline ở body, không đóng dialog |
| **backdrop click (B9)** | form thường → **đóng**; confirm tác vụ **phá huỷ** → **chặn** đóng (chỉ nút mới đóng) |

## 4. Accessibility ★
- Radix: focus-trap, Esc đóng (trừ khi chặn ở confirm phá huỷ), trả focus về trigger, `role="dialog"` + `aria-labelledby` (Title) + `aria-describedby` (mô tả).
- Close button có `aria-label="Đóng"`.

## 5. Content / Microcopy
- Title = hành động rõ ("Xoá section?", "Cấu hình xuất PDF"). Nút footer = động từ. Confirm phá huỷ: nói rõ hệ quả. `Other/VoiceAndContent.md`.

## 6. Motion
- Modal: overlay fade + content fade/scale(0.98→1) ~180ms. Drawer: slide-in từ phải ~200ms ease-out. Reduced-motion → fade tức thì. `Other/Motion.md`.

## 7. Do / Don't
| ✅ Do | ❌ Don't |
| :--- | :--- |
| Một primary trong footer | Hai primary footer |
| Confirm phá huỷ chặn backdrop-close | Click ngoài là xoá luôn |
| Drawer cho form dài | Modal giữa nhồi form quá dài |

## 8. Cross-refs
- `2.Components/Button.md` (footer + danger) · `4.Layouts/Responsive.md` (drawer khi hẹp) · token §4.3/§4.4 · `Other/Motion.md` · `Other/Accessibility.md`.
