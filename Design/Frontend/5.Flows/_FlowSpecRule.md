# 📐 FLOW SPEC RULE — Khuôn chuẩn cho mọi màn (screen spec)

> **AI RULE:** Mọi file `5.Flows/<Module>.md` **phải** mô tả từng màn theo khuôn này — không chỉ liệt kê bước. Một bước **chưa khai đủ §3 (trạng thái) + §4 (copy)** = chưa đủ điều kiện code (song song `2.Components/_ComponentSpecRule.md`). File này là **template tái dùng** — bê nguyên sang dự án sau.
>
> 🔁 Mỗi *màn/bước* trong một flow lặp lại khối 7 mục dưới. Mục không áp dụng → ghi "N/A vì…", không bỏ.

---

## Khuôn 1 màn (lặp cho mỗi bước trong flow)

### [Tên màn] — one-line mục đích

**0. 🪟 Bố cục pane**
- Màn này chiếm vùng nào của AppShell (bàn viết / tờ nộp / rail / dialog / drawer)? Pane nào nổi, pane nào lùi?
- Sơ đồ text đơn giản nếu cần.

**1. 🎯 Hành động chính (một)**
- Đúng **một** primary (`0.ArtDirection.md` §3.6). Nhãn = động từ (`VoiceAndContent.md`).

**2. 🔘 Hành động phụ**
- secondary / ghost / icon-only. Không có cái nào ngang hàng primary.

**3. 🔁 Trạng thái phải cover (★ BẮT BUỘC)**
| State | Khi nào | Hiển thị | Pattern |
| :--- | :--- | :--- | :--- |
| **empty** | | | `3.Patterns/EmptyStates.md` |
| **loading** | | | `LoadingSkeleton.md` |
| **error** | | | `ErrorStates.md` |
| **disabled** | điều kiện chưa đủ | nút mờ + **lý do** | — |
| **success/feedback** | | | `Feedback.md` |

**4. ✍️ Copy mẫu**
- Tiêu đề màn, nhãn nút, message chính — lấy/khớp `Other/VoiceAndContent.md`.

**5. 🧩 Component dùng**
- Liệt kê từ `2.Components/` (Button/Input/Tabs/Dialog/Toast/Badge…). **Không** chế component riêng cho màn.

**6. 🚦 Điều kiện disabled / gate**
- Khi nào primary bị khoá? Có gate người soát / deadline không? Nêu rõ điều kiện.

**7. ✨ Hành vi chữ ký chạm tới**
- Màn này dùng tương tác nào trong `Other/SignatureInteractions.md` (#1 jump · #2 readiness · #3 deadline · #4 lưu thầm · #5 export timeline)?

---

## 📎 CROSS-REFS
- `4.Layouts/AppShell.md` (vùng pane) · `2.Components/_ComponentSpecRule.md` (song song) · `Other/SignatureInteractions.md` · `Other/VoiceAndContent.md` · `3.Patterns/*`.
