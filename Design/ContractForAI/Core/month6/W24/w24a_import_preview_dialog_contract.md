# Contract For AI - W24 Group A: Import Preview Dialog

> **Lane / Week:** Core / Month 6 / W24 - Day 1 (`Design/TaskBrief/Core/month6/w24.md` `[C196]`-`[C197]`).
> **Branch:** `feature/W24-import-hardening`.
> **Builds on:** W21-W23 (`ImportDraft` + 4 converter + warnings), primitive UI Phase 4 (Dialog/Tabs/Badge/Toast).
> **Depended on by:** Group B (check-on-import hiển thị tại đây), Group C (nút OCR sống trong preview), Group E (E2E đi qua preview).
> **Sources:** `w24.md` Locked #4, `6.Import.md` §4 (flow), W22 `heading-guessed` (điểm hạ cánh).

---

## 1. Micro-task Target

Dựng **ImportPreviewDialog** — trạm kiểm soát trước commit: render Markdown kết quả qua **pipeline chuẩn** (preview thật, không render riêng), panel **warnings** (group theo code, hiện `location`), per-section controls (**giữ/bỏ**, **remap heading level ±1** cascade con), chọn mode **append/replace**. **Draft sạch (0 warning, 0 issue) → commit 1 click.**

> **🔒 Preview không thành friction (Locked #4).** Happy path (.md sạch) không thêm bước so với hiện tại — dialog mở, 1 click commit.
> **🔒 Dùng primitive Phase 4.** Dialog/Tabs/Badge có sẵn — không chế component mới; CSS `var(--rs-*)`.
> **⚠️ Đây là điểm hạ cánh của `heading-guessed`** — heading heuristic W22 phải remap được tại đây.

## 2. Scope

### In scope (`[C196]`/`[C197]`)
- `src/modules/import/ImportPreviewDialog.tsx` (**NEW**): render draft qua pipeline chuẩn; warnings panel (badge count theo code, click → nhảy tới section liên quan); mode append/replace (mặc định append).
- Per-section: checkbox giữ/bỏ; remap heading ±1 (cascade heading con trong section); section có `heading-guessed` đánh dấu trực quan.
- Commit → `appendSections`/`replaceSections` (đường W21D); cancel → không side effect.
- Batch nhiều file: Tabs per file, mỗi file draft độc lập.
- Wire dropzone: converter xong → mở preview (thay confirm cũ).

### Out of scope
- ❌ Check-on-import (Group B); OCR (Group C); worker/progress (Group D).
- ❌ Diff character-level với file gốc; edit Markdown trực tiếp trong dialog (sửa sau commit ở editor chính).

## 3. Checklist
- [ ] Preview render = pipeline chuẩn (so sánh với preview editor cùng nội dung).
- [ ] Warnings group theo code + location; click điều hướng đúng.
- [ ] Remap ±1 cascade đúng (h2→h3 kéo h3 con →h4, max h6); giữ/bỏ section hoạt động.
- [ ] Draft sạch → 1 click commit; cancel không để lại gì.
- [ ] Batch: Tabs per file, commit từng file độc lập.
- [ ] Chỉ dùng primitive Phase 4; ≤200 lines/file (tách sub-component nếu vượt).
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/import/ImportPreviewDialog.tsx` | NEW | Dialog/Tabs Phase 4 |
| `src/modules/import/preview/SectionControls.tsx` | NEW | giữ/bỏ + remap |
| `src/modules/import/preview/WarningsPanel.tsx` | NEW | group + navigate |
| `src/modules/import/remap-heading.ts` | NEW | pure ±1 cascade |
| `src/modules/write/UniversalImportDropzone.tsx` | MODIFY | mở preview thay confirm cũ |
| `src/modules/import/remap-heading.test.ts` | NEW | cascade cases |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Preview render lệch pipeline chuẩn | High | Tái dùng đúng pipeline component/hook hiện có — cấm render path riêng. |
| Remap cascade sai phá cấu trúc | Medium | Pure function + unit test; max h6 clamp. |
| Dialog quá tải file nhiều section | Medium | Virtualize/limit render section dài; Tabs per file. |
| Thêm friction cho happy path | Medium | Locked #4; đo số click trong QA E. |

## 6. Verification Plan
- Vitest remap-heading + component tests xanh; 4 gates xanh.
- Manual: import docx nhiều heading → remap ±1, bỏ 1 section, commit → editor phản ánh đúng.
- Import .md sạch → dialog 1 click, tổng số click không tăng so với confirm cũ.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `feat(import): import preview dialog with warnings + section controls`; `feat(import): heading remap with cascade`; `docs(import): commit w24a contract`.
