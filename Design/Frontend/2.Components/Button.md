# 🔘 Button

> Spec theo khuôn `_ComponentSpecRule.md`. **Nền tảng:** `<button>` thuần (không cần Radix), Lucide cho icon, CSS co-located + token `--rs-*`.

## 0. Meta
- **Vai trò:** kích hoạt một hành động.
- **Map src:** `src/components/ui/Button.tsx` + `Button.css`.
- **Gu:** `0.ArtDirection.md` §1 (Trustworthy), §3.6 (**một** primary/màn).

## 1. Anatomy
```
[ (leadingIcon?) · label · (trailingIcon?) ]
```
- Padding: `md` = `--rs-space-2` dọc / `--rs-space-4` ngang; `sm` = `--rs-space-1` / `--rs-space-3`.
- Radius `--rs-radius-sm`. Icon: Lucide, kích thước 16px (`sm`) / 18px (`md`), `currentColor`, gap `--rs-space-2`.
- Label = `--rs-font-size-md` (md) / `--rs-font-size-sm` (sm), weight `--rs-font-weight-medium`.

## 2. Variants
| Variant | Nền | Chữ | Border | Khi dùng |
| :--- | :--- | :--- | :--- | :--- |
| **primary** | `--rs-color-primary` | trắng | none | hành động chính (1/màn): Xuất PDF, Tạo report |
| **secondary** | `--rs-color-surface` | `--rs-color-text` | `--rs-color-border` | hành động phụ ngang hàng |
| **ghost** | trong suốt | `--rs-color-text` | none | hành động nền nhạt (toolbar, icon action) |
| **danger** | `--rs-color-severity-error` | trắng | none | tác vụ phá huỷ (Xoá section) — luôn đi kèm confirm Dialog |

**Modifiers:** `size: md | sm` · `icon-only` (vuông, chỉ icon — **bắt buộc `aria-label`**) · `full-width` (chiếm 100% bề ngang, dùng trong Dialog/Drawer footer hoặc form hẹp).

## 3. States ★
| State | Thị giác | Hành vi |
| :--- | :--- | :--- |
| **default** | theo variant | |
| **hover** | primary→`--rs-color-primary-hover`; secondary/ghost→nền `--rs-color-surface-muted` | transition ~130ms |
| **active/pressed** | tối hơn 1 nấc | |
| **focus-visible** | ring `2px` `--rs-color-focus-ring` + offset `2px`; **cấm `outline:none` trần** | keyboard mới hiện ring |
| **disabled** | opacity ~.5, `cursor:not-allowed` | `disabled` thật, không bắt sự kiện |
| **loading** | leading icon → spinner Lucide (`Loader2` quay); label giữ nguyên hoặc mờ | `aria-busy="true"`, **khoá click lặp**, vẫn giữ kích thước (không nhảy layout) |

## 4. Accessibility
- `<button type>` thật (không `<div>`). Enter/Space kích hoạt mặc định.
- `icon-only` → `aria-label` mô tả hành động. Icon trang trí kèm chữ → `aria-hidden`.
- Target ≥ 24×24px (icon-only `md` nên 32–36px).
- Loading: `aria-busy`; reduced-motion → spinner đứng yên / chỉ mờ.

## 5. Content / Microcopy
- Label = **động từ** rõ ("Xuất PDF", "Lưu", "Tạo report"). Không "OK"/"Submit". Chi tiết: `Other/VoiceAndContent.md`.

## 6. Motion
- Hover/active: `background`/`color` transition ~120–150ms ease-out. Reduced-motion: bỏ transition. `Other/Motion.md`.

## 7. Do / Don't
| ✅ Do | ❌ Don't |
| :--- | :--- |
| Một primary mỗi màn | Hai primary cạnh nhau |
| danger luôn kèm confirm | danger bấm là xoá ngay |
| icon-only có aria-label | icon-only trần |
| loading khoá click lặp | cho bấm nhiều lần khi đang chạy |

## 8. Cross-refs
- `_ComponentSpecRule.md` · token §2.2 / §3.1 / §4.2 · `2.Components/Dialog.md` (confirm danger) · `Other/VoiceAndContent.md` · `Other/Motion.md`.
