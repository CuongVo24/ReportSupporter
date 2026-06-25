# ⏳ LOADING & SKELETON

> **STATUS: ✅ SPEC.** **AI RULE:** Ưu tiên **skeleton** (giữ layout) hơn spinner trống. Mọi thao tác async > ~300ms phải có phản hồi loading. Job dài (export) dùng **timeline thật**, không thanh % giả (`Other/SignatureInteractions.md` #5).

---

## 1. Chỗ async trong ReportSupporter

| Async | Ngưỡng | Phản hồi |
| :--- | :--- | :--- |
| Mở/khởi tạo workspace (đọc IndexedDB) | thường >300ms | **skeleton 4 vùng** AppShell, không spinner toàn màn |
| Render preview (debounce 120–180ms) | <300ms | **không hiện gì** (giữ preview cũ, tránh nháy) |
| Người soát chạy | vài trăm ms | skeleton badge readiness + list |
| Export job (PDF/DOCX) | giây+ | **timeline stage thật** (Export #5) |

## 2. Thang phản hồi theo thời lượng

```
< ~300ms        → KHÔNG hiện gì (tránh nhấp nháy)
~300ms–vài giây → skeleton (giữ layout) hoặc inline spinner nhỏ
job dài         → progress + trạng thái stage thật (Export timeline)
```

## 3. Quy ước skeleton

- Skeleton dùng `--rs-color-surface-muted`; **shimmer tôn trọng `prefers-reduced-motion`** (reduced → tĩnh, không shimmer).
- Giữ **đúng khung** nội dung sắp tới (số dòng, vị trí) — skeleton là "bóng" của layout thật, không phải hộp xám tuỳ tiện.
- Nút async → **loading state** + khoá click lặp (`2.Components/Button.md`): leading icon → `Loader2`, giữ kích thước (không nhảy layout).

## 4. ✅ Do / ❌ Don't

| ✅ Do | ❌ Don't |
| :--- | :--- |
| Skeleton giữ layout ổn định | Spinner toàn màn cho thao tác nhỏ |
| <300ms im lặng | Nháy skeleton cho việc tức thì |
| Export = timeline thật | Thanh % giả "đang xử lý…" |
| reduced-motion → tắt shimmer | Shimmer chạy bất chấp |

## 5. 📎 Cross-refs
- `Modules/Other/OptimizePerformance.md` (debounce preview/autosave) · `Other/Motion.md` · `Other/SignatureInteractions.md` #5 · `2.Components/Button.md` (loading) · token §2.2.
