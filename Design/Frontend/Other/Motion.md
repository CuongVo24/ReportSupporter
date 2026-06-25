# 🎞️ MOTION

> **STATUS: ✅ SPEC.** **AI RULE:** Chuyển động chỉ để **phản hồi**, không trang trí. ≤ ~200ms. Luôn tôn trọng `prefers-reduced-motion` (`0.ArtDirection.md` §4, §6). Không animation chào mừng, không bounce/confetti (anti-pattern §6 + luật §12.4 "ấm bằng hành vi, không trang trí").

---

## 1. Thang thời lượng / easing

| Lớp | Thời lượng | Easing | Vd |
| :--- | :--- | :--- | :--- |
| micro (hover/focus) | ~120–150ms | ease-out | nút hover, focus ring |
| transition (toast/dialog vào/ra) | ~180–200ms | ease-out vào · ease-in ra | Toast trượt nhẹ, Dialog fade+scale nhỏ |
| **đèn rọi** (jump-to-spot, chữ ký #1) | fade-in 120 → giữ ~1s → fade-out 200 | ease | highlight khối khi nhảy tới lỗi |

> Token hoá nếu cần (`--rs-motion-*`) → cân nhắc thêm vào `DesignSystem_Tokens.md`; MVP có thể inline hằng số trong CSS component.

## 2. Quy ước reduced-motion (bắt buộc)

| Hiệu ứng | Bình thường | `prefers-reduced-motion` |
| :--- | :--- | :--- |
| đèn rọi jump | highlight pulse | viền tĩnh 1.2s rồi tắt, **không** pulse |
| skeleton | shimmer | nền tĩnh `--rs-color-surface-muted` |
| toast/dialog | trượt/scale | **fade tức thì** |
| spinner (`Loader2`) | quay | đứng yên / chỉ mờ (`Button` loading) |
| đồng hồ deadline | — | **không** animation đếm |

## 3. ✅ Do / ❌ Don't

| ✅ Do | ❌ Don't |
| :--- | :--- |
| Chuyển động để phản hồi thao tác | Animation chào mừng/onboarding |
| ≤200ms, ease-out | Slide dài, bounce, confetti |
| Luôn có nhánh reduced-motion | Bỏ qua `prefers-reduced-motion` |

## 4. 📎 Cross-refs
- `2.Components/Dialog.md` · `Toast.md` · `Button.md` (loading) · `3.Patterns/LoadingSkeleton.md` · `Other/SignatureInteractions.md` #1 (đèn rọi) · `Other/Accessibility.md` (reduced-motion) · token §7b (motion).
