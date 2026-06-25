# 🔔 Toast

> Spec theo khuôn `_ComponentSpecRule.md`. **Nền tảng:** `@radix-ui/react-toast` (lo `role/aria-live`, hover-pause, swipe, stacking) — style bằng token. **Vị trí: dưới-phải** (B12). Lớp `--rs-z-toast`.

## 0. Meta
- **Vai trò:** phản hồi ngắn **không chặn** — autosave xong, export done, lỗi nhẹ.
- **Map src:** `src/components/ui/Toast.tsx` + `Toast.css` (Provider + Viewport ở root).

## 1. Anatomy
```
Viewport (dưới-phải, --rs-z-toast, xếp chồng dọc)
└ Toast (radius md, --rs-elevation-2, padding --rs-space-4):
   [ icon(Lucide) · ( Title · Description ) · (Action?) · (Close: X) ]
```

## 2. Variants
| Variant | Icon Lucide | Màu nhấn | Auto-dismiss |
| :--- | :--- | :--- | :--- |
| **success** | `CheckCircle2` | `--rs-color-success` | 4s |
| **info** | `Info` | `--rs-color-severity-info` | 4s |
| **error** | `XCircle` | `--rs-color-severity-error` | **không tự tắt** (B13) — chờ user đọc/đóng |

## 3. States ★
| State | Hành vi |
| :--- | :--- |
| **enter/exit** | slide-in từ phải + fade (§6) |
| **auto-dismiss** | success/info 4s; **error không tự tắt** |
| **hover/focus** | **tạm dừng** đếm giờ (Radix lo) |
| **action (B13)** | nút phụ trong toast (vd "Mở file", "Hoàn tác") |
| **stacking (B13)** | nhiều toast xếp chồng dọc, mới nhất dưới cùng; giới hạn ~3 hiển thị |

## 4. Accessibility ★
- Radix: `role="status"` + `aria-live="polite"`; **error → `assertive`**. Đóng bằng phím; swipe để bỏ.
- Không phụ thuộc chỉ màu (icon + chữ). Action button có nhãn rõ.

## 5. Content / Microcopy
- Ngắn, nêu **kết quả thật** ("Đã xuất PDF", "Đã lưu"). Lỗi nhẹ: nêu cái gì + lối đi. Không emoji. `Other/VoiceAndContent.md`.

## 6. Motion
- Slide-in từ phải + fade ~180–200ms ease-out; exit fade+slide. Reduced-motion → fade. `Other/Motion.md`.

## 7. Do / Don't
| ✅ Do | ❌ Don't |
| :--- | :--- |
| Toast cho sự kiện rời rạc | Toast cho mỗi keystroke autosave |
| error không tự tắt | Lỗi nghiêm trọng cần hành động → dùng Dialog, không toast |
| icon + chữ | Chỉ chấm màu |

## 8. Cross-refs
- `3.Patterns/Feedback.md` (chọn kênh) · `3.Patterns/ErrorStates.md` · token §4.4 · `Modules/1.Write.md` (autosave) · `Modules/4.Export.md` (export done).
