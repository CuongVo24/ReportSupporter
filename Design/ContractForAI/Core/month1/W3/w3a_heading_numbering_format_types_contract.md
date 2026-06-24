# Contract For AI - W3 Group A: Heading Parser, Numbering & Format/Check Types (shared backbone)

> **Lane / Week:** Core / Month 1 / W3 - Day 1 (`Design/TaskBrief/Core/month1/w3.md` `[C30]`-`[C32]`).
> **Branch:** `feature/W3-format-check`.
> **Builds on:** W2 `parseMarkdown(md): MdastRoot` (`src/lib/markdown-pipeline.ts`), W1 canonical types in `src/types`.
> **Depended on by:** Group B (TOC + preview numbering), Group C/D (Check engine + rules consume the canonical Check types + `slugify`), W4 (Export reuses the same numbering).
> **Sources:** `w3.md` Locked Decisions #1/#2/#6/#7, `week3.md` Day 1, `2.Format.md` §5.1, `3.Check.md` §6, `CanonicalTypes.md` §3/§6/§7.

---

## 1. Micro-task Target

Lay the W3 foundation: (a) add the canonical Format/Check shapes that are specified in `CanonicalTypes.md` but missing from `src/types`; (b) add the single deterministic `slugify` anchor helper shared by Format-TOC and Check cross-ref; (c) implement the **one** deterministic heading-numbering path (parse mdast headings → number `1`/`1.1`/`1.1.1`) that preview (Group B) and Export (W4) will both reuse. No second parser, no second numbering counter.

> **🔒 Single source of truth.** Numbering is assigned in exactly one function (`number-headings.ts`). Slugs come from exactly one helper (`slugify.ts`) — Format and Check must produce identical anchors. Canonical shapes are copied **verbatim** from `CanonicalTypes.md` (no extra fields); `HeadingNode` is the only new *local* type (numbering intermediate, not persisted, not cross-module).

## 2. Scope

### In scope (`[C30]`/`[C31]`/`[C32]`)
- `src/types/format.ts`: **add** `TocNode`, `CaptionEntry` (CanonicalTypes §3) — verbatim. `src/types/pipeline.ts`: **add** `FormattedReport` (§7, imports `HastRoot`/`MdastRoot`). `src/types/report.ts` (or a new `src/types/check.ts`): **add** `CheckRule`, `CheckContext`, `CheckResult` (§6). Re-export all from `src/types/index.ts`.
- `src/lib/slugify.ts`: `slugify(text: string): string` — lowercase → strip Vietnamese diacritics (NFD + strip combining marks) → non-alnum → `-` → collapse repeats. Pure, deterministic. Duplicate handling (append `-2`/`-3`) is the caller's job (TOC) — helper is stateless.
- `src/modules/format/parse-headings.ts`: `parseHeadings(ast: MdastRoot): HeadingNode[]` — collect `heading` nodes in document order with `depth` (1..6) + flat text. `HeadingNode` (internal) `{ depth: number; text: string; sectionId?: string }` (sectionId optional at W3; combined-AST path).
- `src/modules/format/number-headings.ts`: `numberHeadings(headings: HeadingNode[]): NumberedHeading[]` — counter array `counters[1..6]`; on depth `d`: `counters[d]++`, reset `k>d`; `number = counters[1..d].join(".")`; mark `levelJumped: true` when depth skips a level (h1→h3). Empty-text headings excluded from numbering output. `NumberedHeading` extends `HeadingNode` with `{ number: string; id: string; levelJumped: boolean }` (id via `slugify`, number-prefixed).
- Vitest: `slugify` (Vietnamese → ascii, collapse), numbering determinism (`#`,`##`,`##`,`###` → `1`,`1.1`,`1.2`,`1.2.1`), counter reset (h2 after deeper h3), level-jump flag, empty heading skipped.

### Out of scope
- ❌ `generate-toc` / Format `index.ts` / preview wiring (Group B).
- ❌ Any Check rule logic (Groups C/D) — this group only *adds the types* the engine will use.
- ❌ Caption numbering algorithm (`2.Format.md` §5.3 → deferred within W3 to whichever group needs it; W3 MVP keeps figures via image alt, no full caption renumber).
- ❌ Print CSS / A4 layout / `FormatPreset` application (W4/W7).
- ❌ Any new runtime dep (none this week).

## 3. Checklist
- [ ] `TocNode`/`CaptionEntry`/`FormattedReport`/`CheckRule`/`CheckContext`/`CheckResult` added to `src/types`, verbatim from CanonicalTypes, re-exported from `index.ts`, no `any`.
- [ ] `src/lib/slugify.ts` pure + deterministic, ≤60 lines.
- [ ] `parse-headings.ts` + `number-headings.ts` each ≤200 lines, read mdast only (no regex on structure).
- [ ] `slugify.test.ts` + `number-headings.test.ts` cover determinism / reset / level-jump / empty / Vietnamese diacritics.
- [ ] 4 gates green (lint/typecheck/test/build).

## 4. Expected Interfaces / Files

```ts
// src/lib/slugify.ts
export function slugify(text: string): string;            // "Kiến trúc" → "kien-truc"

// src/modules/format/parse-headings.ts
export type HeadingNode = { depth: number; text: string; sectionId?: string };
export function parseHeadings(ast: MdastRoot): HeadingNode[];

// src/modules/format/number-headings.ts
export type NumberedHeading = HeadingNode & { number: string; id: string; levelJumped: boolean };
export function numberHeadings(headings: HeadingNode[]): NumberedHeading[];

// src/types — added verbatim from CanonicalTypes (§3/§6/§7)
export type { TocNode, CaptionEntry } from "./format";
export type { FormattedReport } from "./pipeline";
export type { CheckRule, CheckContext, CheckResult } from "./report"; // or ./check
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/types/format.ts` | MODIFY | +`TocNode`/`CaptionEntry` ~25 |
| `src/types/pipeline.ts` | MODIFY | +`FormattedReport` ~12 |
| `src/types/report.ts` or `src/types/check.ts` | MODIFY/NEW | +`CheckRule`/`CheckContext`/`CheckResult` ~30 |
| `src/types/index.ts` | MODIFY | re-exports |
| `src/lib/slugify.ts` | NEW | ~40 |
| `src/modules/format/parse-headings.ts` | NEW | ~50 |
| `src/modules/format/number-headings.ts` | NEW | ~70 |
| `src/lib/slugify.test.ts` · `src/modules/format/number-headings.test.ts` | NEW | ~90 |

> **Import boundary:** `slugify` + `parse-headings` + `number-headings` import only `mdast` types + `@/lib/slugify` + `@/types`. No `modules/*` cross-imports, no UI, no `fetch`. Pure & offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Numbering diverges preview ↔ export | High | One `numberHeadings` on mdast; Group B + W4 reuse it. |
| Format ↔ Check anchors drift | High | Single `slugify` helper imported by both modules (`3.Check.md` §6). |
| Re-declaring canonical shapes (type drift) | Medium | Copy verbatim from CanonicalTypes; change `.md` first if needed (Locked #7). |
| Vietnamese diacritics break slug | Medium | NFD + strip combining marks; test `"Kiến trúc hệ thống"` → `kien-truc-he-thong`. |
| `HeadingNode` leaking as a "canonical" type | Low | Keep internal to `src/modules/format`; not exported from `src/types`. |
| File > 200 lines | Low | Parse / number / slugify in separate small files. |

## 6. Verification Plan
- `slugify("Kiến trúc hệ thống")` → `"kien-truc-he-thong"`; collapses `--`.
- `numberHeadings` over depths `[1,2,2,3]` → numbers `["1","1.1","1.2","1.2.1"]`.
- h2 after a depth-3 heading resets the level-3 counter.
- h1→h3 input → second node `levelJumped === true`.
- Empty-text heading omitted from output.
- `typecheck` proves the new canonical shapes match CanonicalTypes (used by Group C signatures).
- lint/typecheck/test/build green.

## 7. Status

`DONE`

> VibeCode Step 2: no `src/` changes until Approve. Suggested commits: (1) types + slugify; (2) parse + number headings + tests; +1 docs commit for this contract.
