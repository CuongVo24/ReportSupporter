# Contract For AI — W19 Fix: Bề Mặt In PDF (Blob/Iframe · Chờ Asset · Progress)

> **Lane:** Core / break_task / week19_break.
> **Branch:** `w19/near-completed` (nhánh chung cả tuần).
> **Type:** Export surface / timing defect.
> **Findings:**
> - **S1** (🟡) — In từ `window.open("","_blank")` + `document.write` ([export-pdf.ts:38-53](src/modules/export/export-pdf.ts#L38)) ⇒ trình duyệt in **URL `about:blank`** ở header (#58) và header/title trùng với H1 thân (#59).
> - **S2** (🟠) — `print()` chạy ở `onload`/sau 500ms ([export-pdf.ts:55-68](src/modules/export/export-pdf.ts#L55)) trong khi **Mermaid & KaTeX nạp từ CDN** ([print-preview.ts:73,87](src/modules/export/print-preview.ts#L73)) render **bất đồng bộ** ⇒ sơ đồ/công thức có thể **trắng** trong PDF; còn phụ thuộc mạng (vi phạm offline-first).
> - **S3** (🟠) — **Không có progress** export (#8): `exportPdf` là một call đồng bộ trả 1 blob ([export-pdf.ts:105](src/modules/export/export-pdf.ts#L105)).
> **Builds on:** `export-pdf.ts`, `print-preview.ts`, `use-export.ts`, `ExportPanel.tsx`.
> **Sources:** Product Review 2026-06-29 (#8, #58, #59, Mermaid/KaTeX trắng).

---

## 1. Micro-task Target

In từ một **document có URL/định danh thật**, **chờ asset render xong** trước khi `print()`, và phản hồi **tiến trình** export.

- **S1 — Bề mặt in có định danh.** Thay `about:blank` bằng **blob URL** (`URL.createObjectURL(htmlBlob)`) hoặc **hidden iframe** cùng tài liệu, đặt `document.title` = tên project. Header in không còn `about:blank`; quy ước running-header (chỉ chương/footer số) tách khỏi H1 thân (#59).
- **S2 — KaTeX/Mermaid local + chờ render.** Bỏ CDN: nhúng **CSS KaTeX local** (đã có `katex` trong deps; `lib/katex-styles.ts`) và **render Mermaid → SVG tĩnh trước khi in** (tái dùng `MermaidRenderer`/`mermaid` đã có) thay vì script CDN chạy sau. `print()` chỉ gọi **sau khi** ảnh + KaTeX + Mermaid sẵn sàng (đợi `images.decode()`/promise mermaid).
- **S3 — Progress export.** `use-export` phát trạng thái theo pha: `preparing → rendering-assets → ready → printing`; `ExportPanel` hiển thị (microcopy `§7`). Không cần %, dùng pha là đủ.

> 🔒 **Offline-first**: sau contract này export **không** cần mạng (KaTeX/Mermaid local).
> 🔒 Không đổi nội dung HTML (A/TOC contract lo); chỉ lo *bề mặt & thời điểm* in.

## 2. Scope

### In scope
- [src/modules/export/export-pdf.ts](src/modules/export/export-pdf.ts) (MODIFY): blob URL/iframe; chờ asset; cleanup `revokeObjectURL`.
- [src/modules/export/print-preview.ts](src/modules/export/print-preview.ts) (MODIFY): bỏ `<link>`/`<script>` CDN; nhúng KaTeX CSS local + Mermaid SVG tĩnh.
- [src/modules/export/use-export.ts](src/modules/export/use-export.ts) (MODIFY): state machine pha + expose progress.
- [src/modules/export/ExportPanel.tsx](src/modules/export/ExportPanel.tsx) (MODIFY): hiển thị pha.
- [src/modules/export/export-pdf.test.ts](src/modules/export/export-pdf.test.ts) / [use-export.test.ts](src/modules/export/use-export.test.ts) (MODIFY): test pha + không-CDN.

### Out of scope
- ❌ Số trang in (TOC contract / Puppeteer P2).
- ❌ Bố cục TOC/cover (TOC contract).

## 3. Checklist
- [ ] **S1** Header in không còn `about:blank`; title = tên project; running-header không trùng H1.
- [ ] **S2** KaTeX/Mermaid local; `print()` chỉ chạy sau khi asset render xong; offline OK.
- [ ] **S3** Progress theo pha hiển thị trong ExportPanel. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/export/export-pdf.ts` | MODIFY | blob/iframe + chờ asset |
| `src/modules/export/print-preview.ts` | MODIFY | KaTeX/Mermaid local |
| `src/modules/export/use-export.ts` | MODIFY | progress pha |
| `src/modules/export/ExportPanel.tsx` | MODIFY | UI pha |
| `src/modules/export/use-export.test.ts` | MODIFY | test pha |

> **Import boundary:** không lib mới (KaTeX/Mermaid đã trong deps).

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Mermaid render trong print-window phức tạp | High | Render SVG **trước** ở app rồi nhúng tĩnh vào HTML in (không chạy mermaid trong cửa sổ in). |
| Blob URL bị chặn popup | Med | Giữ fallback iframe ẩn cùng tài liệu; thông báo nếu popup bị chặn. |
| KaTeX CSS local thiếu font | Med | Đóng gói font KaTeX local; test công thức hiển thị. |

## 6. Verification Plan
- Ngắt mạng → export vẫn ra công thức/sơ đồ đầy đủ (không trắng).
- Print Preview header hiện tên project, không `about:blank`.
- ExportPanel chạy qua các pha; in 75 trang có phản hồi tiến trình. 4 gate xanh.

## 7. Status

`PROPOSED — chờ Approve`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit (trên `w19/near-completed`): `fix(export): print from titled blob surface, embed KaTeX/Mermaid locally, await assets, report progress`.
