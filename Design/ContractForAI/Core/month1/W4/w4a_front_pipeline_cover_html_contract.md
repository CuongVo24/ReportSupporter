# Contract For AI - W4 Group A: Shared Front Pipeline, Cover Page & Real HTML Export

> **Lane / Week:** Core / Month 1 / W4 - Day 1 (`Design/TaskBrief/Core/month1/w4.md` `[C46]`-`[C48]`).
> **Branch:** `feature/W4-export-mvp`.
> **Builds on:** W2 `renderMarkdown`/`parseMarkdown` (`src/lib/markdown-pipeline.ts`), W3 Format public surface (`parseHeadings`/`numberHeadings`/`generateToc`, `src/modules/format/index.ts`), W1 `export-html.ts` raw-`<pre>` stub + canonical `ReportProjectBundle`/`FormattedReport`/`Export*` types.
> **Depended on by:** Group B (PDF prints this HTML), Group C (DOCX shares the same `FormattedReport`), Group D/E (panel + acceptance use these exporters).
> **Sources:** `w4.md` Locked Decisions #1/#5/#6/#8, `week4.md` Day 1, `4.Export.md` §5.1 / §5.2 / §3.2, `CanonicalTypes.md` §7/§8.

---

## 1. Micro-task Target

Build the **shared front pipeline** (merge → parse → format → assemble one `FormattedReport`) and the module-only `CoverPageData`/`ExportInput` types, then replace the raw-`<pre>` HTML stub with **real** pipeline HTML (formatted hast → `rehype-stringify` + embedded print CSS + cover page + TOC), self-contained and offline. This `FormattedReport` is the single source the PDF (Group B) and DOCX (Group C) targets reuse — no exporter re-numbers anything.

> **🔒 One source, three targets (Locked #1/#5).** Numbering/TOC come from `prepare-export.ts` assembling `FormattedReport` via the W3 Format functions. The exporters render that one object. No second parser, no second counter.

## 2. Scope

### In scope (`[C46]`/`[C47]`/`[C48]`)
- `src/modules/export/prepare-export.ts`: `prepareExport(bundle: ReportProjectBundle): ExportInput` — (1) merge `project.metadata` + `sections[]` sorted by `order` into a logical document + build `CoverPageData`; (2) parse to mdast via `parseMarkdown`; (3) assemble `FormattedReport` (`toc` via `generateToc(numberHeadings(parseHeadings(ast)))`, `figures`/`tables` from caption entries, `preset` from `bundle.formatSettings`, `hast` from the pipeline, `mdast` for DOCX). Pure, offline.
- `src/modules/export/types.ts`: `CoverPageData`, `ExportInput` (`4.Export.md` §3.2) — the **only** module-local types (everything else is canonical).
- `src/modules/export/schemas.ts`: `exportJobSchema` (`4.Export.md` §3.3) — validate `ExportJob` at load/store.
- `src/modules/export/build-cover-page.ts`: `buildCoverPage(cover: CoverPageData): string` — metadata → cover-page HTML fragment (title/school/course/lecturer/members/date).
- `src/modules/export/export-html.ts` (REPLACE stub): `exportHtml(bundle): ExportResult` → real self-contained HTML from the formatted hast (`rehype-stringify`), with `print-css` embedded, cover page + TOC prepended, base64 images inline, Mermaid client-render script embedded. Returns typed `ExportResult` (no throw).
- `src/modules/export/print-css.ts`: `buildPrintCss(preset: FormatPreset): string` — A4, Times New Roman 13/14, line-height 1.5, justify, margins, `break-before: page` for chapters, `break-inside: avoid` for figure+caption.
- Vitest: `prepare-export` (sections merged by `order`; `FormattedReport.toc` matches W3 numbering), `build-cover-page` (metadata fields rendered), `export-html` (output contains `<table>`/heading numbers/cover fields; same numbering as preview; no raw `<pre>` dump).

### Out of scope
- ❌ PDF (Group B) / DOCX (Group C) / export UI + job lifecycle (Group D) / acceptance report (Group E).
- ❌ Changing W3 Format numbering or W2 pipeline.
- ❌ `puppeteer`/`@react-pdf`/Pandoc/LibreOffice (banned/deferred).
- ❌ Any dep beyond what W2 installed (`docx` lands in Group C).
- ❌ List of figures/tables, advanced page-break tuning (W7).

## 3. Checklist
- [ ] `prepare-export.ts` assembles **one** `FormattedReport` reusing W3 Format functions (no re-numbering); pure + offline; ≤200 lines.
- [ ] `types.ts` defines only `CoverPageData` + `ExportInput`; everything else imported from `@/types`.
- [ ] `schemas.ts` `exportJobSchema` matches canonical `ExportJob` (§8).
- [ ] `export-html.ts` stub fully replaced — real pipeline HTML, self-contained, print CSS embedded, returns `ExportResult` (no throw).
- [ ] `print-css.ts` maps `FormatPreset` → A4 print CSS.
- [ ] Tests: merge order, TOC/numbering parity vs W3, cover fields, HTML structure (no raw `<pre>` markdown).
- [ ] 4 gates green.

## 4. Expected Interfaces / Files

```ts
// src/modules/export/types.ts
export type CoverPageData = { title: string; school?: string; course?: string; lecturer?: string; members?: string[]; date?: string };
export type ExportInput = { bundle: ReportProjectBundle; cover: CoverPageData; formatted: FormattedReport };

// src/modules/export/prepare-export.ts
export function prepareExport(bundle: ReportProjectBundle): ExportInput;

// src/modules/export/build-cover-page.ts
export function buildCoverPage(cover: CoverPageData): string;

// src/modules/export/print-css.ts
export function buildPrintCss(preset: FormatPreset): string;

// src/modules/export/export-html.ts (replaces stub)
export function exportHtml(bundle: ReportProjectBundle): ExportResult;
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/export/prepare-export.ts` | NEW | ~90 |
| `src/modules/export/types.ts` | NEW | ~20 |
| `src/modules/export/schemas.ts` | NEW | ~25 |
| `src/modules/export/build-cover-page.ts` | NEW | ~50 |
| `src/modules/export/print-css.ts` | NEW | ~70 |
| `src/modules/export/export-html.ts` | REPLACE | ~90 |
| `src/modules/export/*.test.ts` | NEW | ~120 |

> **Import boundary:** export files import `@/lib/markdown-pipeline` + `@/modules/format` (public surface) + `@/types`. No UI import, no `fetch`, offline. HTML output is self-contained.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| HTML export ≠ preview (raw `<pre>` drift) | High | Replace stub with `unified`/formatted-hast HTML; test no raw markdown dump. |
| Two numbering paths (export re-numbers) | High | `prepare-export` reuses W3 `numberHeadings`/`generateToc`; exporters render the assembled `FormattedReport`. |
| Re-declaring canonical `Export*`/`FormattedReport` | Medium | Import from `@/types`; only `CoverPageData`/`ExportInput` are module-local (§3.2). |
| HTML not offline (external CSS/fonts) | Medium | Embed print CSS + base64 images; declare TNR with serif fallback. |
| File > 200 lines | Medium | Split prepare / cover / print-css / html into separate files. |

## 6. Verification Plan
- `prepareExport` over a 3-section bundle → sections merged in `order`; `formatted.toc` equals `generateToc(numberHeadings(...))`.
- `buildCoverPage({title, school, members})` → HTML contains all fields.
- `exportHtml(bundle)` → `ok:true`, blob HTML contains `<table>`, heading numbers `1`/`1.1`, cover fields, embedded print CSS; **no** raw `<pre>` markdown.
- Heading numbers in HTML match the W3 preview numbering (parity).
- Forced failure → `ok:false`, `error.stage="render-html"`, recoverable, no throw.
- lint/typecheck/test/build green.

## 7. Status

`DONE`
