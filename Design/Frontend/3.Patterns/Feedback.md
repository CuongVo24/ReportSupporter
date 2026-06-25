# 📣 FEEDBACK (xác nhận / phản hồi thao tác)

> **STATUS: 🟡 SKELETON.** **AI RULE:** Mọi hành động có hệ quả phải có phản hồi **thật** — không "fake" trạng thái (gu Trustworthy, `0.ArtDirection.md` §1).

## Chọn kênh phản hồi
| Tình huống | Kênh |
| :--- | :--- |
| Autosave xong | toast nhẹ / dấu trạng thái inline |
| Export done | toast + link mở file |
| Check passed | badge readiness + (tuỳ) toast |
| Tác vụ phá huỷ (xoá section) | confirm dialog + undo nếu được |

## Quy ước
- [ ] Ưu tiên inline/quiet cho việc thường xuyên (autosave); toast cho sự kiện rời rạc; dialog cho việc cần quyết định.
- [ ] Thành công dùng `--rs-color-success`; không lạm dụng.

## Do / Don't
- [ ] ✅ phản hồi đúng kết quả thật · ❌ spam toast cho mỗi keystroke autosave.

## Cross-refs
- `2.Components/Toast.md` · `2.Components/Dialog.md` · token §2.2 (success) · `Modules/1.Write.md` (autosave).
