# 📣 FEEDBACK (xác nhận / phản hồi thao tác)

> **STATUS: ✅ SPEC.** **AI RULE:** Mọi hành động có hệ quả phải có phản hồi **thật** — không "fake" trạng thái (Trustworthy, `0.ArtDirection.md` §1). Ưu tiên **inline/quiet** cho việc thường xuyên; toast cho sự kiện rời rạc; dialog cho việc cần quyết định. Copy ở `Other/VoiceAndContent.md` §6 — file này lo **chọn kênh + rule**.

---

## 1. Chọn kênh phản hồi

| Tình huống | Kênh | Vì sao |
| :--- | :--- | :--- |
| Autosave xong | **inline quiet** (dấu "Đã lưu HH:MM"), **không** toast | xảy ra liên tục — toast = spam (#4 lưu thầm) |
| Export done | **toast success** + **Mở file** | sự kiện rời rạc, có action |
| Người soát chạy xong | **badge readiness** + (tuỳ) toast "Đã soát — {n} vấn đề" | kết quả ở rail là chính |
| Xoá section | **confirm dialog** + **Hoàn tác** (toast undo) | phá huỷ — cần quyết định + lối lùi |
| Đạt sẵn sàng nộp (≥85) | **badge xanh** ghi nhận điềm tĩnh | không tung hô (§12.4) |

## 2. Thang "ồn" của phản hồi

```
quiet inline   ← việc lặp lại nhiều (autosave, preview)      ← MẶC ĐỊNH cho việc thường
toast          ← sự kiện rời rạc, đáng báo (export done/fail)
dialog         ← cần người dùng quyết định trước khi tiếp
```
- Thành công dùng `--rs-color-success` **tiết chế** — không tô xanh mọi nơi.
- "Nói kết quả thật": "Đã xuất PDF" / "Đã soát — 3 vấn đề", **không** "Thành công!" chung chung.

## 3. ✅ Do / ❌ Don't

| ✅ Do | ❌ Don't |
| :--- | :--- |
| Autosave = dấu inline yên | Toast mỗi keystroke autosave |
| Phản hồi đúng kết quả thật | "Thành công!" khi chưa biết kết quả |
| Xoá có **Hoàn tác** | Xoá là mất luôn, không lối lùi |
| Success tiết chế | Confetti/🎉 khi xong (anti-pattern §6) |

## 4. 📎 Cross-refs
- `2.Components/Toast.md` · `Dialog.md` · `Badge.md` · `Other/VoiceAndContent.md` §6 · `Other/SignatureInteractions.md` #2/#4/#5 · token §2.2 (success) · `Modules/1.Write.md` §5.2 (autosave).
