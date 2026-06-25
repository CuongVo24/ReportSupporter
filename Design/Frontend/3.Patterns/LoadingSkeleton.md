# ⏳ LOADING & SKELETON

> **STATUS: 🟡 SKELETON.** **AI RULE:** Ưu tiên **skeleton** (giữ layout) hơn spinner trống. Mọi thao tác async > ~300ms phải có phản hồi loading.

## Khi nào (chỗ async trong ReportSupporter)
- [ ] Mở/khởi tạo workspace (đọc IndexedDB) · render preview (debounce) · chạy checker · export (job lifecycle PDF/DOCX).

## Quy ước
- [ ] < ~300ms: không hiện gì (tránh nhấp nháy). 300ms–vài giây: skeleton/inline spinner. Lâu/job: progress + trạng thái (xem `5.Flows/Export.md`).
- [ ] Skeleton dùng surface-muted, shimmer tôn trọng `prefers-reduced-motion`.
- [ ] Nút async chuyển **loading state** + khoá click lặp (xem `2.Components/Button.md`).

## Do / Don't
- [ ] ✅ giữ layout ổn định khi load · ❌ spinner toàn màn cho thao tác nhỏ.

## Cross-refs
- `Modules/Other/OptimizePerformance.md` (debounce preview) · `Other/Motion.md` · token §2.2.
