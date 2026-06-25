# 🫙 EMPTY STATES

> **STATUS: ✅ SPEC.** **AI RULE:** Mọi list/container có thể rỗng **phải** có empty-state thiết kế — không để trắng trơn. Phân biệt rõ **rỗng-tích-cực** (0 lỗi = tốt, không CTA) vs **rỗng-chưa-bắt-đầu** (có CTA dẫn lối). Copy canonical ở `Other/VoiceAndContent.md` §5 — file này lo **bố cục + rule áp dụng**.

---

## 1. Khuôn 1 empty-state

```
        (minh hoạ tiết chế — tuỳ chọn, line nhẹ tông slate)
                    Tiêu đề ngắn (1 dòng)
              Một câu giải thích / mời gọi
                   [ Hành động chính ]   ← chỉ khi "chưa-bắt-đầu"
```
- Căn giữa khối rỗng trong container; thoáng (`--rs-space-6`+). Minh hoạ chỉ ở empty-state **chính** (`Other/Icons.md` §3), không rải khắp.
- Giọng: mời gọi, không lỗi.

## 2. Catalog case domain (ReportSupporter)

| Chỗ rỗng | Loại | Bố cục | CTA |
| :--- | :--- | :--- | :--- |
| Chưa có report (lần đầu) | chưa-bắt-đầu | full vùng làm việc, căn giữa, auto-mở template picker | **Tạo report** |
| Report chưa có section | chưa-bắt-đầu | trong section nav / preview | **Thêm mục** |
| Section markdown rỗng | chưa-bắt-đầu | placeholder trong tờ nộp "Chưa có nội dung" | gõ / **Thêm mục** |
| Người soát — **0 issue** | **tích-cực** | trong rail, icon `CheckCircle2` xanh, **không** CTA | — |
| Người soát — **chưa chạy** | chưa-bắt-đầu | rail, badge xám | **Soát báo cáo** |
| Evidence kit rỗng | chưa-bắt-đầu | panel evidence | **Thêm minh chứng** |
| Present — chưa sinh slide | chưa-bắt-đầu | tab Present | **Sinh outline** |

> 🔑 Hai trạng thái **phải khác nhau rõ**: "Không có lỗi" (xanh, mừng thầm, không CTA) ≠ "Chưa soát" (xám, có CTA). Gộp chung = lỗi gu (người dùng tưởng đã sạch khi chưa soát).

## 3. ✅ Do / ❌ Don't

| ✅ Do | ❌ Don't |
| :--- | :--- |
| Luôn có lối đi tiếp (CTA) cho rỗng-chưa-bắt-đầu | Chỉ hiện "No data" / "Empty" |
| Rỗng-tích-cực ghi nhận điềm tĩnh, không CTA thừa | Bắt "Soát lại" khi đã 0 lỗi |
| Minh hoạ tiết chế, đúng tông slate | Illustration to/màu mè (anti-pattern §6) |

## 4. 📎 Cross-refs
- `0.ArtDirection.md` §3.3 · §12.4 (ghi nhận điềm tĩnh) · `Other/VoiceAndContent.md` §5 · `Other/Icons.md` §3 · `2.Components/Button.md` · `5.Flows/*` (mỗi flow trỏ về đây).
