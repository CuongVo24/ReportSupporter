# Contract For AI - W4 Group D: Export Status & Error Handling UI

> **Lane / Week:** Core / Month 1 / W4 - Day 4 (`Design/TaskBrief/Core/month1/w4.md` `[C53]`-`[C54]`).
> **Branch:** `feature/W4-export-mvp`.
> **Builds on:** Groups A/B/C (`exportHtml`/`exportPdfViaBrowserPrint`/`exportDocx`), W3 `runChecker → CheckResult` (pre-export banner), W1 `src/types/export.ts` + `Workspace.tsx`.
> **Depended on by:** Group E (acceptance runs through this panel).
> **Sources:** `w4.md` Locked Decisions #4/#7/#8, `week4.md` Day 4, `4.Export.md` §4 / §5.5 (job lifecycle) / §6 ("còn error từ Module 3"), `CanonicalTypes.md` §8, `DesignSystem_Tokens.md` §7b (a11y).

---

## 1. Micro-task Target

Wire the three exporters into a UI: an export panel with per-target buttons, an `ExportJob` lifecycle (idle → running → done/error) with retry, a pre-export check banner (warn — don't block — if Module 3 still has `error`), and errors that are always visible and recoverable. Nothing is swallowed; the UI never hangs.

> **🔒 Visible, recoverable, non-blocking (Locked #4/#7).** Every job tracks `ExportError { stage, message, recoverable }`; failures show a stage + retry. Check `error`s warn via banner but never hard-block export — the user decides.

## 2. Scope

### In scope (`[C53]`/`[C54]`)
- Verify/extend `src/types/export.ts` against `CanonicalTypes.md` §8 (`ExportTarget`/`ExportStatus`/`ExportError`/`ExportResult`/`ExportJob`) — already exists; align, do **not** duplicate.
- `src/modules/export/use-export.ts`: `useExport()` hook — `runExport(target, bundle)` creates an `ExportJob` (`status:"running"`, `startedAt`), calls the matching **synchronous** exporter, on success `status:"done"` + `finishedAt` + triggers download (anchor + object URL), on failure `status:"error"` + `ExportError` + retry; surfaces errors, never swallows. **DOCX seam:** for the DOCX target the hook calls sync `exportDocx` → on `{ok:true,doc}` it `await`s the lone async `packDocx(doc)` to get the Blob (pack failure → `ExportError { stage:"render-docx" }`). HTML/PDF need no pack. The three exporters stay synchronous; only `runExport` is async (it awaits the single DOCX pack).
- `src/modules/export/ExportPanel.tsx`: per-target buttons (HTML/PDF/DOCX), live status per job, retry button on error, **pre-export check banner** (reads `CheckResult.grouped.error.length`; warn-only). A11y: status by icon + text label (not colour alone), keyboard-reachable, tokens only.
- `src/modules/export/index.ts` (MODIFY): public surface — `exportHtml`, `exportPdfViaBrowserPrint`, `exportDocx`, `useExport`, `ExportPanel`, `prepareExport`.
- `src/components/Workspace.tsx` (MODIFY): mount `ExportPanel`, pass `bundle` + latest `CheckResult`.
- Vitest: `use-export` job lifecycle (running→done, running→error+retry, error surfaced not swallowed) with mocked exporters.

### Out of scope
- ❌ Exporter internals (Groups A/B/C).
- ❌ Acceptance report + samples (Group E).
- ❌ Export history persistence / submission package (W8).
- ❌ Hard-blocking export on checker errors (warn-only by design).
- ❌ Any new dep.

## 3. Checklist
- [x] `src/types/export.ts` matches CanonicalTypes §8 (verified, not duplicated).
- [x] `use-export.ts` runs the job lifecycle, triggers download on success, surfaces typed errors + retry, never swallows; calls the 3 sync exporters and awaits `packDocx` only for the DOCX target.
- [x] `ExportPanel.tsx` per-target buttons + status + retry + warn-only pre-export banner; a11y (icon+label, keyboard, tokens).
- [x] `index.ts` exposes the export public surface; `Workspace.tsx` mounts the panel.
- [x] `use-export.test.ts` covers done / error+retry / error-surfaced.
- [x] 4 gates green.

## 4. Expected Interfaces / Files

```ts
// src/modules/export/use-export.ts
export function useExport(): {
  jobs: ExportJob[];
  runExport: (target: ExportTarget, bundle: ReportProjectBundle) => Promise<void>;
  retry: (jobId: string) => void;
};

// src/modules/export/ExportPanel.tsx
export function ExportPanel(props: { bundle: ReportProjectBundle; check?: CheckResult }): JSX.Element;
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/types/export.ts` | VERIFY/MODIFY | align to §8 |
| `src/modules/export/use-export.ts` | NEW | ~90 |
| `src/modules/export/ExportPanel.tsx` | NEW | ~110 |
| `src/modules/export/index.ts` | MODIFY | public surface |
| `src/components/Workspace.tsx` | MODIFY | ~+20 |
| `src/app/globals.css` | MODIFY | panel/status tokens (`var(--rs-*)`) |
| `src/modules/export/use-export.test.ts` | NEW | ~70 |

> **Import boundary:** UI imports `@/modules/export` + `@/types` (+ `CheckResult` from `@/types`). No `fetch`/cloud. Download via object URL on the client.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Export swallows exceptions | Medium | `runExport` maps every failure to `ExportError`; UI shows stage + retry. |
| UI hangs on failure | Medium | Job moves to `error`, never stuck on `running`; retry available. |
| DOCX pack not awaited (sync exporters) | Medium | Exporters are sync; `runExport` awaits the single `packDocx(doc)` for DOCX only, maps pack error to `ExportError`. |
| Status by colour only (a11y) | Medium | Icon + text label per status; keyboard-reachable (`DesignSystem_Tokens.md` §7b). |
| Banner hard-blocks export | Low | Warn-only; user decides (`4.Export.md` §6). |
| Panel/Workspace > 200 lines | Medium | Keep panel presentational; lifecycle logic in the hook. |

## 6. Verification Plan
- `runExport("html", bundle)` (mock success) → job `running` → `done`, download triggered.
- Mock failure → job `error` with `ExportError.stage`; `retry` re-runs; error surfaced (not swallowed).
- `CheckResult` with 1 error → panel shows warn banner but export still enabled.
- Manual: click each target → status updates; DOCX `packDocx` awaited before "done" (no premature done / no swallowed pack error).
- A11y: Tab to buttons, status has icon + label.
- lint/typecheck/test/build green.

## 7. Status

`DONE`
