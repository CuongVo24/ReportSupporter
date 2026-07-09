# Contract For AI - W21 Group B: Converter Registry & Universal Dropzone

> **Lane / Week:** Core / Month 6 / W21 - Day 2 (`Design/TaskBrief/Core/month6/w21.md` `[C168]`-`[C169]`).
> **Branch:** `feature/W21-import-foundation`.
> **Builds on:** W21A (types `ImportConverter`/`ImportResult`), `MarkdownImportDropzone` + `markdown-import.ts` hiện có, `MAX_MARKDOWN_IMPORT_BYTES`.
> **Depended on by:** Group C/D (DOCX cắm vào registry), W22/W23 (converter mới chỉ đăng ký, không sửa core).
> **Sources:** `w21.md` Locked #4/#5, `6.Import.md` §4 (registry là extension point duy nhất).

---

## 1. Micro-task Target

Dựng **converter registry** (`resolve(file)` theo extension + MIME, `maxBytes` gate, reject-có-thông-báo) và nâng `MarkdownImportDropzone` → **UniversalImportDropzone** (accept list sinh từ registry, per-file độc lập). Đường `.md` hiện có refactor thành `converters/markdown.ts` — **behavior y hệt trước**, có regression test.

> **🔒 Registry là extension point duy nhất (`6.Import.md` §4).** Thêm format sau này = thêm converter; W22/W23 không được sửa file core nhóm này.
> **🔒 Behavior `.md` bất biến (Locked #4).** Người dùng import `.md` không thấy khác biệt nào.
> **⚠️ Extension thắng khi MIME rỗng/sai** (Windows hay gửi MIME rỗng cho .md/.pptx).

## 2. Scope

### In scope (`[C168]`/`[C169]`)
- `src/modules/import/registry.ts` (**NEW**): `register(converter)`, `resolve(file)` (extension + MIME), `maxBytes` gate → `file-too-large`, không match → typed rejection (thông báo tiếng Việt, danh sách format hỗ trợ).
- `src/modules/import/converters/markdown.ts` (**NEW**): wrap đường đọc `.md` hiện có thành `ImportConverter`.
- `MarkdownImportDropzone` → `UniversalImportDropzone` (MODIFY/RENAME): accept từ registry; nhiều file → mỗi file một kết quả/lỗi độc lập; UI state per file.
- Regression test: import `.md` trước/sau refactor cho cùng sections/assets.

### Out of scope
- ❌ DOCX converter (Group C); asset pipeline/section split mới (Group D); preview diff (W24).
- ❌ Converter dynamic-import infra phức tạp hơn mức cần (lazy `import()` trong converter module là đủ).
- ❌ Đổi UX flow confirm hiện có.

## 3. Checklist
- [ ] `resolve()`: đúng converter theo extension; MIME sai/rỗng vẫn resolve theo extension.
- [ ] File > maxBytes → `file-too-large`, không đọc tiếp.
- [ ] Format lạ → reject có thông báo + danh sách format hỗ trợ; không crash.
- [ ] Batch nhiều file: 1 file hỏng không giết các file còn lại.
- [ ] Regression `.md`: sections/assets/summary y hệt trước refactor.
- [ ] Registry core không phụ thuộc converter cụ thể (dependency một chiều).
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/import/registry.ts` | NEW | register/resolve, gate, rejection |
| `src/modules/import/converters/markdown.ts` | NEW | wrap đường .md hiện có |
| `src/modules/write/MarkdownImportDropzone.tsx` | RENAME→`UniversalImportDropzone` | accept từ registry, per-file state |
| `src/modules/import/registry.test.ts` | NEW | resolve/gate/reject/batch |
| `src/modules/write/markdown-import.test.*` | MODIFY | regression `.md` |
| `src/modules/import/index.ts` | NEW | public surface module Import |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Refactor vỡ đường `.md` | High | Regression test bắt buộc trước merge. |
| MIME-only matching hụt file Windows | Medium | Extension ưu tiên; test MIME rỗng. |
| Registry rò phụ thuộc ngược vào converter | Medium | Converter tự đăng ký; core không import converter (trừ bootstrap list). |
| Batch fail dây chuyền | Medium | Promise.allSettled per file; test 1 hỏng + 2 lành. |

## 6. Verification Plan
- Vitest registry + regression `.md` xanh; 4 gates xanh.
- Manual: kéo `.md` + file lạ (.txt) cùng lúc → .md vào, .txt reject có thông báo, không crash.
- Kéo file > 50MB → `file-too-large` hiển thị.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `feat(import): converter registry with size gate + typed rejection`; `refactor(import): universal dropzone, .md as first converter`; `docs(import): commit w21b contract`.
