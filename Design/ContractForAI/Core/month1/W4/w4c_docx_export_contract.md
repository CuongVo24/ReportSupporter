# Contract For AI - W4 Group C: DOCX Export via `docx`

> **Lane / Week:** Core / Month 1 / W4 - Day 3 (`Design/TaskBrief/Core/month1/w4.md` `[C51]`-`[C52]`).
> **Branch:** `feature/W4-export-mvp`.
> **Builds on:** Group A (`prepare-export` → `FormattedReport` with `mdast` + `preset`), W2 mdast nodes, W1 `export-docx.ts` typed-error stub.
> **Depended on by:** Group D (panel triggers DOCX), Group E (acceptance verifies DOCX parity).
> **Sources:** `w4.md` Locked Decisions #1/#3/#5, `week4.md` Day 3, `4.Export.md` §5.4 / §6 (DOCX edge cases), `TechnicalStack.md` §4 (no Pandoc/LibreOffice).

---

## 1. Micro-task Target

Generate `report.docx` **directly from the mdast AST** via the `docx` library — heading numbering (from the shared `FormattedReport`), tables, code blocks, images, captions, cover page, TOC. No Pandoc, no LibreOffice, no HTML round-trip. Editable best-effort; uses the same numbering as HTML/PDF.

> **🔒 DOCX from mdast via `docx` only (Locked #3).** Map mdast nodes → `docx` elements. Numbering comes from the shared `FormattedReport` (no re-numbering). `@react-pdf`/Pandoc/LibreOffice are banned (`TechnicalStack.md` §4).
>
> **🔒 `exportDocx` is synchronous (Locked #9).** `exportDocx` synchronously **builds** the `docx.Document` and returns a typed sync result (build errors surface immediately). The only async operation — `Packer.toBlob` (`docx`/JSZip has no sync packer) — is a **separate** `packDocx(doc): Promise<Blob>` helper that Group D's `use-export` awaits once at download time. The exporter never returns a `Promise`.

## 2. Scope

### In scope (`[C51]`/`[C52]`)
- `npm i -E docx` (exact pin; record version in this contract after install).
- `src/modules/export/mdast-to-docx.ts`: `mdastToDocxBlocks(mdast: MdastRoot, formatted: FormattedReport): (Paragraph | Table)[]` — node mapping (`4.Export.md` §5.4):
  - `heading` → `Paragraph` + `HeadingLevel` + assigned number (depth > 6 → level 6, full number kept in text).
  - `paragraph`/`text`/`strong`/`emphasis`/`inlineCode` → `TextRun` with style.
  - GFM `table` → `Table`/`TableRow`/`TableCell` (autofit/width; wide-table flag honoured).
  - `code` (fenced) → monospace `Paragraph` (keep lang label if present).
  - `image` (`asset:`/base64) → `ImageRun`; orphan `asset:` → placeholder, no throw.
  - `math` → fallback (text/representation; KaTeX is HTML-only — documented limit).
- `src/modules/export/export-docx.ts` (REPLACE stub): `exportDocx(bundle): DocxBuildResult` — **synchronously** build the `docx` `Document` (apply `FormatPreset` → font TNR 13/14, line-height, A4 margins, justify; `chapterStartsNewPage`→`PageBreak` before h1; cover page + TOC from `formatted.toc`); return `{ ok:true, doc } | { ok:false, error }` (no throw, build errors typed). Plus `packDocx(doc): Promise<Blob>` — the lone async (`Packer.toBlob`), called by Group D's `use-export` at download time. `DocxBuildResult` is module-local; the UI-facing canonical `ExportResult { ok:true, blob }` is produced by the hook after `packDocx`.
- Vitest: `mdast-to-docx` mapping (heading number, table rows, code block, image placeholder for orphan asset, math fallback), `export-docx` (sync build → `{ ok:true, doc }`; deterministic; no Pandoc/LibreOffice call), `packDocx` (resolves to a valid `.docx` blob; zip signature).

### Out of scope
- ❌ HTML/PDF targets (Groups A/B) and export UI/job lifecycle (Group D).
- ❌ Advanced DOCX layout verification checklist (W7).
- ❌ Word-native field TOC tuning beyond MVP (build from `formatted.toc`).
- ❌ Any dep other than `docx`.

## 3. Checklist
- [ ] `docx` installed exact-pinned; version recorded.
- [ ] `mdast-to-docx.ts` maps heading/paragraph/table/code/image/math; numbering from `FormattedReport` (no re-number).
- [ ] Depth > 6 → level 6 + full number in text; orphan `asset:` → placeholder (no throw).
- [ ] `export-docx.ts` stub replaced — `exportDocx` **sync** builds `Document` (+ `FormatPreset` styles + cover + TOC), returns `DocxBuildResult` (no Promise); `packDocx(doc)` is the only async (`Packer.toBlob`).
- [ ] No Pandoc/LibreOffice/`@react-pdf` import anywhere.
- [ ] Tests cover mapping + blob output + orphan-image placeholder + math fallback.
- [ ] 4 gates green.

## 4. Expected Interfaces / Files

```ts
// src/modules/export/mdast-to-docx.ts
export function mdastToDocxBlocks(mdast: MdastRoot, formatted: FormattedReport): Array<import("docx").Paragraph | import("docx").Table>;

// src/modules/export/export-docx.ts (replaces stub) — exporter is SYNCHRONOUS
import type { Document } from "docx";
export type DocxBuildResult = { ok: true; doc: Document } | { ok: false; error: ExportError };
export function exportDocx(bundle: ReportProjectBundle): DocxBuildResult;   // sync build, no Promise
export function packDocx(doc: Document): Promise<Blob>;                     // lone async (Packer.toBlob), awaited by use-export
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/export/mdast-to-docx.ts` | NEW | ~150 |
| `src/modules/export/export-docx.ts` | REPLACE | ~80 |
| `src/modules/export/mdast-to-docx.test.ts` · `export-docx.test.ts` | NEW | ~110 |
| `package.json` / `package-lock.json` | MODIFY | `docx` |

> **Import boundary:** imports `docx` + Group A (`prepare-export`) + `@/types` + `mdast`. No HTML round-trip, no Pandoc/LibreOffice, no `fetch`, offline.
> **Sync decision (Locked #9):** `exportDocx` is synchronous (build only) and returns `DocxBuildResult`. The single async — `packDocx` (`Packer.toBlob`) — lives here but is **not** an exporter; Group D `use-export` awaits it once at download and maps any pack error to `ExportError { stage:"render-docx" }`. Canonical `ExportResult` is unchanged.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| DOCX numbering ≠ HTML/PDF | High | Use the shared `FormattedReport` numbering; no re-number in the mapper. |
| Complex Markdown unfaithful in DOCX | Medium | Controlled node mapping; Vitest on table/code/image/math samples. |
| Orphan `asset:` image throws | Medium | Insert placeholder, never throw; Module 3 catches earlier. |
| KaTeX math lost in DOCX | Low | Documented fallback (text/representation); HTML/PDF render real math. |
| Deep heading depth > 6 | Low | Map to level 6, keep full number in text (`4.Export.md` §6). |
| Pandoc/LibreOffice creeps in | Medium | `docx` only; grep confirms no banned import. |

## 6. Verification Plan
- `mdastToDocxBlocks` over a heading → `Paragraph` with the assigned number + HeadingLevel.
- GFM table → `Table` with matching row/cell count.
- Orphan `asset:ghost` → placeholder block, no throw.
- `math` node → fallback block (no crash).
- `exportDocx(bundle)` → sync `{ ok:true, doc }` (no Promise); deterministic build across runs.
- `await packDocx(doc)` → valid `.docx` blob (zip signature); pack failure → rejects/mapped to `ExportError`, not swallowed.
- Heading numbers in DOCX match HTML/PDF (parity).
- lint/typecheck/test/build green.

## 7. Status

`WAITING_FOR_APPROVAL`

> Suggested commits: (1) install `docx` + mdast-to-docx mapper; (2) export-docx Document + Packer + tests; +1 docs commit.
