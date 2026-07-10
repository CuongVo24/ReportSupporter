# Contract For AI - W21 Group C: DOCX Converter (mammoth)

> **Lane / Week:** Core / Month 6 / W21 - Day 3 (`Design/TaskBrief/Core/month6/w21.md` `[C170]`-`[C171]`).
> **Branch:** `feature/W21-import-foundation`.
> **Builds on:** W21A (`htmlToMarkdown()`, mammoth đã cài), W21B (registry).
> **Depended on by:** Group D (assets/split ăn output nhóm này), Group E (fixtures), W24 E2E.
> **Sources:** `w21.md` Locked #6, `6.Import.md` §5 (DOCX row), `2.Format.md` (số chương duy nhất do Format sinh).

---

## 1. Micro-task Target

Ship **DOCX converter**: `mammoth` (docx → HTML semantic, chạy client-side) → `htmlToMarkdown()` (W21A) → Markdown GFM. Heading/list/bảng giữ cấu trúc; số chương hard-code đầu heading bị strip; phần tử không convert được phát `unsupported-element` — **không nuốt im lặng**. Ảnh để nguyên tham chiếu tạm cho Group D xử lý.

> **🔒 Warning trung thực (Locked #6).** Mọi nội dung bỏ qua phải thành `ImportWarning` có code chuẩn.
> **🔒 Strip số chương.** "1.", "1.2 " đầu heading bị gỡ — Format là nguồn số duy nhất; Check rule `hardcoded-heading-number` là lưới an toàn, không phải giải pháp chính.
> **⚠️ mammoth lazy** — dynamic `import()` trong converter, không vào bundle chính.

## 2. Scope

### In scope (`[C170]`/`[C171]`)
- `src/modules/import/converters/docx.ts` (**NEW**): mammoth `convertToHtml` (style map mặc định + heading map) → sanitize+`htmlToMarkdown()` → `ImportResult`.
- Strip pattern số chương đầu heading (regex `^\d+(\.\d+)*[.)]?\s+`), helper dùng chung (W22 tái dùng).
- mammoth messages (warning nội bộ của mammoth) map → `unsupported-element`/`image-skipped` với message tiếng Việt.
- Track-changes: nhận bản accepted (mặc định mammoth); ghi chú trong QA.
- Đăng ký vào registry (extensions `.docx`, MIME chuẩn + rỗng-fallback).

### Out of scope
- ❌ Ảnh → `ReportAsset` (Group D — ở đây giữ data URL tạm từ mammoth).
- ❌ Section split/ImportDraft (Group D); fixtures thật/QA (Group E).
- ❌ `.doc` cũ (binary format — reject như format lạ); style/màu/box fidelity.

## 3. Checklist
- [ ] Heading h1-h6, list lồng nhau, bảng → GFM đúng cấu trúc.
- [ ] Số chương hard-code đầu heading bị strip (test "1. Mở đầu" → "# Mở đầu").
- [ ] mammoth messages → `ImportWarning` code chuẩn, message tiếng Việt, không nuốt.
- [ ] mammoth dynamic import; không static import ở bundle chính.
- [ ] Converter đăng ký registry; `.docx` MIME rỗng vẫn resolve.
- [ ] `ImportResult.sourceFormat === "docx"`; zod validate pass.
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/import/converters/docx.ts` | NEW | mammoth → htmlToMarkdown |
| `src/modules/import/strip-heading-number.ts` | NEW | helper dùng chung W22 |
| `src/modules/import/converters/docx.test.ts` | NEW | unit trên docx fixture nhỏ inline |
| `src/modules/import/registry.ts` | MODIFY (bootstrap list) | thêm entry docx |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| XSS qua HTML mammoth | High | Bắt buộc đi qua `htmlToMarkdown()` (đã sanitize) — cấm đường tắt. |
| Docx VN (bảng điểm, Times NR) lệch cấu trúc | Medium | Fixture VN ở Group E; style map chỉnh tối thiểu. |
| Nuốt warning mammoth | Medium | Map toàn bộ messages; test đếm warning. |
| Bundle phình | Low | Dynamic import; kiểm build size. |

## 6. Verification Plan
- Vitest: docx nhỏ (heading/list/bảng/heading-số) → snapshot Markdown đúng; warning map test.
- 4 gates xanh; build size không phình bundle chính (mammoth trong async chunk).
- Manual: kéo file .docx thật → preview render cấu trúc đúng.

## 7. Status

`COMPLETED`

> Commit (trên `feature/W21-import-foundation`): `feat(import): docx converter via mammoth`, `feat(import): strip hardcoded heading numbers on import`, `docs(import): commit w21c contract`.
