# 🗂️ Tabs

> Spec theo khuôn `_ComponentSpecRule.md`. **Nền tảng:** `@radix-ui/react-tabs` (lo `tablist/tab/tabpanel`, keyboard ←/→/Home/End, `aria-selected`) — style bằng token. **Chỗ dùng thật (B11):** panel phải chuyển giữa **Check / Export / Present**.

## 0. Meta
- **Vai trò:** chuyển giữa các view trong cùng một vùng (không đổi route).
- **Map src:** `src/components/ui/Tabs.tsx` + `Tabs.css`.

## 1. Anatomy
```
[ TabList: ( Tab: label · (CountBadge?) ) ... ]   ← Radix List/Trigger
( indicator active )
[ TabPanel ]                                       ← Radix Content
```
- Count badge (B10): pill nhỏ cạnh label (vd số issue Người soát), dùng `Badge` neutral hoặc severity nếu có lỗi.

## 2. Variants (cả 2 kiểu — B10)
| Variant | Hình thái | Khi dùng |
| :--- | :--- | :--- |
| **underline** | gạch chân dưới tab active | điều hướng panel chính (Check/Export/Present) |
| **segmented** | nền pill bọc nhóm, active có nền surface | chọn chế độ gọn trong 1 khối (vd toggle view) |

Size `md`. Tab active: chữ `--rs-color-text` weight medium; tab thường: `--rs-color-text-muted`.

## 3. States ★
| State | Thị giác |
| :--- | :--- |
| **default** | muted |
| **hover** | chữ đậm hơn / nền muted (segmented) |
| **active/selected** | underline `--rs-color-primary` (underline) / nền `--rs-color-surface` (segmented); chữ medium |
| **focus-visible** | ring `--rs-color-focus-ring` |
| **disabled** | mờ, không chọn |
| **count badge** | cập nhật số realtime; severity-color nếu có error |

## 4. Accessibility ★
- Radix lo roles + keyboard ←/→/Home/End + `aria-selected` — **giữ nguyên, chỉ style**.
- Count badge có text đọc được (vd `aria-label="3 lỗi"`), không chỉ màu.

## 5. Content / Microcopy
- Nhãn ngắn, đúng từ vựng sản phẩm ("Người soát", "Xuất", "Trình bày"). `Other/VoiceAndContent.md`.

## 6. Motion
- Underline indicator trượt ~150ms ease-out; segmented đổi nền ~120ms. Reduced-motion → nhảy. `Other/Motion.md`.

## 7. Do / Don't
| ✅ Do | ❌ Don't |
| :--- | :--- |
| Dùng Radix, chỉ style | Tự quản state active + aria |
| Count badge có nhãn đọc được | Badge chỉ chấm màu |
| ≤ vài tab/nhóm | Nhồi quá nhiều tab → đổi cấu trúc |

## 8. Cross-refs
- `2.Components/Badge.md` (count) · `4.Layouts/AppShell.md` (panel phải) · `Modules/3.Check.md`/`4.Export.md`/`5.Present.md` · token §2.2/§3.1.
