# 🎨 FRONTEND — BẢN ĐỒ TẦNG GIAO DIỆN ReportSupporter

> **AI RULE:** Đây là **discipline frontend** của dự án — ngang hàng `Design/Modules/`, không phải phụ lục.
> Trước khi code/sửa **bất kỳ** bề mặt nhìn thấy được (component, layout, màn hình), phải đọc tầng tương ứng dưới đây. Một task UI **không có spec tầng tương ứng** = chưa đủ điều kiện code (xem `Design/VibeCode.md` "No Brief — No Code").

ReportSupporter ship chức năng tốt nhưng UI từng bị xem là việc cuối kỳ. Folder này khiến frontend trở thành **first-class concern chạy theo mạch** — quyết định thị giác có nguồn, có trạng thái, có kiểm chứng; không tùy hứng từng màn.

---

## 🧱 6 TẦNG + OTHER (đọc từ trên xuống — trên định hướng dưới)

| # | Tầng | File | Trả lời câu hỏi |
| :--- | :--- | :--- | :--- |
| **0** | **Art Direction** | `0.ArtDirection.md` | *Sản phẩm trông & cảm thấy như thế nào? Đâu là "đẹp" với ReportSupporter?* |
| **1** | **Foundations** | `1.Foundations/` | *Giá trị thị giác gốc: màu, chữ, spacing, A4.* |
| **2** | **Components** | `2.Components/` | *Mỗi mảnh UI tái dùng trông ra sao + đủ trạng thái nào?* |
| **3** | **Patterns** | `3.Patterns/` | *Tình huống lặp lại: rỗng / loading / lỗi / validate / phản hồi.* |
| **4** | **Layouts** | `4.Layouts/` | *Khung app, lưới pane, responsive, bản đồ route.* |
| **5** | **Flows** | `5.Flows/` | *Từng màn theo module (Write/Export/Present) — wireframe-level.* |
| — | **Other** | `Other/` | *Cross-cutting: Motion · Accessibility · Voice & Content · Icons · **Signature Interactions** (hành vi độc bản).* |

> 🧭 **Triết lý:** Tầng trên là **danh từ** (giá trị), tầng dưới là **động từ** (trạng thái) và **giọng văn** (định hướng). UI xấu thường vì có danh từ mà thiếu hai cái sau.

---

## 🔗 QUAN HỆ VỚI TÀI LIỆU SẴN CÓ

* **Foundations = token có sẵn, KHÔNG nhân bản.** Giá trị token (màu/chữ/A4/severity) vẫn nằm canonical tại `Design/Modules/Other/DesignSystem_Tokens.md` — file đó được tham chiếu bằng tên trong toàn bộ contract lịch sử nên **không đổi tên/đổi chỗ**. `1.Foundations/` chỉ *trỏ tới* nó và bổ sung phần mới (vd font-pairing).
* **Map sang `src/`** (đúng tinh thần "module ⇄ `src/modules/<module>`"): `2.Components/Button.md` ⇄ `src/components/ui/Button.tsx`; `4.Layouts/AppShell.md` ⇄ shell app; `1.Foundations` ⇄ `globals.css` token layer.
* **Contract-first vẫn áp dụng:** task frontend cũng tạo Contract (`Design/ContractForAI/`), và Contract **phải reference** spec component + danh sách trạng thái phải cover.
* **DoD bổ sung:** task UI chỉ "done" khi đã cover **empty / loading / error**, không chỉ happy-path (xem `3.Patterns/`).

---

## ♻️ TÁI DÙNG CHO DỰ ÁN SAU

| Mang đi nguyên (discipline) | Điền lại mỗi dự án (taste) |
| :--- | :--- |
| Hình dạng folder này · `2.Components/_ComponentSpecRule.md` · catalog `3.Patterns/` · `Other/Accessibility.md` · `Other/Motion.md` | `0.ArtDirection.md` (tính cách khác) · token values · danh sách component thật · `5.Flows/` |

> **Discipline mang đi, taste điền lại.**

---

## 🧰 STACK NỀN COMPONENT (đã chốt)

| Quyết định | Chốt | Ghi chú |
| :--- | :--- | :--- |
| Component tương tác (Dialog/Tabs/Toast/Select) | **Radix UI headless** | lo focus-trap/keyboard/aria, style bằng token CSS |
| Component thường (Button/Input/Textarea/Badge) | **tự code** + token | không cần lib |
| Icon | **Lucide** (`lucide-react`) | xem `Other/Icons.md` |
| CSS | **co-located** mỗi component (`Button.tsx` + `Button.css`) + token `--rs-*` | không Tailwind/CSS-in-JS |
| Vị trí src | `src/components/ui/` (primitive mới) | panel cũ refactor dùng dần |

> ⚠️ **DEPENDENCY MỚI cần ghi nhận:** `@radix-ui/react-{dialog,tabs,toast,select}` + `lucide-react` là **bổ sung so với stack khoá cứng**. Phải cập nhật `Design/Modules/Other/TechnicalStack.md` + `package.json` trước khi code (Golden Rule "Single Source of Truth").

---

## 📌 TRẠNG THÁI HIỆN TẠI

* `0.ArtDirection.md` — ✅ **đã viết đầy** + **§12 hệ ẩn dụ chữ ký "bàn viết → tờ nộp"** (định danh độc bản).
* `1.Foundations/` — token canonical đã có; `Typography.md` = ✅.
* `2.Components/` — ✅ **8 spec:** Button · Input · Select · Textarea · Badge · Dialog · Tabs · Toast (khuôn `_ComponentSpecRule.md`).
* `3.Patterns/` — ✅ 5 pattern (Empty · Error · Feedback · FormValidation · Loading) có **case domain + bố cục**.
* `4.Layouts/` — ✅ AppShell (signature shell) · InformationArchitecture · Responsive.
* `5.Flows/` — ✅ Write · Export · Present theo khuôn **`_FlowSpecRule.md`** (screen spec: pane/primary/states/copy/gate/chữ-ký).
* `Other/` — ✅ VoiceAndContent (+ §8 nhịp deadline) · Icons · Motion · Accessibility · **`SignatureInteractions.md`** (5 hành vi độc bản — mới).

> ⚠️ **HANDOFF mở:** "Deadline hạng nhất" cần `ReportProject.deadline` ở `Modules/` (xem `0.ArtDirection.md` §12.6) — tầng Frontend đã spec vỏ & hành vi, chờ data model.
