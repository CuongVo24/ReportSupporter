# Contract For AI - W3 Group C: Checker Engine Core + Section/Evidence Rules (AST)

> **Lane / Week:** Core / Month 1 / W3 - Day 3 (`Design/TaskBrief/Core/month1/w3.md` `[C36]`-`[C38]`).
> **Branch:** `feature/W3-format-check`.
> **Builds on:** Group A (`CheckRule`/`CheckContext`/`CheckResult` types, `slugify`), W2 `parseMarkdown(md): MdastRoot`, W1 `run-checker.ts` (text subset) + `rules/text-markers.ts` + `rules/code-language.ts`, canonical `ReportProjectBundle`/`TemplateSchema`/`ReportIssue`.
> **Depended on by:** Group D (more rules plug into the same registry), Group E (panel + readiness score consume `CheckResult`), W4 Export (may reference checker errors).
> **Sources:** `w3.md` Locked Decisions #3/#4/#5, `week3.md` Day 3, `3.Check.md` §5.1 / §5.2 / §3.3, `CanonicalTypes.md` §6.

---

## 1. Micro-task Target

Upgrade the checker from the W1 text-only subset to the **canonical AST engine**: parse each section once into a shared `CheckContext`, run a `CheckRule` registry, and return a `CheckResult` (issues + grouped + draft `readinessScore` + `ranAt`). Add the first AST/meta rules — missing required sections and evidence gaps — that prove the template-aware, offline contract.

> **🔒 Offline + parse-once (hard rule — `3.Check.md`).** No rule fetches the network. Each `section.markdown` is parsed exactly once into `CheckContext.sectionAsts` (cost O(sections), not O(rules × sections)). "Check link" = the link string exists/parses, never a live HTTP call.

## 2. Scope

### In scope (`[C36]`/`[C37]`/`[C38]`)
- `src/modules/check/run-checker.ts` (MODIFY): build `CheckContext` (`bundle`, `sectionAsts` via `parseMarkdown` once per section, `templateId = bundle.project.templateId`, optional `formatted`); iterate a `CheckRule[]` registry; collect `ReportIssue[]`; group by severity; compute `readinessScore` (delegated to Group E's `readiness-score.ts` — Group C may temporarily inline a thin call and Group E replaces it); set `ranAt`; return `CheckResult`. Engine stays pure, synchronous, offline. **Re-run idempotent** (same input → same issues, only `ranAt` differs).
- `src/modules/check/registry.ts` (NEW, optional split): the ordered `CheckRule[]` list, so `run-checker.ts` stays ≤200 lines.
- `src/modules/check/schemas.ts` (NEW): `reportIssueSchema` (`3.Check.md` §3.3) — validate issues on load/store.
- `src/modules/check/rules/missing-sections.ts` (NEW): rules `toc-disabled` (meta), `missing-conclusion` (ast+meta), `missing-references` (ast+meta), `missing-member-table` (ast). Template-aware: read `template.requiredSections` as the primary source, keyword fallback (`Kết luận`/`Conclusion`, `Tài liệu tham khảo`/`References`) only when the template doesn't declare them.
- `src/modules/check/rules/evidence-gaps.ts` (NEW): `missing-project-links` (ast+meta — GitHub/demo/deploy in `metadata` or AST `link` nodes, software template only), `missing-required-evidence` (meta — `template.requiredEvidenceKinds` vs `bundle.evidence` kinds), `broken-evidence-url-shape` (meta — `evidence.url` fails URL parse; **no fetch**).
- Migrate existing W1 rules to the engine: `placeholderTextRule` (text) + `codeLanguageRule` keep their **ids** unchanged; the engine wraps them as `CheckRule`s (Group D finalizes `code-block-no-lang` to read AST).
- Vitest: parse-once cache (a section parsed once across N rules), grouped output shape, re-run idempotent, missing-conclusion / missing-references via `requiredSections`, template-aware skip (lab report → no `missing-project-links`), `missing-required-evidence`, `broken-evidence-url-shape` without network.

### Out of scope
- ❌ Structural node rules `skipped-heading-level` / `captions` / `images` / `table-too-wide` / `hardcoded-heading-number` / `empty-section` (Group D).
- ❌ Final readiness-score module + badge + panel re-run UI (Group E) — engine returns a score via a thin helper that Group E owns.
- ❌ Any network call, NLP, spellcheck, or new dep.
- ❌ `FormattedReport` generation (Format Group A/B produces it; Check only *optionally* reads `ctx.formatted`).

## 3. Checklist
- [ ] `run-checker.ts` builds `CheckContext`, parses each section once, returns `CheckResult` shaped per CanonicalTypes §6; ≤200 lines (split `registry.ts` if needed).
- [ ] `schemas.ts` `reportIssueSchema` matches the canonical `ReportIssue` exactly.
- [ ] `missing-sections.ts` + `evidence-gaps.ts` each rule reads AST/meta (no raw structural regex), ids locked per §5.2.
- [ ] W1 `placeholder-text` + `code-block-no-lang` ids preserved through the engine.
- [ ] Engine is offline (no `fetch`/`XMLHttpRequest`/`import` of network libs) and re-run idempotent.
- [ ] Tests cover parse-once, grouping, idempotency, template-aware skip, evidence rules.
- [ ] 4 gates green.

## 4. Expected Interfaces / Files

```ts
// src/modules/check/run-checker.ts
export function runChecker(bundle: ReportProjectBundle, formatted?: FormattedReport): CheckResult;

// rule shape (CanonicalTypes §6) — every rule conforms
type CheckRule = { id: string; severity: ReportIssueSeverity; detect: ("ast"|"text"|"meta")[]; run: (ctx: CheckContext) => ReportIssue[] };

// src/modules/check/rules/missing-sections.ts
export const tocDisabledRule: CheckRule;
export const missingConclusionRule: CheckRule;
export const missingReferencesRule: CheckRule;
export const missingMemberTableRule: CheckRule;

// src/modules/check/rules/evidence-gaps.ts
export const missingProjectLinksRule: CheckRule;
export const missingRequiredEvidenceRule: CheckRule;
export const brokenEvidenceUrlShapeRule: CheckRule;
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/check/run-checker.ts` | MODIFY | ~90 |
| `src/modules/check/registry.ts` | NEW | ~40 |
| `src/modules/check/schemas.ts` | NEW | ~25 |
| `src/modules/check/rules/missing-sections.ts` | NEW | ~110 |
| `src/modules/check/rules/evidence-gaps.ts` | NEW | ~90 |
| `src/modules/check/index.ts` | MODIFY | export `runChecker` + rules |
| `src/modules/check/*.test.ts` | NEW | ~140 |

> **⚠️ Signature change.** W1 `runChecker(bundle): ReportIssue[]` becomes `runChecker(bundle, formatted?): CheckResult`. Update the W1 call site (`Workspace.tsx`) — Group E rewires the panel to `CheckResult`; Group C must at minimum keep the build green (adapt the call site or have it read `result.issues`).
> **Import boundary:** engine imports `@/lib/markdown-pipeline` (parse) + `@/types` + rule files; rules import `mdast`/`@/types`/`@/lib/slugify` only. No UI import, no `fetch`.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Checker calls network | High | No `fetch`; URL rules parse strings only; test asserts no network (`3.Check.md` §8). |
| Re-parse per rule (slow) | Medium | Parse once into `sectionAsts`; rules read the cache; test parse-once. |
| Rule id drift breaks contract | High | Ids locked per §5.2; tests hard-assert id + severity; W1 ids carried over. |
| False positives on wrong template | Medium | `requiredSections`/`templateId` gate software/group rules; lab-report skip tested. |
| `runChecker` signature change breaks build | Medium | Update `Workspace.tsx` call site in this group; Group E finalizes panel wiring. |
| `readinessScore` ownership split (C vs E) | Low | Group C calls a thin score helper; Group E owns `readiness-score.ts` and replaces it. |

## 6. Verification Plan
- One section + N rules → `parseMarkdown` invoked once for that section (spy/cache assertion).
- `runChecker` twice on same bundle → identical `issues`, differing `ranAt`.
- Software template missing "Kết luận" heading (not in `requiredSections` content) → `missing-conclusion` (error).
- Lab-report template → **no** `missing-project-links`.
- `requiredEvidenceKinds: ["github"]` + empty `bundle.evidence` → `missing-required-evidence` (error).
- `evidence.url = "not a url"` → `broken-evidence-url-shape` (warning), no network.
- `grouped` buckets match `issues` by severity.
- lint/typecheck/test/build green.

## 7. Status

`WAITING_FOR_APPROVAL`

> Suggested commits: (1) engine core + context + schemas + registry; (2) missing-sections + evidence-gaps rules + tests; +1 docs commit.
