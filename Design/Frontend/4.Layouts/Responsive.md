# 📱 RESPONSIVE

> **STATUS: ✅ SPEC.** **AI RULE:** ReportSupporter là công cụ **desktop-first** (gõ báo cáo), nhưng phải **không-vỡ** ở màn nhỏ. Tờ nộp A4 luôn giữ tỉ lệ thật, scale-to-fit. Không phình mobile ngoài scope (`0.ArtDirection.md` §10).

---

## 1. Breakpoints & hành vi khung "bàn viết → tờ nộp"

| Breakpoint | Bàn viết ↔ Tờ nộp | Section nav | Rail (người soát/đồng hồ) |
| :--- | :--- | :--- | :--- |
| **desktop** ≥1024px | song song, kéo chỉnh tỉ lệ | cột trái thu gọn được | cột phải thu gọn được |
| **tablet/narrow** 640–1023px | **tab/toggle** Bàn viết ↔ Tờ nộp (không split) | **drawer** trái | **drawer** phải |
| **mobile** <640px | một pane, toggle; ưu tiên **đọc/soát** hơn gõ dài | drawer | drawer; đồng hồ + badge readiness vẫn thấy gọn |

> Min mỗi pane ~320px trước khi rơi xuống chế độ tab (`AppShell.md` §3).

## 2. Quy ước

- **Tờ nộp** giữ tỉ lệ A4 thật (`--rs-report-page-width/height`), **scale-to-fit** theo bề rộng pane — **không bóp méo**, không giãn chữ (measure học thuật giữ nguyên, `Typography.md` §3).
- **Panel phụ → drawer** khi hẹp (section nav, rail) với backdrop; Esc/tap ngoài đóng.
- **Mobile scope:** quyết định sản phẩm — mặc định *đọc + soát + xuất* tốt; gõ dài là trải nghiệm desktop. Có thể hiện gợi ý điềm tĩnh "Tối ưu cho màn lớn để soạn thảo" (1 lần, không chặn).
- Rail thu gọn vẫn cho thấy **severity (chấm+số)** và **thời gian còn lại** — không ẩn hẳn "độ tin" + "đồng hồ".

## 3. ✅ Do / ❌ Don't

| ✅ Do | ❌ Don't |
| :--- | :--- |
| A4 scale-to-fit giữ tỉ lệ | Bóp méo/giãn tờ nộp cho vừa |
| Pane → tab khi hẹp | Cố nhồi 2 pane <320px |
| Panel → drawer có Esc | Panel chồng đè không đóng được |

## 4. 📎 Cross-refs
- `AppShell.md` (§3 tỉ lệ pane) · `Typography.md` §3 (measure) · token §5 (A4) · `0.ArtDirection.md` §10 (Non-goals mobile).
