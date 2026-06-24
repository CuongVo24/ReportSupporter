# Contract For AI - W3 Group D: Structural AST Rules

> **Lane / Week:** Core / Month 1 / W3 - Day 4 (`Design/TaskBrief/Core/month1/w3.md` `[C39]`-`[C42]`).
> **Branch:** `feature/W3-format-check`.
> **Builds on:** Group C (`CheckRule`/`CheckContext` engine + registry), Group A (`slugify`, numbering flags), W2 mdast (`heading`/`image`/`table`/`code` nodes), W1 `text-markers`/`code-language` rules.
> **Depended on by:** Group E (readiness score counts these issues; panel renders them), W7 Format hardening.
> **Sources:** `w3.md` Locked Decisions #3/#4/#6, `week3.md` Day 4, `3.Check.md` §5.2 (rule catalog) / §6 (edge cases), `2.Format.md` §6.

---

## 1. Micro-task Target

Implement the structural rules that read mdast nodes and register them in the Group C engine: heading-level jumps, hardcoded heading numbers, empty sections, missing captions, broken images, wide tables — plus finalize the migrated W1 text/code rules. Every rule has a Vitest test with its id + severity hard-asserted.

> **🔒 AST-first.** All Group D rules read mdast nodes from `CheckContext.sectionAsts` — **no raw-string structural regex**. The only regex-allowed rule is `placeholder-text` (text scan). Rule ids are a public contract (`ReportIssue.id`) and are locked.

## 2. Scope

### In scope (`[C39]`/`[C40]`/`[C41]`/`[C42]`)
- `src/modules/check/rules/heading-levels.ts`: `skipped-heading-level` (warning) — walk heading depths in order; flag a jump (e.g. h1→h3). Reuses Group A's numbering `levelJumped` flag where available, else recomputes from `sectionAsts`.
- `src/modules/check/rules/structure.ts`: `hardcoded-heading-number` (warning) — heading text starts with `1.`/`1.1`/`Chương 1` (Format owns numbering — `2.Format.md` §5.3b); `empty-section` (warning) — `section.markdown` empty/whitespace after stripping the heading.
- `src/modules/check/rules/captions.ts`: `missing-captions` (warning) — `image` node with empty alt, or `table` node without an adjacent caption (MVP: image alt as caption per `2.Format.md` §3.3).
- `src/modules/check/rules/images.ts`: `broken-image` (error) — `image` node with empty `url`, or `asset:<id>` not present in `bundle.assets`, or an invalid local path.
- `src/modules/check/rules/table-width.ts`: `table-too-wide` (info) — GFM `table` with column count > 6 (likely A4 overflow).
- Finalize migrated W1 rules: `code-block-no-lang` (warning) reads the `code` node `lang` from AST (no longer raw text); `placeholder-text` (warning) stays a text scan (`TODO`/`fix later`/`lorem ipsum`, case-insensitive), excluding `code` nodes to cut noise (`3.Check.md` §6).
- Register all rules in the Group C registry (ordered, stable).
- Vitest **per rule** (`*.test.ts`): each asserts id + severity + a positive trigger + a negative (no false positive). `3.Check.md` §8 scenarios.

### Out of scope
- ❌ Engine/context/`CheckResult` plumbing (Group C — consumed here).
- ❌ Readiness score / panel / badge (Group E).
- ❌ Cross-reference resolution `[#fig:x]` (W7 hardening — `2.Format.md` §5.3).
- ❌ Network/NLP/spellcheck or any new dep.
- ❌ Auto-fix (Non-goal — Checker reports + suggests only).

## 3. Checklist
- [x] Each rule reads AST nodes from `CheckContext` (no structural regex); `placeholder-text` is the only text-regex rule.
- [x] Rule ids exactly match `3.Check.md` §5.2; severities match the catalog.
- [x] `broken-image` resolves `asset:<id>` against `bundle.assets`.
- [x] `table-too-wide` threshold > 6 columns; `missing-captions` uses image alt as caption (MVP).
- [x] One `*.test.ts` per rule, each hard-asserting id + severity + trigger + non-trigger.
- [x] All rules registered in the engine registry; each file ≤200 lines.
- [x] 4 gates green.

## 4. Expected Interfaces / Files

```ts
// each file exports CheckRule(s) conforming to CanonicalTypes §6
export const skippedHeadingLevelRule: CheckRule;        // heading-levels.ts
export const hardcodedHeadingNumberRule: CheckRule;     // structure.ts
export const emptySectionRule: CheckRule;               // structure.ts
export const missingCaptionsRule: CheckRule;            // captions.ts
export const brokenImageRule: CheckRule;                // images.ts
export const tableTooWideRule: CheckRule;               // table-width.ts
// code-language.ts / text-markers.ts — finalized as CheckRule, ids unchanged
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/check/rules/heading-levels.ts` | NEW | ~50 |
| `src/modules/check/rules/structure.ts` | NEW | ~70 |
| `src/modules/check/rules/captions.ts` | NEW | ~50 |
| `src/modules/check/rules/images.ts` | NEW | ~60 |
| `src/modules/check/rules/table-width.ts` | NEW | ~40 |
| `src/modules/check/rules/code-language.ts` · `text-markers.ts` | MODIFY | AST/engine adapt |
| `src/modules/check/registry.ts` | MODIFY | register new rules |
| `src/modules/check/rules/*.test.ts` (one per rule) | NEW | ~210 total |

> **Import boundary:** rules import `mdast` types + `@/types` + `@/lib/slugify` only. No UI, no `fetch`. `unist-util-visit` (already pulled in transitively by remark) may be used to walk nodes; if it is not a direct dep, walk manually — **do not add a new top-level dep without matrix sign-off**.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Raw regex on structure → false positives | Medium | Read mdast nodes; regex only for `placeholder-text` (excludes code nodes). |
| Rule id/severity drift | High | One test per rule hard-asserts id + severity (`3.Check.md` §8). |
| `broken-image` misses orphan `asset:<id>` | Medium | Resolve against `bundle.assets`; test orphan + empty-url cases. |
| `placeholder-text` flags code samples | Low | Exclude `code` nodes from the text scan (`3.Check.md` §6). |
| Walking AST needs a new dep | Medium | Use transitive `unist-util-visit` or a manual walk; no new top-level dep. |
| Rule file > 200 lines | Low | One concern per file; `structure.ts` holds the two small heading rules. |

## 6. Verification Plan
- `# H1` then `### H3` → `skipped-heading-level` (warning); contiguous h1→h2 → none.
- `# 1. Mở đầu` → `hardcoded-heading-number` (warning); `# Mở đầu` → none.
- Section with only a heading → `empty-section` (warning).
- `![](asset:ghost)` with no such asset → `broken-image` (error); valid `asset:<id>` → none.
- `![ ](asset:x)` empty alt → `missing-captions` (warning).
- 7-column GFM table → `table-too-wide` (info); 3-column → none.
- ` ```\ncode\n``` ` (no lang) → `code-block-no-lang` (warning); ` ```ts ` → none.
- `TODO` in body → `placeholder-text`; `TODO` inside a code fence → none.
- lint/typecheck/test/build green.

## 7. Status

`DONE`

> Suggested commits: (1) heading/structure/caption/image/table rules; (2) per-rule tests + migrate W1 text/code rules + registry; +1 docs commit.
