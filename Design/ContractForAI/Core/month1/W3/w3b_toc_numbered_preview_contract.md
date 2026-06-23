# Contract For AI - W3 Group B: Table of Contents & Numbered Preview

> **Lane / Week:** Core / Month 1 / W3 - Day 2 (`Design/TaskBrief/Core/month1/w3.md` `[C33]`-`[C35]`).
> **Branch:** `feature/W3-format-check`.
> **Builds on:** Group A (`numberHeadings`, `parseHeadings`, `slugify`, `TocNode`), W2 `renderMarkdown`/`parseMarkdown` + `PreviewPane.tsx` (`src/components`).
> **Depended on by:** W4 Export (reuses the same numbering + TOC data), W7 Format hardening.
> **Sources:** `w3.md` Locked Decisions #1/#2/#6, `week3.md` Day 2, `2.Format.md` §5.2 / §6, `CanonicalTypes.md` §3.

---

## 1. Micro-task Target

Turn numbered headings into a `TocNode[]` tree, expose the Format module's public surface, and make the live preview show the **same** heading numbers + TOC that Export will use. Numbering is consumed from Group A — preview never computes its own.

> **⚠️ Accepted deviation (path).** `week3.md` Day 2 lists `src/modules/write/PreviewPanel.tsx`, but the preview actually lives at `src/components/PreviewPane.tsx` (W2 accepted deviation). This contract keeps the real W1/W2 location; relocating preview to `src/modules/write/` is a separate refactor, not W3.

## 2. Scope

### In scope (`[C33]`/`[C34]`/`[C35]`)
- `src/modules/format/generate-toc.ts`: `generateToc(headings: NumberedHeading[], maxDepth = 3): TocNode[]` — filter depth ≤ `maxDepth`, build a nested tree with a level stack, anchors from the Group A `id`. Duplicate slugs disambiguated (`-2`, `-3`) here (caller-side, per Group A). Empty headings already excluded.
- `src/modules/format/index.ts`: public surface — `parseHeadings`, `numberHeadings`, `generateToc`, and the Format types. Inter-module consumers import **only** from here.
- `src/components/PreviewPane.tsx` (MODIFY): render heading numbers in the preview and render a TOC block from `generateToc`, driven by the single numbering function. Keep the W2 debounce + sanitized-HTML path intact; numbering/TOC computed from `parseMarkdown` (mdast), not by mutating sanitized HTML strings with regex.
- Vitest: `generate-toc` — flat headings → nested tree (h1>h2>h3), `maxDepth` cutoff at 3, duplicate-slug disambiguation, empty input → `[]`.

### Out of scope
- ❌ Heading numbering / parsing logic (Group A — consumed here).
- ❌ Caption numbering / list of figures / list of tables (W7).
- ❌ Print CSS A4 / page numbers in TOC (W4; preview shows no real page numbers — hide the column / show "…", `2.Format.md` §6).
- ❌ Any Check rule (Groups C/D).
- ❌ Export rendering (W4) and any new dep.

## 3. Checklist
- [ ] `generate-toc.ts` ≤200 lines, builds nested `TocNode[]`, anchors via Group A `id`.
- [ ] `src/modules/format/index.ts` exports the public surface only.
- [ ] `PreviewPane.tsx` shows heading numbers + TOC from the single numbering path; debounce + sanitized HTML preserved; ≤200 lines (split a `Toc` subcomponent if needed).
- [ ] `generate-toc.test.ts` covers tree nesting / depth cutoff / duplicate slug / empty.
- [ ] 4 gates green.

## 4. Expected Interfaces / Files

```ts
// src/modules/format/generate-toc.ts
export function generateToc(headings: NumberedHeading[], maxDepth?: number): TocNode[];

// src/modules/format/index.ts
export { parseHeadings } from "./parse-headings";
export { numberHeadings } from "./number-headings";
export { generateToc } from "./generate-toc";
export type { HeadingNode } from "./parse-headings";
export type { NumberedHeading } from "./number-headings";
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/format/generate-toc.ts` | NEW | ~80 |
| `src/modules/format/index.ts` | NEW | ~12 |
| `src/components/PreviewPane.tsx` | MODIFY | ~+40 |
| `src/modules/format/generate-toc.test.ts` | NEW | ~70 |

> **Import boundary:** `PreviewPane` imports `@/lib` (pipeline) + `@/modules/format` (public surface). Format module imports `mdast` + `@/lib/slugify` + `@/types` only. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| TOC numbering ≠ preview heading numbering | High | Both derive from one `numberHeadings` call; TOC consumes its output, no re-count. |
| TOC nesting wrong on level jumps | Medium | Stack-based nest by level; tested with h1→h3 input. |
| Duplicate heading text → clashing anchors | Medium | Disambiguate `-2`/`-3` in `generateToc`; test duplicate case. |
| Preview > 200 lines after TOC | Medium | Extract a small `Toc` render helper/subcomponent. |
| Re-render thrash on typing | Low | Keep W2 debounce; numbering recomputed only on debounced parse. |

## 6. Verification Plan
- `generateToc` over `# A / ## B / ### C / ## D` → `A{children:[B{children:[C]}, D]}`.
- A depth-4 heading is excluded at default `maxDepth = 3`.
- Two headings "Giới thiệu" → anchors `gioi-thieu`, `gioi-thieu-2`.
- `generateToc([])` → `[]`.
- Manual: preview shows `1`, `1.1`, `1.1.1` on headings and a matching TOC block; GFM/math/highlight from W2 still render.
- lint/typecheck/test/build green.

## 7. Status

`WAITING_FOR_APPROVAL`

> Suggested commits: (1) generate-toc + format index + tests; (2) PreviewPane numbering + TOC; +1 docs commit.
