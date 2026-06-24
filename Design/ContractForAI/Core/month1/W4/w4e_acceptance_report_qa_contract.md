# Contract For AI - W4 Group E: Acceptance Report & QA (MVP close)

> **Lane / Week:** Core / Month 1 / W4 - Day 5 (`Design/TaskBrief/Core/month1/w4.md` `[C55]`).
> **Branch:** `feature/W4-export-mvp`.
> **Builds on:** Groups A/B/C/D (all three targets + export UI), W3 checker, W1/W2/W3 sample project.
> **Depended on by:** Phase 2 — W7 (PDF/DOCX hardening references this baseline), W8 (submission package).
> **Sources:** `w4.md` Locked Decisions #1/#4, `week4.md` Day 5, `4.Export.md` §8 (QC checklist) / §9 (Acceptance), `Design/Reports/README.md`, prior `W2_QA_Report.md`/`W3_QA_Report.md` format.

---

## 1. Micro-task Target

Close the Phase-1 MVP loop: run all three exports on a representative sample report, verify parity (cover page + heading numbering + table + code + image + caption across HTML/PDF/DOCX), run the four gates, and write the **first acceptance report** with sample artefacts under `Design/Reports/Month1/W4/`.

## 2. Scope

### In scope (`[C55]`)
- Build/choose a sample report exercising: cover metadata, numbered headings (`1`/`1.1`/`1.1.1`), GFM table, fenced code (with lang), image (`asset:` base64), figure caption, and (best-effort) math + mermaid.
- Run `exportHtml`, `exportPdfViaBrowserPrint` (browser print → Save as PDF), `exportDocx` on the sample.
- Verify against `4.Export.md` §8 QC checklist: cover page, **numbering parity HTML=PDF=DOCX**, structure preserved, browser-print A4, chapter break, page-number limitation documented, mermaid render + failure, broken-image placeholder, PDF first path (no Puppeteer), export error recover, DOCX no-pandoc.
- Run lint / typecheck / test / build; capture `build_output.txt`.
- Write `Design/Reports/Month1/W4/W4_Acceptance_Report.md` (results table mapped to §8/§9, parity evidence, known MVP limits: browser-print header/footer/page-number best-effort, DOCX math fallback) + `samples/` (`report.html`, `report.pdf`, `report.docx`) + `build_output.txt`.

### Out of scope
- ❌ Code changes to exporters/UI (Groups A–D) beyond fixes surfaced by acceptance.
- ❌ Puppeteer parity, W7 hardening checklist, submission package (W8).
- ❌ New deps.

## 3. Checklist
- [ ] Sample report covers cover + heading numbering + table + code + image + caption (+ math/mermaid best-effort).
- [ ] All three exports run on the sample; artefacts saved under `samples/`.
- [ ] Numbering parity verified HTML = PDF = DOCX (documented with evidence).
- [ ] QC checklist (`4.Export.md` §8) walked; each row marked pass / known-limit.
- [ ] lint/typecheck/test/build green; `build_output.txt` captured.
- [ ] `W4_Acceptance_Report.md` written (results + parity + known limits), per `Reports/README.md`.

## 4. Expected Interfaces / Files

> Documentation/evidence only — no `src/` interface changes (fixes excepted).

| File | NEW/MODIFY | Notes |
|---|---|---|
| `Design/Reports/Month1/W4/W4_Acceptance_Report.md` | NEW | results table (§8/§9), parity evidence, known MVP limits |
| `Design/Reports/Month1/W4/samples/report.html` | NEW | real HTML export artefact |
| `Design/Reports/Month1/W4/samples/report.pdf` | NEW | browser-print PDF artefact |
| `Design/Reports/Month1/W4/samples/report.docx` | NEW | `docx` export artefact |
| `Design/Reports/Month1/W4/build_output.txt` | NEW | lint/typecheck/test/build logs |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Parity gaps found late | Medium | Acceptance is the gate; file a fix in the owning group (A/B/C) before sign-off. |
| Browser-print PDF varies by browser | Medium | Record the browser used; document header/footer/page-number as best-effort (not parity). |
| Sample too thin to exercise rules | Low | Sample must include table/code/image/caption/heading-jump; reuse W3 checker_samples. |
| Acceptance scope creeps into hardening | Medium | W7 items (page-break tuning, LoF/LoT) are explicitly out; note as "deferred to W7". |
| Reports format drift | Low | Follow `Reports/README.md` + prior W2/W3 QA report structure. |

## 6. Verification Plan
- Open `samples/report.html` → cover + numbered headings + table + code + image + caption render; matches preview numbering.
- `samples/report.pdf` (browser print) → A4, TNR, margins; numbering matches HTML.
- `samples/report.docx` opens in Word → cover + headings + table + code + image; numbering matches HTML/PDF; no Pandoc/LibreOffice used.
- Forced export failure → status `error` + retry (UI does not hang).
- `build_output.txt` shows 4 gates green.
- `W4_Acceptance_Report.md` maps every §8 row to a result.

## 7. Status

`WAITING_FOR_APPROVAL`

> Suggested commits: (1) sample artefacts + build_output; (2) W4_Acceptance_Report.md; +1 docs commit. This contract closes Phase-1 MVP (W1–W4).
