# 🎞️ MOTION

> **STATUS: 🟡 SKELETON.** **AI RULE:** Chuyển động chỉ để **phản hồi**, không trang trí. ≤ ~200ms. Luôn tôn trọng `prefers-reduced-motion` (`0.ArtDirection.md` §4, §6).

## Thang thời lượng / easing (đề xuất — chốt khi điền)
- [ ] micro (hover/focus): ~120–150ms · transition (toast/dialog): ~180–200ms · easing chuẩn (ease-out vào, ease-in ra).
- [ ] Token hoá nếu cần (`--rs-motion-*`)? → cân nhắc thêm vào DesignSystem_Tokens.

## Quy ước
- [ ] Reduced-motion: thay slide/scale bằng fade tức thì / tắt shimmer.
- [ ] Không animation chào mừng, không bounce/confetti (anti-pattern §6).

## Cross-refs
- `2.Components/Dialog.md` · `2.Components/Toast.md` · `3.Patterns/LoadingSkeleton.md` · token §7b (motion).
