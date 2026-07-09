# Contract For AI - W21 Group D: Assets, Section Split & ImportDraft

> **Lane / Week:** Core / Month 6 / W21 - Day 4 (`Design/TaskBrief/Core/month6/w21.md` `[C172]`-`[C173]`).
> **Branch:** `feature/W21-import-foundation`.
> **Builds on:** W21A (types), W21C (docx output với ảnh data-URL tạm), `import-assets.ts` + `readme-import.ts` + `markdown-import.ts` hiện có.
> **Depended on by:** Group E (fixtures test trọn flow), W22-W24 (mọi converter dùng chung đường asset/split/draft).
> **Sources:** `w21.md` Locked #4/#5, `CanonicalTypes.md` §11 (`ImportDraft`), `6.Import.md` §4/§7.

---

## 1. Micro-task Target

Hoàn tất **đoạn cuối flow import**: ảnh nhúng → `ReportAsset` (base64, qua đường `import-assets` hiện có, Markdown rewrite `asset://<id>`), heading→section split (tái dùng logic readme-import), và **absorb `MarkdownImportDraft` vào `ImportDraft`** (CanonicalTypes §11) — một shape draft duy nhất, wire vào flow confirm hiện có.

> **🔒 Commit qua Write (Locked #5).** `appendSections`/`replaceSections` + `import-assets` — Import không tự ghi IndexedDB.
> **🔒 Một shape draft (Locked #4).** Sau nhóm này `MarkdownImportDraft` không còn tồn tại; mọi đường import (kể cả `.md`) đi qua `ImportDraft`.
> **⚠️ Asset id sinh mới khi commit** — không tin id từ file nguồn.

## 2. Scope

### In scope (`[C172]`/`[C173]`)
- Asset stage (**NEW** `src/modules/import/extract-assets.ts`): data-URL/blob trong Markdown → `ReportAsset` + rewrite `asset://<id>`; hỏng/quá lớn → `image-skipped`.
- Section split: heading level split (tái dùng/generalize logic `readme-import.ts`), title từ heading, `status: "draft"`, `order` tuần tự.
- `markdown-import.ts` (MODIFY): `MarkdownImportDraft` → `ImportDraft`; `appendSections`/`replaceSections` giữ signature; call sites cập nhật.
- Wire flow confirm hiện có: dropzone → converter → assets → split → `ImportDraft` → confirm → commit.

### Out of scope
- ❌ Preview diff UI mới / remap heading (W24 — dùng confirm hiện có).
- ❌ Check-on-import (W24); OCR; worker.
- ❌ Đổi schemaVersion/bundle shape.

## 3. Checklist
- [ ] Ảnh docx → `ReportAsset` base64; Markdown chứa `asset://<id>`; preview render được ảnh.
- [ ] Ảnh hỏng/quá lớn → `image-skipped` warning, import vẫn tiếp tục.
- [ ] Split đúng theo heading; document không heading → 1 section, title = fileName.
- [ ] `MarkdownImportDraft` xoá hẳn; `ImportDraft` dùng cho cả đường `.md`; regression `.md` vẫn xanh.
- [ ] Commit chỉ qua `appendSections`/`replaceSections`; section id/asset id sinh mới lúc commit.
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/import/extract-assets.ts` | NEW | data-URL → ReportAsset + rewrite |
| `src/modules/write/markdown-import.ts` | MODIFY | ImportDraft thay MarkdownImportDraft |
| `src/modules/write/readme-import.ts` | MODIFY (generalize) | split helper tái dùng |
| `src/modules/write/import-assets.ts` | REUSE | không đổi shape |
| `src/modules/import/extract-assets.test.ts` | NEW | asset/rewrite/skip |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Xoá `MarkdownImportDraft` vỡ call sites | Medium | Typecheck dẫn đường; regression `.md` bắt buộc. |
| Base64 asset lớn phù IndexedDB | Medium | Asset cap + `image-skipped`; đo dung lượng trong test. |
| Generalize readme-split đổi behavior readme cũ | Medium | Test readme-import hiện có giữ nguyên xanh. |
| Split rơi nội dung trước heading đầu | Low | Nội dung mở đầu → section riêng "Mở đầu"/fileName; test. |

## 6. Verification Plan
- Vitest: extract-assets + split + regression `.md`/readme xanh; 4 gates xanh.
- Manual: import docx có 2 ảnh + 3 heading → 3 sections + 2 assets, preview hiển thị ảnh, commit vào project OK.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `feat(import): embedded images to ReportAsset with asset:// rewrite`; `refactor(import): unify ImportDraft, absorb MarkdownImportDraft`; `docs(import): commit w21d contract`.
