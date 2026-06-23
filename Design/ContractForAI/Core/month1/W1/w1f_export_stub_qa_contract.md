# Contract For AI - W1 Group F: Export Stubs & QA Evidence

> **Lane / Week:** Core / Month 1 / W1 - Day 5 (`Design/TaskBrief/Core/month1/w1.md` `[C13]`-`[C15]`).
> **Branch:** `feature/W1-project-bootstrap`.
> **Builds on:** Group C (`ReportProjectBundle` + canonical type surface), Group D (workspace runs locally), Group E (checker gates green).
> **Sources:** `Design/RoadMap/week_1-2-3-4/week1.md` Day 5 + Definition of Done, `Design/TaskBrief/Core/month1/w1.md` Locked Decision #4, `Design/Modules/4.Export.md` §3/§5.5/§9, `Design/Modules/Other/CanonicalTypes.md` §8, `Design/Modules/Other/TechnicalStack.md` §4, `Coding & Git Standard.md` §4b/§6c.

---

## 1. Micro-task Target

Chốt Week 1 bằng cách đặt **đường ray Module Export** vào đúng chỗ: HTML có một stub tối thiểu sinh ra nội dung tự chứa từ `ReportProjectBundle`; PDF/DOCX có service placeholder **trả `ExportResult { ok:false, error }`**, không `throw`; và toàn bộ W1 có bằng chứng QA (`build_output.txt` + `W1_QA_Report.md`). Đây không phải export thật - mục tiêu là khóa interface để W4 thay phần render thật mà không đập lại call-site.

## 2. Scope

### In scope (`[C13]`/`[C14]`/`[C15]`)
- `[C13]` `exportHtml(bundle: ReportProjectBundle): ExportResult`
  - Trả `ok:true` với `Blob` HTML tối thiểu, self-contained, offline-safe.
  - Merge section theo `order`; escape HTML cho title/metadata/markdown raw để không inject markup.
  - Chèn metadata cơ bản (`project.title`, `templateId`, `updatedAt`, `schemaVersion`) và từng section.
  - Không dùng Markdown pipeline thật; W1 HTML stub chỉ để chứng minh surface.
- `[C14]` `exportPdf(...)` + `exportDocx(...)` placeholders:
  - Trả `ExportResult { ok:false, error }`, không throw.
  - PDF error: `stage:"render-pdf"`, message chứa `"not implemented until W4"`, `recoverable:false`.
  - DOCX error: `stage:"render-docx"`, message chứa `"not implemented until W4"`, `recoverable:false`.
- Canonical export types từ `CanonicalTypes.md` §8 nếu chưa có trong `src/types`: `ExportTarget`, `ExportStatus`, `ExportError`, `ExportResult`, `ExportJob`.
- `src/modules/export/index.ts` là public surface cho W4.
- Vitest nhỏ cho export:
  - HTML stub thành công, blob type là `text/html`, section được sort theo `order`, output escape HTML.
  - PDF/DOCX placeholder không throw và trả đúng `stage/message/recoverable`.
- `[C15]` QA evidence:
  - Chạy và lưu output `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
  - Tạo `Design/Reports/Month1/W1/W1_QA_Report.md` tóm tắt gates, manual acceptance, known limitations.
  - Tạo `Design/Reports/Month1/W1/build_output.txt` chứa output build cuối cùng.

### Out of scope (chặn scope-creep)
- ❌ Real PDF render / browser print workflow / Puppeteer - W4.
- ❌ Real DOCX generation / `docx` dependency - W4.
- ❌ `unified`, `remark`, `rehype`, `katex`, `mermaid`, syntax highlight - W2/W4.
- ❌ Export panel UI, download button, job status list, retry UI - W4.
- ❌ `FormattedReport`, TOC, caption numbering, print CSS A4 real - W3/W4.
- ❌ Any new dependency. W1 matrix stays locked.

## 3. Checklist

- [ ] Add canonical export model to `src/types` if missing:
  - `src/types/export.ts` with `ExportTarget`, `ExportStatus`, `ExportError`, `ExportResult`, `ExportJob`.
  - `src/types/index.ts` re-exports it.
  - Optional zod schemas only if needed for tests/QA; do not overbuild.
- [ ] `src/modules/export/export-html.ts`
  - `exportHtml(bundle: ReportProjectBundle): ExportResult`.
  - Sort sections by `order`.
  - Escape `& < > " '` before embedding user content.
  - Return `new Blob([html], { type: "text/html;charset=utf-8" })`.
- [ ] `src/modules/export/export-pdf.ts`
  - `exportPdf(bundle: ReportProjectBundle): ExportResult`.
  - Return typed `ok:false` with `stage:"render-pdf"`, message `"PDF export is not implemented until W4."`, `recoverable:false`.
- [ ] `src/modules/export/export-docx.ts`
  - `exportDocx(bundle: ReportProjectBundle): ExportResult`.
  - Return typed `ok:false` with `stage:"render-docx"`, message `"DOCX export is not implemented until W4."`, `recoverable:false`.
- [ ] `src/modules/export/index.ts` exports `exportHtml`, `exportPdf`, `exportDocx`.
- [ ] `src/modules/export/*.test.ts` or `export.test.ts` covers HTML success + PDF/DOCX placeholder contract.
- [ ] `Design/Reports/Month1/W1/build_output.txt` is created from the final `npm run build`.
- [ ] `Design/Reports/Month1/W1/W1_QA_Report.md` records:
  - Branch + commit hash.
  - Gates: lint/typecheck/test/build.
  - Manual checks: `/` workspace-first, edit -> preview, autosave through refresh, checker panel.
  - Export stub checks.
  - Known W1 limitations and W2/W4 handoff notes.

## 4. Expected Interfaces / Files

```ts
// src/types/export.ts
export type ExportTarget = "html" | "pdf" | "docx";
export type ExportStatus = "idle" | "running" | "done" | "error";
export type ExportError = {
  stage: "merge" | "parse" | "format" | "render-html" | "render-pdf" | "render-docx";
  message: string;
  recoverable: boolean;
};
export type ExportResult =
  | { ok: true; blob: Blob }
  | { ok: false; error: ExportError };
export type ExportJob = {
  id: string;
  target: ExportTarget;
  projectId: string;
  status: ExportStatus;
  startedAt: string;
  finishedAt?: string;
  fileName: string;
  error?: ExportError;
};

// src/modules/export/*
export function exportHtml(bundle: ReportProjectBundle): ExportResult;
export function exportPdf(bundle: ReportProjectBundle): ExportResult;
export function exportDocx(bundle: ReportProjectBundle): ExportResult;
```

| File | NEW/MODIFY | Estimated lines |
|---|---|---:|
| `src/types/export.ts` | NEW | ~35 |
| `src/types/index.ts` | MODIFY | +1 |
| `src/modules/export/export-html.ts` | NEW | ~70 |
| `src/modules/export/export-pdf.ts` | NEW | ~20 |
| `src/modules/export/export-docx.ts` | NEW | ~20 |
| `src/modules/export/index.ts` | NEW | ~5 |
| `src/modules/export/export.test.ts` | NEW | ~70 |
| `Design/Reports/Month1/W1/build_output.txt` | NEW | generated |
| `Design/Reports/Month1/W1/W1_QA_Report.md` | NEW | ~80 |

> **Import boundary (`Coding & Git Standard` §4b):** `src/modules/export/*` may import `@/types` only. No import from `write`, `check`, or UI components. Export module is pure and offline; no `fetch`, no file-system writes, no browser navigation.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Export stub accidentally becomes real W4 work | High | Only `Blob` HTML stub + typed PDF/DOCX errors; no render stack dependencies. |
| PDF/DOCX placeholders throw instead of surfacing typed errors | High | Tests assert `ok:false`, `stage`, `message`, `recoverable:false`; no `throw`. |
| HTML stub injects raw user HTML unsafely | Medium | Escape all project/section/metadata text before interpolation. |
| Type drift from `CanonicalTypes.md` §8 | High | Copy export type names/shapes verbatim into `src/types/export.ts`; re-export once. |
| QA report becomes vague | Medium | Record exact commands, pass/fail, and build output path; mention manual checks explicitly. |
| Generated report/log creates unrelated churn | Low | Write only under `Design/Reports/Month1/W1/`; do not touch earlier reports. |
| New dependencies sneak into W1 | Medium | No package changes for Group F. Blob is available in browser and Node 18+ test runtime. |

## 6. Verification Plan

- **Gates:**
  - `npm run lint` green.
  - `npm run typecheck` green.
  - `npm test` green, including export tests.
  - `npm run build` green; output saved to `Design/Reports/Month1/W1/build_output.txt`.
- **Unit checks:**
  - `exportHtml(bundle)` returns `ok:true`, a `Blob`, `type` includes `text/html`.
  - HTML output includes project title and sorted section titles.
  - HTML output escapes unsafe content (`<script>` does not appear as live markup).
  - `exportPdf(bundle)` returns `ok:false`, `error.stage === "render-pdf"`, message includes `"until W4"`, `recoverable === false`.
  - `exportDocx(bundle)` returns `ok:false`, `error.stage === "render-docx"`, message includes `"until W4"`, `recoverable === false`.
- **Manual acceptance recorded in QA report:**
  - Route `/` renders workspace-first editor, not landing page.
  - Typing in textarea updates raw preview.
  - IndexedDB autosave survives refresh.
  - Checker button shows grouped warnings for TODO/fence without language.
  - Export stubs are present and callable from tests.

## 7. Status

`DONE`

> Theo `VibeCode.md` Step 2: tạo Contract trước, chưa chạm `src/` cho Group F cho tới khi được approve. Đề xuất chia 3 commit nhỏ: (1) canonical export types + export module stubs + tests, (2) QA evidence files, (3) contract/status update sau khi gates xanh.
