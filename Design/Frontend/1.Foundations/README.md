# 1️⃣ FOUNDATIONS — TẦNG GIÁ TRỊ GỐC

> **AI RULE:** Tầng này là **giá trị thị giác gốc** (màu, chữ, spacing, A4, severity). Token KHÔNG được nhân bản ở đây.

## 📍 Token canonical nằm ở đâu

Toàn bộ **giá trị token** (CSS custom properties `--rs-*` / `--rs-report-*`) sống canonical tại:

> 🔗 **`Design/Modules/Other/DesignSystem_Tokens.md`** — single source of truth cho mọi con số.

File đó được tham chiếu **bằng tên** trong toàn bộ contract lịch sử (vd `DesignSystem_Tokens.md §7b`), nên **không đổi tên / không đổi chỗ**. Tầng Foundations ở đây chỉ:

* **Trỏ tới** file token đó là nguồn duy nhất của giá trị.
* **Bổ sung** phần thuộc Foundations nhưng chưa nằm trong token — hiện tại: `Typography.md` (cặp font, thang chữ, quy tắc dùng).

## 🗂️ Nội dung tầng

| File | Vai trò | Trạng thái |
| :--- | :--- | :--- |
| (canonical) `Modules/Other/DesignSystem_Tokens.md` | Màu · spacing · radius · elevation · z · A4 · severity · two-scale type | ✅ có sẵn |
| `Typography.md` | Cặp font, thang chữ, quy tắc pairing UI ↔ Report | 🟡 skeleton |

## 📎 Liên quan
* Định hướng *vì sao* dùng các giá trị này: `Design/Frontend/0.ArtDirection.md` §7–§8.
* Component tiêu thụ token: `Design/Frontend/2.Components/`.
