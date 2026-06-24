# Contract For AI - W4 Group B: PDF Export via Browser Print

> **Lane / Week:** Core / Month 1 / W4 - Day 2 (`Design/TaskBrief/Core/month1/w4.md` `[C49]`-`[C50]`).
> **Branch:** `feature/W4-export-mvp`.
> **Builds on:** Group A (`exportHtml` real HTML + `buildPrintCss` + `FormattedReport`), W1 `export-pdf.ts` typed-error stub.
> **Depended on by:** Group D (panel triggers PDF), Group E (acceptance verifies PDF parity).
> **Sources:** `w4.md` Locked Decisions #1/#2/#4, `week4.md` Day 2, `4.Export.md` §5.3 / §6 (browser print limitations), `TechnicalStack.md` §4 (Puppeteer deferred).

---

## 1. Micro-task Target

Implement the MVP PDF path: `exportPdfViaBrowserPrint()` opens the **same** formatted HTML from Group A in a print context and triggers the browser's native `window.print()` / "Save as PDF". No Chromium, no Puppeteer in MVP — `renderPdfWithPuppeteer()` stays a disabled stub for later hardening.

> **🔒 PDF MVP = browser print (Locked #2).** PDF renders from the Group A formatted HTML so numbering = preview = HTML. Header/footer/page-number are browser best-effort and explicitly **not** parity-guaranteed at MVP (`4.Export.md` §5.3). Puppeteer deps are NOT installed.

## 2. Scope

### In scope (`[C49]`/`[C50]`)
- `src/modules/export/export-pdf.ts` (REPLACE stub): `exportPdfViaBrowserPrint(bundle: ReportProjectBundle): ExportResult` — build the printable HTML (Group A `exportHtml` + print CSS), open it in a print surface (new window / hidden iframe), call `window.print()`. Client-only (guard `typeof window`). Returns typed `ExportResult` — on no-window/blocked-popup → `ok:false`, `error.stage="render-pdf"`, recoverable. Keep `renderPdfWithPuppeteer()` as a **stub OFF by default** returning `ExportResult { ok:false, error:{stage:"render-pdf", message:"Puppeteer hardening disabled in MVP", recoverable:false} }` (no `puppeteer` import).
- `src/modules/export/print-preview.ts`: `buildPrintableHtml(input: ExportInput): string` — assemble the print-ready HTML surface (cover + TOC + content + print CSS), header/footer/page-number documented as best-effort.
- Vitest: `print-preview` (printable HTML contains cover + print CSS + content; deterministic from `ExportInput`), `export-pdf` (no-window path → typed recoverable error, no throw; Puppeteer stub returns disabled error without importing puppeteer).

### Out of scope
- ❌ Real Puppeteer / Chromium rendering (later hardening, behind a flag, deps not installed).
- ❌ Pixel-perfect header/footer/page-number (browser best-effort at MVP).
- ❌ HTML/DOCX targets (Groups A/C) and export UI/job lifecycle (Group D).
- ❌ Any new dep.

## 3. Checklist
- [ ] `exportPdfViaBrowserPrint()` reuses Group A HTML + print CSS (same numbering); client-only.
- [ ] No-window / blocked-popup → typed recoverable `ExportResult`, never throws / never hangs.
- [ ] `renderPdfWithPuppeteer()` stub present, OFF, **no `puppeteer` import**.
- [ ] `print-preview.ts` builds deterministic printable HTML from `ExportInput`.
- [ ] Browser print limitations (header/footer/page-number) documented in code + acceptance.
- [ ] Tests cover printable HTML + no-window error + Puppeteer-disabled stub.
- [ ] 4 gates green.

## 4. Expected Interfaces / Files

```ts
// src/modules/export/export-pdf.ts
export function exportPdfViaBrowserPrint(bundle: ReportProjectBundle): ExportResult;
export function renderPdfWithPuppeteer(bundle: ReportProjectBundle): ExportResult; // stub, OFF

// src/modules/export/print-preview.ts
export function buildPrintableHtml(input: ExportInput): string;
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/export/export-pdf.ts` | REPLACE | ~70 |
| `src/modules/export/print-preview.ts` | NEW | ~50 |
| `src/modules/export/export-pdf.test.ts` · `print-preview.test.ts` | NEW | ~80 |

> **Import boundary:** imports Group A (`exportHtml`/`prepare-export`/`print-css`) + `@/types`. No `puppeteer`, no `fetch`, no cloud. Client-only print surface.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| PDF ≠ preview/HTML numbering | High | Print the Group A formatted HTML; one `FormattedReport` source. |
| Browser print differs across browsers | Medium | Standard A4 print CSS; document header/footer/page-number as best-effort. |
| Blocked popup / SSR (`window` undefined) | Medium | Guard `typeof window`; return typed recoverable error, never throw. |
| Puppeteer dep leaks into MVP | Medium | Stub OFF with no import; deps not installed (`TechnicalStack.md` §4). |
| UI hangs on print failure | Medium | Typed `ExportResult`; Group D shows retry, never blocks. |

## 6. Verification Plan
- `buildPrintableHtml(input)` → HTML contains cover + TOC + content + print CSS; deterministic.
- Manual: open formatted HTML → `window.print()` → A4 with TNR/margins/line-height per print CSS; heading numbers match preview.
- No-window context → `exportPdfViaBrowserPrint` returns `ok:false`, `stage:"render-pdf"`, recoverable; no throw.
- `renderPdfWithPuppeteer()` → disabled typed error; grep confirms no `puppeteer` import.
- lint/typecheck/test/build green.

## 7. Status

`DONE`
