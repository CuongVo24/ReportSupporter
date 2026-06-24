# Contract For AI - W3 Group E: Severity Panel, Readiness Score & QA

> **Lane / Week:** Core / Month 1 / W3 - Day 5 (`Design/TaskBrief/Core/month1/w3.md` `[C43]`-`[C45]`).
> **Branch:** `feature/W3-format-check`.
> **Builds on:** Group C (`runChecker → CheckResult`), Group D (full rule set), W1 `CheckerPanel.tsx` + `Workspace.tsx` integration.
> **Depended on by:** W4 Export (may surface readiness/errors before export).
> **Sources:** `w3.md` Locked Decisions #4/#8, `week3.md` Day 5, `3.Check.md` §5.3 / §4 / §9 (a11y), `DesignSystem_Tokens.md` §7b.

---

## 1. Micro-task Target

Surface the engine's `CheckResult` to the user: a draft readiness score (0–100) with a colour-banded badge, a checker panel grouped by severity with a re-run button and jump-to-issue affordance, wired into the workspace. Then run the four gates and write the W3 QA evidence.

> **🔒 Draft score, advisory only (Locked #8).** The readiness score reflects issue count/severity, **not** content quality. It is not a pass/fail gate — Export gating (W4) may reference it but W3 ships no gate.
> **♿ A11y (`3.Check.md` §9, `DesignSystem_Tokens.md` §7b).** Severity is conveyed by icon + text label, **never colour alone**; the issue list is keyboard-reachable; jump-to-issue fires on Enter/Space. CSS uses only `var(--rs-*)` tokens.

## 2. Scope

### In scope (`[C43]`/`[C44]`/`[C45]`)
- `src/modules/check/readiness-score.ts`: `computeReadiness(issues: ReportIssue[]): number` — start 100; `error −15`, `warning −5`, `info −1`; clamp ≥ 0 (`3.Check.md` §5.3). Group C calls this from `run-checker.ts` to fill `CheckResult.readinessScore` (Group E owns the function; replace any thin inline stub from Group C). Add `scoreBand(score): "green"|"yellow"|"red"` (≥85 / 60–84 / <60).
- `src/modules/check/ReadinessBadge.tsx`: render score + band colour (via tokens) + text label ("Sẵn sàng" / "Cần xem lại" / "Chưa nên nộp") + "draft" marker.
- `src/modules/check/CheckerPanel.tsx` (MODIFY): accept `CheckResult` (use `result.grouped` + `result.issues`), keep severity grouping + icon/label, add a re-run button and a jump-to-issue control per issue (button/link → `onJump(sectionId, line?)`), keyboard-reachable. Render `ReadinessBadge`.
- `src/components/Workspace.tsx` (MODIFY): call `runChecker(bundle, formatted?)`, hold `CheckResult` state, pass to `CheckerPanel`, wire `onRun` (re-run) and `onJump` (focus editor section — best-effort at W3). Re-run after edit updates results.
- `src/modules/check/index.ts` (MODIFY): export `computeReadiness`, `scoreBand`, `ReadinessBadge`.
- Vitest: `readiness-score` — `1 error + 2 warning → 75`; clamp at 0 for many errors; band thresholds (84→yellow, 85→green, 59→red).
- QA evidence: `Design/Reports/Month1/W3/W3_QA_Report.md`, `checker_samples.md` (sample report → issues + score, showing each rule firing), `build_output.txt`.

### Out of scope
- ❌ Rule logic / engine (Groups C/D).
- ❌ Numbering / TOC (Groups A/B).
- ❌ Full jump-to-cursor precision in CodeMirror (best-effort section focus at W3; precise line-jump is a later polish).
- ❌ Export gating enforcement (W4).
- ❌ Any new dep.

## 3. Checklist
- [x] `readiness-score.ts` implements `−15/−5/−1`, clamp ≥ 0, bands ≥85/60–84/<60; pure + tested.
- [x] `ReadinessBadge.tsx` shows score + band + text label + "draft"; tokens only.
- [x] `CheckerPanel.tsx` consumes `CheckResult`, re-run button, jump-to-issue (Enter/Space), icon+label severity (not colour alone).
- [x] `Workspace.tsx` runs the engine, holds `CheckResult`, re-run updates, `onJump` wired.
- [x] `readiness-score.test.ts` covers the `75` case + clamp + band edges.
- [x] `Design/Reports/Month1/W3/` has QA report + checker samples + build output.
- [x] 4 gates green.

## 4. Expected Interfaces / Files

```ts
// src/modules/check/readiness-score.ts
export function computeReadiness(issues: ReportIssue[]): number;        // 0..100
export function scoreBand(score: number): "green" | "yellow" | "red";

// src/modules/check/ReadinessBadge.tsx
export function ReadinessBadge(props: { score: number }): JSX.Element;

// src/modules/check/CheckerPanel.tsx — prop change
type CheckerPanelProps = { result: CheckResult; onRun: () => void; onJump: (sectionId?: string, line?: number) => void; hasRun: boolean };
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/check/readiness-score.ts` | NEW | ~40 |
| `src/modules/check/ReadinessBadge.tsx` | NEW | ~45 |
| `src/modules/check/CheckerPanel.tsx` | MODIFY | ~+50 |
| `src/components/Workspace.tsx` | MODIFY | ~+30 |
| `src/modules/check/index.ts` | MODIFY | exports |
| `src/app/globals.css` | MODIFY | badge/jump tokens (`var(--rs-*)`) |
| `src/modules/check/readiness-score.test.ts` | NEW | ~50 |
| `Design/Reports/Month1/W3/W3_QA_Report.md` · `checker_samples.md` · `build_output.txt` | NEW | evidence |

> **Import boundary:** UI imports `@/modules/check` (engine + score + badge + panel) + `@/types`. `readiness-score.ts` is pure (no React, no `fetch`). CSS tokens only.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Score misread as "perfect/quality" | Low | Badge marked "draft"; text label is advisory, reflects issue count only (Locked #8). |
| Severity by colour only (a11y fail) | Medium | Icon + text label per severity; tested visually + tokens (`DesignSystem_Tokens.md` §7b). |
| Jump-to-issue not precise | Low | Best-effort section focus at W3; precise line-jump deferred, documented. |
| Re-run doesn't refresh after edit | Medium | `onRun` re-invokes `runChecker`; `ranAt`/issues update; manual verify. |
| Panel/Workspace > 200 lines | Medium | Extract `ReadinessBadge`; keep panel presentational. |
| `CheckResult` prop change breaks build | Medium | Update the W1 panel call site; typecheck gate catches mismatch. |

## 6. Verification Plan
- `computeReadiness([error, warning, warning])` → `75`; `scoreBand(75)` → `"yellow"`.
- 10 errors → clamp `0` (not negative); `scoreBand(0)` → `"red"`; `scoreBand(85)` → `"green"`.
- Manual: edit report → click Check → panel groups error/warning/info, badge updates, re-run after a fix lowers issue count + raises score.
- Manual: Tab to an issue, Enter → editor focuses that section (best-effort).
- `checker_samples.md` shows a crafted report triggering each rule once + the resulting score.
- lint/typecheck/test/build green; `build_output.txt` captured.

## 7. Status

`DONE`

> Suggested commits: (1) readiness-score + badge + tests; (2) CheckerPanel + Workspace wiring; (3) QA report + checker samples + build output; +1 docs commit.
