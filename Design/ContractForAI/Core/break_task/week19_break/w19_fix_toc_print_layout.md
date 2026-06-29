# Contract For AI — W19 Fix: Bố Cục In TOC / Cover (Dot Leader · Indent · Ngắt Trang)

> **Lane:** Core / break_task / week19_break.
> **Branch:** `w19/near-completed` (nhánh chung cả tuần).
> **Type:** Print CSS / layout defect.
> **Findings:**
> - **S1** (🔴) — `.ws-toc-link { display:flex; justify-content:space-between }` ([print-css.ts:75](src/modules/export/print-css.ts#L75)) nhưng mỗi dòng **chỉ có 2 span** (số, chữ), **không có span số trang, không có dot leader** ⇒ số dạt trái, chữ dạt phải, khoảng giữa rỗng → #9 "đè title", #12 spacing không đều, #11 thiếu leader.
> - **S2** (🟠) — Indent **hard-code chỉ cấp 2–3** ([print-css.ts:77-78](src/modules/export/print-css.ts#L77)); cấp 1 và cấp ≥4 không có phân cấp → #13.
> - **S3** (🟠) — TOC không có quy tắc **tự ngắt trang** khi quá dài → #60 dồn 1 trang; #14 không chia cột.
> - **S4** (🟡) — Cover dùng `height:90vh` + `space-between` ([print-css.ts:35-39](src/modules/export/print-css.ts#L35)) → phân phối khoảng trắng dọc chưa cân → #61.
> - **Giới hạn:** trình duyệt in HTML **không** tính được số trang (`target-counter`) → #11/#32 số trang **không** khả thi ở nhánh print-window; chỉ đạt được khi có engine số-trang (Puppeteer, P2).
> **Builds on:** `print-css.ts`, `print-preview.ts`, `PreviewPane.tsx` (TocBlock — đã hợp nhất ở A).
> **Sources:** Product Review 2026-06-29 (#9–#15, #60, #61).

---

## 1. Micro-task Target

Chuẩn hoá bố cục mục lục & trang bìa khi in: dot leader, indent theo mọi cấp, ngắt trang hợp lý, cover cân đối.

- **S1 — Dot leader + 3 vùng.** Đổi markup TOC mỗi dòng thành 3 phần: `số+chữ` | `leader` (đường chấm `border-bottom: dotted` co giãn) | `số trang` (placeholder nếu chưa có engine). Bỏ `space-between` 2-span gây dạt.
- **S2 — Indent theo cấp tổng quát.** Thay 2 rule cứng bằng công thức theo `level` (vd `padding-left: calc((level-1) * 16px)`), áp cho mọi cấp 1..N.
- **S3 — Ngắt trang TOC.** `break-inside`/ngưỡng: nếu TOC dài, cho phép tràn nhiều trang sạch (tránh `page-break-inside: avoid` ép dồn 1 trang ở [print-css.ts:41](src/modules/export/print-css.ts#L41) cho `.ws-toc-container`). Cân nhắc đa cột cho danh mục dài.
- **S4 — Cover cân dọc.** Thay `90vh + space-between` bằng phân phối có kiểm soát (grid 3 hàng: school/title/info-date) để khoảng trắng đều.
- **S5 — Số trang (P2, tuỳ Approve).** Chỉ khả thi với engine Puppeteer; nếu không Approve, để placeholder/ẩn cột số trang và ghi backlog (#11/#32, Table of Figures/Tables có số trang #54/#55).

> 🔒 In trắng-đen, `--rs-report-*` bất biến; chỉ chạm CSS in, không đổi cấu trúc số/anchor (đã do A/B chốt).

## 2. Scope

### In scope
- [src/modules/export/print-css.ts](src/modules/export/print-css.ts) (MODIFY): leader, indent công thức, ngắt trang TOC, cover grid.
- [src/modules/export/print-preview.ts](src/modules/export/print-preview.ts) (MODIFY): markup TOC 3-vùng (qua TOC renderer chung của A).
- [src/components/PreviewPane.tsx](src/components/PreviewPane.tsx) (MODIFY): TocBlock khớp markup 3-vùng (parity với print).
- [src/modules/export/print-css.test.ts](src/modules/export/print-css.test.ts) (MODIFY): assert có rule leader/indent/cover.
- [src/app/globals.css](src/app/globals.css) (MODIFY nhẹ): style leader cho preview màn hình.

### Out of scope
- ❌ Engine số trang server-side (P2 riêng nếu Approve Puppeteer).
- ❌ Đổi nội dung TOC/đánh số (A/B).

## 3. Checklist
- [ ] **S1** Dot leader nối số mục ↔ (placeholder) số trang; hết dạt 2 đầu.
- [ ] **S2** Indent đúng mọi cấp.
- [ ] **S3** TOC dài ngắt trang sạch (không dồn/đè).
- [ ] **S4** Cover cân dọc.
- [ ] **S5** (nếu Approve) cột số trang; nếu không → ẩn gọn. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/export/print-css.ts` | MODIFY | leader/indent/ngắt trang/cover |
| `src/modules/export/print-preview.ts` | MODIFY | markup TOC 3-vùng |
| `src/components/PreviewPane.tsx` | MODIFY | TocBlock parity |
| `src/modules/export/print-css.test.ts` | MODIFY | assert rule |
| `src/app/globals.css` | MODIFY | leader màn hình |

> **Import boundary:** không lib mới (trừ khi Approve Puppeteer cho S5 — contract riêng).

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Dot leader vỡ khi tên mục dài/nhiều dòng | Med | leader là phần tử co giãn flex giữa; cho wrap; test mục dài. |
| Đa cột phá thứ tự đọc | Med | Mặc định 1 cột; đa cột chỉ khi rất dài + test. |
| Số trang gây kỳ vọng sai | Med | Nếu không có engine, ẩn cột + ghi rõ giới hạn. |

## 6. Verification Plan
- TOC: mỗi dòng có đường chấm nối; indent tăng theo cấp; mục dài "Quy Ước Viết Tắt…" không bị cắt/đè.
- TOC 40+ mục → tràn nhiều trang sạch, không dồn 1 trang.
- Cover: school/title/info phân bố dọc cân. 4 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit (trên `w19/near-completed`): `fix(export): print TOC dot leaders, per-level indent, page-break rules and balanced cover`.
