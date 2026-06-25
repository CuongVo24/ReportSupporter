# ⚠️ ERROR STATES

> **STATUS: ✅ SPEC.** **AI RULE:** Lỗi phải **giải thích + cho lối thoát (retry/khắc phục)**, không chỉ báo đỏ. Giọng giúp đỡ, không trách (`0.ArtDirection.md` §9). Severity dùng đúng token, **kèm icon + chữ** (a11y, không chỉ màu). Copy ở `Other/VoiceAndContent.md` §4 — file này lo **phân loại + mức hiển thị + bố cục**.

---

## 1. Phân loại lỗi & kênh hiển thị

| Loại lỗi | Mức hiển thị | Bố cục | Nguồn |
| :--- | :--- | :--- | :--- |
| Nhập liệu (field metadata) | **inline** cạnh field | message dưới field + viền error | `FormValidation.md`, `1.Write.md` |
| Render/parse Markdown (Mermaid/KaTeX) | **inline trong tờ nộp** | khối lỗi tại chỗ, **không** trắng pane | `1.Write.md` §6 |
| Ảnh hỏng / `asset:` mồ côi | **inline** | ô "ảnh lỗi" giữ layout | `1.Write.md` §6 |
| Export job fail | **panel/toast** | stage lỗi + `message` + **Thử lại** | `5.Flows/Export.md`, `4.Export.md` §5.5 |
| Hệ thống (IndexedDB quota / đọc lỗi) | **banner cấp shell** | banner + cách khắc phục, giữ nội dung RAM | `1.Write.md` §6, `AppShell.md` §4 |

## 2. Ba mức hiển thị (chọn theo độ nghiêm trọng)

```
inline   → nhẹ, gắn ngữ cảnh, không cướp focus      (lỗi cục bộ: field, 1 ảnh, 1 block)
toast    → thoáng qua, có action; lỗi không tự tắt   (export fail → Thử lại)
banner   → dải cấp vùng/shell, ở lại tới khi xử lý   (quota, đọc dữ liệu)
dialog   → chặn, cần quyết định                       (hiếm — vd xung đột nghiêm trọng)
```
- Một lỗi cục bộ **không** được làm sập cả màn (`1.Write.md`: preview lỗi 1 block ≠ trắng pane).
- Severity tô bằng `--rs-color-severity-error` + `--rs-color-severity-error-bg`, icon `XCircle`, **kèm chữ**.

## 3. Khuôn message (luôn 2 phần)

> **{Cái gì sai}** + **{làm gì tiếp}**. Vd: "Xuất PDF chưa xong. **Thử lại?**" / "Bộ nhớ trình duyệt đầy — xoá ảnh lớn/project cũ."

## 4. ✅ Do / ❌ Don't

| ✅ Do | ❌ Don't |
| :--- | :--- |
| Nêu cái gì sai + làm gì tiếp | "Something went wrong" cụt lủn |
| Lỗi cục bộ ở lại cục bộ | Sập cả màn vì 1 block lỗi |
| Export lỗi → giữ toast tới khi xử lý | Toast lỗi tự tắt sau 3s |
| Quota lỗi → **giữ nội dung RAM** | Mất bài đang gõ khi ghi lỗi |

## 5. 📎 Cross-refs
- `2.Components/Toast.md` · `Dialog.md` · `Input.md` · `Other/VoiceAndContent.md` §4 · `Other/SignatureInteractions.md` #5 · token §2.3 · `Modules/1.Write.md` §6 · `Modules/4.Export.md` §5.5/§6.
