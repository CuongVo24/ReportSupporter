# Contract For AI - W7 Group E: DOCX Layout Checklist & QA

> **Lane / Week:** Core / Month 2 / W7 - Day 5 (`Design/TaskBrief/Core/month2/w7.md` `[C84]`-`[C85]`).
> **Branch:** `feature/W7-format-hardening`.
> **Builds on:** Group A (caption registry), Group B (LoF/LoT), Group D (PDF page-break), W4 export **thật** (`src/modules/export/mdast-to-docx.ts`, `export-docx.ts`).
> **Depended on by:** W8 (submission package + final checklist dựa trên DOCX layout checklist), Phase 2 quality gate.
> **Sources:** `w7.md` Locked Decisions #1/#5, `week7.md` Day 5, `4.Export.md §6` (numbering parity), prior `W5_QA_Report.md` format.

---

## 1. Micro-task Target

Tạo **checklist xác minh layout DOCX** (heading/caption/table/page setup) đối chiếu cùng caption registry, đồng bộ numbering + page setup giữa DOCX và PDF, rồi chạy 4 gates + viết QA evidence W7 (samples before/after).

> **🔒 Một nguồn số (Locked #1).** DOCX caption numbering + chapter PageBreak đọc cùng registry/preset như PDF — không đánh số riêng.
> **🔒 Harden export THẬT (Locked #5).** `mdast-to-docx.ts`/`export-docx.ts` đã tồn tại (W4); Group E tinh chỉnh + thêm checklist, không viết DOCX exporter mới.

## 2. Scope

### In scope (`[C84]`/`[C85]`)
- `src/modules/export/docx-layout-checklist.ts` (NEW): `verifyDocxLayout(...)` → kiểm heading levels, caption numbering (khớp registry), bảng, page setup (A4/margin, chapter PageBreak); trả danh sách pass/fail có mô tả (dùng tự kiểm + tạo evidence).
- `src/modules/export/mdast-to-docx.ts` (MODIFY): caption numbering + page setup (chapter `PageBreak` trước h1 theo `chapterStartsNewPage`) khớp PDF; đọc cùng registry/preset.
- QA evidence: `Design/Reports/Month2/W7/W7_QA_Report.md` (map DoD `week7.md` + `4.Export.md`), `format_samples/` (PDF before/after page-break, DOCX checklist output), `build_output.txt`.
- Vitest: `docx-layout-checklist.test.ts` — heading/caption/table/page-setup pass trên sample; caption number trong DOCX khớp registry; chapter PageBreak có mặt khi `chapterStartsNewPage`.

### Out of scope
- ❌ Viết lại DOCX exporter (đã có W4 — tinh chỉnh).
- ❌ Caption/LoF/LoT/References logic (Groups A/B/C — chỉ tiêu thụ).
- ❌ `evidence.zip`/README generator (→ W8).
- ❌ Dep mới / network.

## 3. Checklist
- [ ] `docx-layout-checklist.ts`: verify heading/caption/table/page-setup; trả pass/fail mô tả.
- [ ] `mdast-to-docx.ts`: caption numbering + chapter PageBreak khớp PDF (cùng registry/preset).
- [ ] Caption number DOCX = số trong registry (parity).
- [ ] `Design/Reports/Month2/W7/` có QA report + `format_samples/` (PDF before/after, DOCX checklist) + build output.
- [ ] `docx-layout-checklist.test.ts` phủ heading/caption/table/page-setup/PageBreak.
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/modules/export/docx-layout-checklist.ts
export type DocxLayoutCheck = { id: string; ok: boolean; detail: string };
export function verifyDocxLayout(/* docx model / mdast + registry + preset */): DocxLayoutCheck[];
```

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/export/docx-layout-checklist.ts` | NEW | verify heading/caption/table/page setup |
| `src/modules/export/mdast-to-docx.ts` | MODIFY | caption numbering + page setup parity với PDF |
| `src/modules/export/docx-layout-checklist.test.ts` | NEW | pass trên sample; PageBreak; caption parity |
| `Design/Reports/Month2/W7/W7_QA_Report.md` | NEW | kết quả QC + DoD |
| `Design/Reports/Month2/W7/format_samples/` | NEW | PDF before/after page-break, DOCX checklist output |
| `Design/Reports/Month2/W7/build_output.txt` | NEW | log 4 gates |

> **Import boundary:** checklist + docx mapping import `@/types` + registry (Group A) + `docx`. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| DOCX layout không khớp PDF | Medium | Cùng caption registry + preset; checklist verify; sample before/after. |
| Caption number DOCX lệch body/PDF | High | Đọc cùng `CaptionEntry[]` (Group A); không re-number (Locked #1). |
| Chương không sang trang trong DOCX | Medium | `PageBreak` trước h1 theo `chapterStartsNewPage`; test khẳng định. |
| QA report lệch format các tuần trước | Low | Theo `W5_QA_Report.md` + `Reports/README.md`. |
| DOCX exporter bị viết lại ngoài ý | Low | Chỉ tinh chỉnh `mdast-to-docx.ts` (Locked #5). |

## 6. Verification Plan
- DOCX sample: caption "Hình X.Y"/"Bảng X.Y" khớp PDF và registry.
- Mỗi chương h1 có `PageBreak` trước (khi `chapterStartsNewPage`).
- `verifyDocxLayout` trả pass cho heading/caption/table/page-setup trên sample đa template.
- `format_samples/` chứng minh PDF before/after + DOCX checklist end-to-end.
- lint/typecheck/test/build xanh; `build_output.txt` lưu.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(export): DOCX layout checklist + numbering/page-setup parity`; (2) `docs(w7): W7 QA report + format samples (before/after)`; +1 docs commit. Đóng Format Hardening (Phase 2).
