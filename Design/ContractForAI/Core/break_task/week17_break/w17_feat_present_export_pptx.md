# Contract For AI — W17 Feat: Markdown/Outline → PPTX (Xuất PowerPoint Thật)

> **Lane:** Core / break_task / week17_break.
> **Branch:** `w17/upgrade-ux` (nhánh chung cả tuần — không tách nhánh con).
> **Type:** Capability / tính năng mới — finding **S1** (High, [PresentPanel.tsx:109-121](src/modules/present/PresentPanel.tsx#L109) nút "Xuất PPTX (Phase 3)" bị `disabled` cứng dù dữ liệu slide đã sẵn), **S2** (Med, [use-export.ts:9-68](src/modules/export/use-export.ts#L9) `executeExport` mới có `html/pdf/docx` — chưa có đường xuất pptx; `ExportTarget` ([export.ts:4](src/types/export.ts#L4)) chỉ `"html" | "pdf" | "docx"`). Gốc nỗi đau "chuyển markdown sang pptx chưa làm". Review 2026-06-28.
> **Builds on:** Module Present — `usePresent` cấp `slides`/`speakers`/`scripts`/`timeline` ([PresentPanel.tsx:26-41](src/modules/present/PresentPanel.tsx#L26)); type `SlideOutline`/`Speaker`/`SpeakerScript` ([types/present.ts](src/types/present.ts)). Module Export — hệ thống job `useExport` ([use-export.ts:70-221](src/modules/export/use-export.ts#L70)), lịch sử `recordExport`.
> **Sources:** Review 2026-06-28; `VoiceAndContent.md §7`; `Design/Modules` (Present/Export).

---

## 1. Micro-task Target

Hiện thực xuất `.pptx` từ slide outline **client-side**, mỗi `SlideOutline` → 1 slide PPTX (title + bullets), kèm script người nói vào speaker notes. Bỏ disable nút, nối vào hệ thống job export đã có để đồng nhất UX tải file + lịch sử.

- **S1 — Pure builder.** Helper thuần `buildPptx(slides, speakers, scripts, opts)` map: `slide.title` → tiêu đề slide; `slide.bullets` → bullet list; `speakerId` → tên người nói (header/footer hoặc dòng phụ); `scripts[slideId].script` → **speaker notes**. Trả `Blob` (`.pptx`). Cô lập lib trong file này; **`import()` động** `pptxgenjs` để tránh phình bundle trang chính.
- **S2 — Mở `ExportTarget` + nối job.** Mở rộng `ExportTarget` thêm `"pptx"` ([export.ts:4](src/types/export.ts#L4)); thêm nhánh `pptx` trong `executeExport` ([use-export.ts:31-65](src/modules/export/use-export.ts#L31)) và đặt `ext`/`fileName` ([use-export.ts:77-78](src/modules/export/use-export.ts#L77)); tải file đi qua cùng đường `URL.createObjectURL` như html/docx (nhánh `target !== "pdf"`). **Lưu ý:** PPTX cần dữ liệu Present (slides) — không có trong `ReportProjectBundle`. Chọn 1 trong 2 (chốt lúc Approve): (a) `buildPptx` nhận `slides/speakers/scripts` trực tiếp từ `PresentPanel`, gọi runExport biến thể; hoặc (b) tái dựng outline từ `bundle` qua `generate-outline` trong `executeExport`. Ưu tiên (a) — dùng đúng outline người dùng đang thấy/sửa.
- **S3 — Wiring nút.** Bỏ `disabled` ở [PresentPanel.tsx:109-121](src/modules/present/PresentPanel.tsx#L109); nối onClick → export pptx; trạng thái loading/done/error + toast; chặn xuất khi `slides.length === 0` (đã có empty-state riêng).
- **S4 — Microcopy + a11y.** Đổi nhãn "Xuất PPTX (Phase 3)" → "Xuất PowerPoint (.pptx)"; tooltip/aria theo `§7`; thông báo lỗi recoverable theo pattern `ExportError`.

> 🔒 **Client-side, không gửi nội dung ra mạng** — không phụ thuộc cấu hình AI.
> 🔒 **`pptxgenjs` nạp động** (`import()`), không bundle vào trang chính.
> 🔒 **Không phá public surface khác của `ExportTarget`** ngoài việc thêm `"pptx"`; nơi nào `switch`/map theo target phải xử lý nhánh mới (vd `prepare-export`, `SubmissionPanel`, `export-history`) để không vỡ type.

## 2. Scope

### In scope
- [src/modules/present/export-pptx.ts](src/modules/present/export-pptx.ts) (NEW): `buildPptx(slides, speakers, scripts, opts)` thuần → `Blob`; `import()` động `pptxgenjs`.
- [src/modules/present/export-pptx.test.ts](src/modules/present/export-pptx.test.ts) (NEW): unit (số slide = số outline, title/bullets/notes map đúng, slide rỗng/biên).
- [src/types/export.ts](src/types/export.ts) (MODIFY): `ExportTarget` += `"pptx"`.
- [src/modules/export/use-export.ts](src/modules/export/use-export.ts) (MODIFY): nhánh `pptx` + `ext`/`fileName`.
- [src/modules/present/PresentPanel.tsx](src/modules/present/PresentPanel.tsx) (MODIFY): bỏ disable, nối export + trạng thái.
- [src/modules/present/index.ts](src/modules/present/index.ts) (MODIFY): export helper.
- [package.json](package.json) (MODIFY): thêm `pptxgenjs`.
- Các nơi `switch (target)` cần bổ sung nhánh pptx để type không vỡ (vd [prepare-export.ts](src/modules/export/prepare-export.ts), [SubmissionPanel.tsx](src/modules/export/SubmissionPanel.tsx) nếu liệt kê target).

### Out of scope
- ❌ Theme/template PPTX cầu kỳ (master slide, brand) — chỉ layout title+bullets+notes cơ bản; nâng cấp để epic sau.
- ❌ Sửa logic sinh outline/script (đã có ở `generate-outline`/`generate-script`).
- ❌ Recovery hub màn trống (→ `w17_fix_empty_report_recovery_hub`).

## 3. Checklist
- [ ] **S1** `buildPptx` tạo `.pptx` mở được; mỗi outline = 1 slide; bullets + speaker notes đúng.
- [ ] **S2** `ExportTarget` có `"pptx"`; `executeExport` + `fileName` `.pptx` chạy; mọi `switch(target)` xử lý nhánh mới (type xanh).
- [ ] **S3** Nút hết disable; bấm → tải file; loading/done/error + toast; chặn khi 0 slide.
- [ ] **S4** Nhãn/microcopy `§7`; a11y nút giữ nguyên.
- [ ] `pptxgenjs` nạp động (không phình bundle trang chính). 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/present/export-pptx.ts` | NEW | builder thuần, `import()` động pptxgenjs |
| `src/modules/present/export-pptx.test.ts` | NEW | unit map outline→slide |
| `src/types/export.ts` | MODIFY | `ExportTarget` += `"pptx"` |
| `src/modules/export/use-export.ts` | MODIFY | nhánh pptx + fileName |
| `src/modules/present/PresentPanel.tsx` | MODIFY | bỏ disable + wiring |
| `src/modules/present/index.ts` | MODIFY | export |
| `package.json` | MODIFY | + `pptxgenjs` |
| `src/modules/export/*` (switch theo target) | MODIFY | bổ sung nhánh pptx để type không vỡ |

> **Import boundary:** lib mới **duy nhất được phép**: `pptxgenjs` (client-side, nạp động).

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| `pptxgenjs` phình bundle | High | `import()` động trong `export-pptx.ts`; chỉ tải khi user bấm xuất. |
| Thêm `"pptx"` làm vỡ các `switch(target)` đang exhaustive | High | Quét toàn bộ nơi dùng `ExportTarget`, bổ sung nhánh; gate type. |
| Outline dùng để build lệch với cái user đang sửa | Med | Ưu tiên truyền `slides` trực tiếp từ `PresentPanel` (phương án a). |
| Notes/ký tự đặc biệt làm hỏng file pptx | Med | Sanitize text; test slide rỗng/ký tự đặc biệt. |
| SSR/`window` khi build | Low | Lazy import + guard `typeof window`. |

## 6. Verification Plan
- Báo cáo có nội dung → tab Slide → bấm "Xuất PowerPoint" → tải `.pptx`, mở bằng PowerPoint/Google Slides: số slide khớp outline, bullets + speaker notes đúng.
- 0 slide → nút chặn/ẩn, không crash.
- `tsc` xanh sau khi thêm `"pptx"` (mọi switch xử lý đủ).
- Kiểm bundle: trang chính không kéo theo `pptxgenjs` cho tới khi bấm xuất. 4 gate xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit (trên `w17/upgrade-ux`): `feat(present): export slide outline to pptx via lazy pptxgenjs, wired into export jobs`.
