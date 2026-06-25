# ♿ ACCESSIBILITY

> **STATUS: 🟡 SKELETON (trỏ canonical).** Tiêu chí a11y canonical đang ở `Design/Modules/Other/DesignSystem_Tokens.md` §7b (WCAG 2.2 AA cho Workspace UI). File này là **home đầy đủ hơn** ở tầng Frontend — diễn giải & checklist theo component/pattern, không mâu thuẫn §7b.

## Nguyên tắc lõi (tóm từ §7b)
- [ ] Contrast AA · focus-visible mọi nơi (cấm `outline:none` trần) · keyboard đủ flow · **không phân biệt chỉ bằng màu** (severity kèm icon+chữ) · target ≥24px · tôn trọng reduced-motion · landmark/aria.

## Checklist theo bề mặt (điền)
- [ ] Editor / preview / checker list / template picker / metadata form / dialog (focus trap + Esc) / tabs (phím ←/→).

## Mốc
- [ ] Pass đầy đủ + 0 critical axe = **W12** (`TaskBrief/.../w12.md`); nhưng áp **ngay khi dựng** từng component.

## Cross-refs
- token §7b (canonical) · `2.Components/*` (mục A11y mỗi component) · `Modules/1.Write.md` §9 · `Modules/3.Check.md` §9.
