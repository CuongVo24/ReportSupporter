# Contract For AI - W8 Group A: Submission Package & evidence.zip

> **Lane / Week:** Core / Month 2 / W8 - Day 1 (`Design/TaskBrief/Core/month2/w8.md` `[C86]`-`[C87]`).
> **Branch:** `feature/W8-submission-package`.
> **Builds on:** W4/W7 export **thật** (`src/modules/export/use-export.ts`, `export-html.ts`, `export-pdf.ts`, `export-docx.ts`), W5 `evidence-appendix.ts` (`src/modules/evidence/`), W1 canonical `ReportProjectBundle`/`ExportTarget` (`@/types`).
> **Depended on by:** Group B (README đi vào zip), Group C (checklist gate trước khi đóng gói), Group E (panel + QA).
> **Sources:** `w8.md` Locked Decisions #1/#2/#5, `MasterRoadMap.md` W8 ("Generate `evidence.zip`"), `4.Export.md`, `Support.Evidence.md §5`, `TechnicalStack.md §8c` (install matrix).

---

## 1. Micro-task Target

Đóng gói **một bộ nộp bài** thành `evidence.zip` ở client: gom các file đã export (HTML/PDF/DOCX), bảng phụ lục minh chứng (W5), `README.md` (Group B), và một `manifest.json` mô tả nội dung. Zip sinh trong trình duyệt rồi tải về — **không upload, không cloud**.

> **🔒 Tái dùng exporter có sẵn (Locked #1).** Lớp package **điều phối** các blob đã render từ W4/W7 (`exportHtml`/`exportPdf`/`exportDocx`); **không** render lại từ đầu, không đánh số lại caption.
> **🔒 Local-first, no network (Locked #2).** `JSZip` chạy client; file tải qua `a[download]`. Không fetch, không gửi server.
> **🔒 Dep `jszip` = direct dep pin exact (Locked #5, APPROVED).** `docx` đã kéo JSZip transitively (xem `packDocx`); W8 **nâng thành direct dependency** (review-approved): thêm `jszip` (pin **exact**) vào `package.json` + ghi vào `TechnicalStack.md §8c` mục W8. Không lib zip khác (`adm-zip`/`archiver`…).
> **🔒 Type mới ⇒ sửa CanonicalTypes trước.** `SubmissionPackage`/`PackageManifest` là shape mới → thêm vào `CanonicalTypes.md §8` (Export) trước khi code; import qua `@/types`.

## 2. Scope

### In scope (`[C86]`/`[C87]`)
- `src/types/export.ts` (MODIFY) + `CanonicalTypes.md §8` (MODIFY): thêm `PackageManifest` (`{ generatedAt, projectTitle, files: {name,target}[], evidenceCount }`) + `SubmissionPackage` (`{ manifest, blob }`). Không đổi shape `ExportJob`/`ExportResult`.
- `src/modules/export/build-submission-zip.ts` (**NEW**): `buildSubmissionZip(input): Promise<SubmissionPackage>` — nhận các blob export đã render + appendix + README string, dựng cây thư mục zip (`report.pdf`, `report.docx`, `report.html`, `README.md`, `evidence/appendix.md`, `manifest.json`) bằng `JSZip`; deterministic về tên file/cấu trúc.
- `src/modules/export/index.ts` (MODIFY): export `buildSubmissionZip` + type.
- `package.json` (MODIFY) + `TechnicalStack.md §8c` (MODIFY): thêm `jszip` pin exact (W8 row).
- Vitest: `build-submission-zip.test.ts` — zip chứa đúng tập entry theo input; thiếu PDF/DOCX → bỏ entry đó, không throw; `manifest.json` liệt kê đúng file; cùng input → cùng cấu trúc (deterministic, bỏ qua timestamp).

### Out of scope
- ❌ Render lại HTML/PDF/DOCX (Group A chỉ gom blob đã có — W4/W7).
- ❌ Sinh README (Group B — chỉ nhận string).
- ❌ Final checklist (Group C).
- ❌ Export history (Group D).
- ❌ Upload/cloud; lib zip khác ngoài `jszip`.

## 3. Checklist
- [ ] `PackageManifest`/`SubmissionPackage` thêm vào CanonicalTypes §8 + `@/types`; không re-declare.
- [ ] `buildSubmissionZip`: cây zip đúng (report.*, README.md, evidence/appendix.md, manifest.json) qua JSZip.
- [ ] Thiếu target nào → bỏ entry đó, không throw.
- [ ] `jszip` pin exact trong `package.json` + ghi `TechnicalStack §8c`.
- [ ] No `fetch`/upload; zip sinh client.
- [ ] `build-submission-zip.test.ts` phủ entry-set/missing-target/manifest/deterministic.
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/types/export.ts  (+ CanonicalTypes §8)
export type PackageManifest = {
  generatedAt: string; projectTitle: string;
  files: { name: string; target: ExportTarget | "readme" | "evidence" }[];
  evidenceCount: number;
};
export type SubmissionPackage = { manifest: PackageManifest; blob: Blob };

// src/modules/export/build-submission-zip.ts
export function buildSubmissionZip(input: {
  bundle: ReportProjectBundle;
  exports: Partial<Record<ExportTarget, Blob>>;
  readmeMarkdown: string;
  evidenceAppendixMarkdown: string;
}): Promise<SubmissionPackage>;
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/types/export.ts` | MODIFY | ~+10 |
| `Design/Modules/Other/CanonicalTypes.md` | MODIFY | ~+12 (§8) |
| `src/modules/export/build-submission-zip.ts` | NEW | ~110 |
| `src/modules/export/index.ts` | MODIFY | ~+2 |
| `package.json` / `TechnicalStack.md §8c` | MODIFY | ~+2 |
| `src/modules/export/build-submission-zip.test.ts` | NEW | ~80 |

> **Import boundary:** package module import `@/types` + `jszip`. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Render lại export trong package (drift caption/số) | High | Chỉ nhận blob đã render từ W4/W7; không gọi exporter lại (Locked #1). |
| Cài lib zip ngoài / cài "cho tiện" | Medium | `jszip` đã approved làm direct dep pin exact, ghi install matrix W8; không lib zip khác (Locked #5). |
| Thiếu một target làm vỡ zip | Medium | `exports` là `Partial`; bỏ entry vắng, test missing-target. |
| Re-declare type Export (drift) | Low | Thêm vào CanonicalTypes §8 trước; import `@/types`. |
| Zip không deterministic (timestamp) | Low | So sánh cấu trúc/tên entry, bỏ qua `generatedAt` trong test. |

## 6. Verification Plan
- Input đủ 3 target → zip có `report.html/pdf/docx`, `README.md`, `evidence/appendix.md`, `manifest.json`.
- Chỉ có DOCX → zip có DOCX + README + appendix, không throw; manifest liệt kê đúng.
- `manifest.files` khớp số entry thực; `evidenceCount` = `bundle.evidence.length`.
- grep: không `fetch`/upload trong module.
- lint/typecheck/test/build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(export): submission package types + evidence.zip builder (jszip)`; (2) `chore(deps): pin jszip + record in TechnicalStack install matrix`; +1 docs commit.
