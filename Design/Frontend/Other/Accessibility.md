# ♿ ACCESSIBILITY

> **STATUS: ✅ SPEC (home tầng Frontend).** Tiêu chí a11y canonical ở `Design/Modules/Other/DesignSystem_Tokens.md` §7b (WCAG 2.2 AA cho Workspace UI). File này diễn giải & checklist **theo từng bề mặt/pattern**, không mâu thuẫn §7b. (Report Output là tài liệu in — a11y của nó thuộc trình đọc PDF/Word, không áp WCAG màn hình.)

---

## 1. Nguyên tắc lõi (tóm §7b)

Contrast AA (≥4.5:1 text, ≥3:1 UI/large) · focus-visible mọi nơi (**cấm `outline:none` trần**) · keyboard đủ flow · **không phân biệt chỉ bằng màu** (severity/readiness kèm icon+chữ) · target ≥24×24px · tôn trọng `prefers-reduced-motion` · landmark/aria-label cho pane & list.

## 2. Checklist theo bề mặt

| Bề mặt | Phải đạt |
| :--- | :--- |
| **Bàn viết** (editor) | `aria-label`; thao tác bàn phím đầy đủ; focus ring rõ |
| **Tờ nộp** (preview) | có landmark; cuộn/zoom bằng bàn phím; đèn rọi không chỉ bằng màu |
| **Section nav** | list điều hướng phím; item active không chỉ bằng màu (viền + đậm) |
| **Người soát** (checker) | issue list điều hướng phím; **jump-to-issue kích hoạt bằng Enter/Space** (`3.Check.md` §9); severity icon+nhãn |
| **Mức sẵn sàng** badge | `aria-label` đầy đủ ("75 trên 100, còn cảnh báo"); popover bẫy focus + Esc |
| **Đồng hồ deadline** | thời gian còn lại có **text** (không chỉ icon); nhắc không cướp focus |
| **Metadata form** | label nối input; lỗi qua `aria-describedby`; icon+chữ |
| **Asset menu** | menu phím, Esc đóng |
| **Dialog** (confirm xoá/xuất) | **focus trap + Esc**; trả focus về trigger khi đóng |
| **Tabs** (rail Check/Export/Present) | phím ←/→ chuyển tab |
| **Toast** | `role="status"`/`alert`; lỗi không tự tắt khi cần action |
| **Lưu thầm** | `aria-live="polite"` (không cướp ngữ cảnh) |

## 3. Quy ước lặp lại

- Icon-only button → `aria-label` mô tả hành động; icon trang trí kèm chữ → `aria-hidden`.
- Severity/readiness: **màu + icon + nhãn chữ** (3 lớp), không bao giờ chỉ màu.
- Mọi flow trong `5.Flows/*` phải thao tác được không cần chuột.

## 4. Mốc
- A11y **checklist thủ công** (keyboard/focus/contrast/aria) baseline = **W12** (`RoadMap`); **0 critical axe tự động** = **W15** (Phase 4, `axe-core` + Vitest/jsdom). Áp **ngay khi dựng** từng component/pattern (không dồn cuối).

## 5. 📎 Cross-refs
- token §7b (canonical) · `2.Components/*` (mục A11y mỗi component) · `Other/Motion.md` (reduced-motion) · `Other/SignatureInteractions.md` (mỗi tương tác có mục A11y) · `Modules/1.Write.md` §9 · `Modules/3.Check.md` §9.
