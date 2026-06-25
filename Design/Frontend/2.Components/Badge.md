# 🏷️ Badge (severity · readiness · section status)

> Spec theo khuôn `_ComponentSpecRule.md`. **Nền tảng:** `<span>` (static) hoặc `<button>` (clickable) + Lucide + token. **Đúng 3 nhóm, không thêm loại** (B6).

## 0. Meta
- **Vai trò:** nhãn trạng thái nhỏ, đọc nhanh.
- **Map src:** `src/components/ui/Badge.tsx` + `Badge.css`.

## 1. Anatomy
```
[ icon(Lucide) · label ]
```
- **Luôn có CẢ icon LẪN chữ** (a11y — không bao giờ chỉ màu). Radius `--rs-radius-sm`, `--rs-font-size-sm`, padding `--rs-space-1`/`--rs-space-2`, gap `--rs-space-1`.

## 2. Variants (đúng 3 nhóm)
| Nhóm | Giá trị | Màu / nền | Icon Lucide gợi ý |
| :--- | :--- | :--- | :--- |
| **severity** | `error` / `warning` / `info` | `--rs-color-severity-*` + `*-bg` | `XCircle` / `AlertTriangle` / `Info` |
| **readiness** | `good` (≥85) / `medium` (60–84) / `low` (<60) | `--rs-color-readiness-*` | `CheckCircle2` / `AlertCircle` / `CircleSlash` |
| **section status** | `draft` / `review` / `done` | neutral / primary / success | `Circle` / `Eye` / `Check` |

> severity khớp `ReportIssue.severity`; readiness khớp ngưỡng `3.Check.md §5.3` — **không tính màu runtime**.

## 3. States ★
| State | Thị giác |
| :--- | :--- |
| **static** (mặc định) | theo variant |
| **clickable — jump-to-issue (BẮT BUỘC ở Checker panel, B7)** | render `<button>`; hover nền đậm nhẹ; **focus-visible ring**; con trỏ pointer |
| **active/selected** (issue đang được nhảy tới) | viền/nền nhấn để biết đang chọn |

## 4. Accessibility ★
- **Không phân biệt chỉ bằng màu** — icon + nhãn chữ bắt buộc (token §7b).
- Clickable → `<button>` thật, Enter/Space kích hoạt jump-to-issue, có `aria-label` mô tả ("Tới lỗi: thiếu Kết luận").
- Contrast AA cả light/dark (dark override nền severity, token §2.5).

## 5. Content / Microcopy
- Nhãn = đúng từ khoá: `error/warning/info`, `draft/review/done`. Ngắn, không emoji. `Other/VoiceAndContent.md`.

## 6. Motion
- Hover/focus transition ~120ms. Không animation xuất hiện.

## 7. Do / Don't
| ✅ Do | ❌ Don't |
| :--- | :--- |
| icon + chữ luôn đi cùng | Phân biệt chỉ bằng màu |
| Giữ đúng 3 nhóm | Thêm severity/loại thứ 4 |
| Clickable = button có aria-label | span gắn onClick |

## 8. Cross-refs
- token §2.3 / §2.4 / §6.3 · `Modules/3.Check.md` (severity + readiness + jump-to-issue) · `Other/Accessibility.md`.
