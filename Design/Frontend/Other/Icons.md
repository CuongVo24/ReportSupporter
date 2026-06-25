# 🔣 ICONS & ASSETS

> **AI RULE:** Icon để **làm rõ nghĩa**, không trang trí. Bộ icon đã chốt: **Lucide** (`lucide-react`). Tiết chế, một phong cách (`0.ArtDirection.md` §6).

## 1. ✅ Bộ icon: Lucide
- Lib: `lucide-react` (line, stroke-width đồng nhất, tree-shake theo từng icon).
- Size chuẩn: **16px** (badge / nút sm) · **18px** (nút md / tab) · 20px (title). Màu kế thừa `currentColor` để hợp token.
- Stroke giữ mặc định Lucide; không trộn bộ icon khác.

## 2. 🎯 Icon severity (bắt buộc, gắn Badge — a11y)
| Ý nghĩa | Lucide |
| :--- | :--- |
| error | `XCircle` |
| warning | `AlertTriangle` |
| info | `Info` |
| readiness good/medium/low | `CheckCircle2` / `AlertCircle` / `CircleSlash` |
| success (toast/lưu) | `CheckCircle2` |
| loading | `Loader2` (quay; reduced-motion → đứng) |
| đóng | `X` |

> Icon severity **luôn đi cùng nhãn chữ** — không thay thế chữ (token §7b).

## 3. 🖼️ Illustration empty-state
- 1 phong cách tiết chế (line nhẹ, hợp tông slate). Dùng có chọn lọc cho empty-state chính, **không** rải khắp UI vận hành.
- Chưa chốt nguồn — quyết định khi dựng empty-state thật (`3.Patterns/EmptyStates.md`).

## 4. ♿ Quy ước
- Icon-only button → `aria-label`. Icon trang trí kèm chữ → `aria-hidden="true"`.

## 5. 📎 Cross-refs
- `2.Components/Badge.md` (icon severity) · `3.Patterns/EmptyStates.md` · `Other/Accessibility.md` · `Other/VoiceAndContent.md`.
- ⚠️ `lucide-react` là **dependency mới** — cần ghi vào `Modules/Other/TechnicalStack.md` + `package.json` (xem ghi chú stack ở `Frontend/README.md`).
