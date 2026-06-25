# 📏 COMPONENT SPEC RULE — Khuôn chuẩn cho mọi component

> **AI RULE:** Mọi file `2.Components/<Tên>.md` **phải** theo đúng khuôn này. Một component **chưa khai đủ trạng thái §3** = chưa đủ điều kiện code (đây là điều khiến UI "polished" thay vì "happy-path đẹp"). File này là **template tái dùng** — bê nguyên sang dự án sau.

> 🔁 Khi tạo component mới: copy 8 mục dưới, đổi tên, điền. Không bỏ mục — nếu mục nào không áp dụng, ghi rõ "N/A vì…".

---

## 0. 🪪 META
- **Tên / vai trò:** (1 câu — component này dùng để làm gì)
- **Module dùng:** (Write / Format / Check / Export / Present / dùng chung)
- **Map src:** `src/components/ui/<Tên>.tsx` (hoặc nơi tương ứng)
- **Reference gu:** `0.ArtDirection.md` §… (tính từ nào nó phục vụ)

## 1. 🧬 ANATOMY (giải phẫu)
- Các phần cấu thành (vd: icon · label · trailing). Token spacing/size cho từng phần.
- Sơ đồ text đơn giản nếu cần.

## 2. 🎛️ VARIANTS (biến thể)
| Variant | Khi dùng | Token chính |
| :--- | :--- | :--- |
| primary | hành động chính (1 mỗi màn) | `--rs-color-primary` |
| secondary / ghost | hành động phụ | … |
| (size: sm/md) | … | … |

> Nhắc gu: **một** primary mỗi màn (`0.ArtDirection.md` §3.6).

## 3. 🔁 STATES (TRẠNG THÁI — BẮT BUỘC ĐỦ) ★
> Đây là mục quan trọng nhất. Khai **mọi** trạng thái nhìn thấy được:

| State | Mô tả thị giác | Token / hành vi |
| :--- | :--- | :--- |
| **default** | | |
| **hover** | | |
| **active / pressed** | | |
| **focus-visible** | ring rõ, **cấm** `outline:none` trần | `--rs-color-focus-ring` |
| **disabled** | giảm tương phản, không bắt sự kiện | |
| **loading** | nếu async (spinner/skeleton, khoá lặp click) | `3.Patterns/LoadingSkeleton.md` |
| **error / invalid** | nếu là input | `3.Patterns/FormValidation.md` |
| **empty** | nếu là list/container | `3.Patterns/EmptyStates.md` |

## 4. ♿ ACCESSIBILITY
- Role / aria cần thiết · keyboard (Tab/Enter/Esc) · target size ≥24×24 · không phân biệt chỉ bằng màu.
- Link: `Other/Accessibility.md`, token §7b.

## 5. ✍️ CONTENT / MICROCOPY
- Quy ước nhãn (nút = động từ rõ). Link `Other/VoiceAndContent.md`.

## 6. 🎞️ MOTION
- Transition nào, duration (≤~200ms), tôn trọng `prefers-reduced-motion`. Link `Other/Motion.md`.

## 7. ✅ DO / ❌ DON'T
| ✅ Do | ❌ Don't |
| :--- | :--- |
| | |

## 8. 📎 CROSS-REFS
- Spec module liên quan · token nhánh tiêu thụ · pattern liên quan.
