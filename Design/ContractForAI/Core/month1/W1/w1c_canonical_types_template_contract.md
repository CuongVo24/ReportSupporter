# Contract For AI - W1C Canonical Types & Template Seed (Group C)

> Scope: Group C of Week 1 — TaskBrief `[C4]`, `[C5]`, `[C6]` (and the *type* portion of `[C10]` — `ReportIssue`). One implementable unit.
> Parent overview: `w1_project_bootstrap_contract.md`. Builds on Group A/B (DONE).
> Sources: `Design/Modules/Other/CanonicalTypes.md` (single source of truth), `Design/Modules/1.Write.md` §3 + §5.1, `Design/Modules/Support.Evidence.md`, `Design/RoadMap/week_1-2-3-4/week1.md` `[C4]–[C6]`, `Design/TaskBrief/Core/month1/w1.md` (W1 Locked Decisions).

## 1. Micro-task Target

Lock the **canonical types** under `src/types/` (matching CanonicalTypes.md exactly), their **zod schemas**, **default constants**, the **software-project template seed** (Vietnamese), and the **`createProjectFromTemplate`** mapper — with a Vitest proving the mapper. This is the keystone every later group imports; no UI, no IndexedDB, no editor here.

## 2. Scope

**In scope**
- `src/types/*` — define **once** (verbatim from CanonicalTypes): `ReportSection`, `ReportProject`, `ReportAsset`, `SnippetKind`, `ReportProjectBundle`, `ReportIssue`/`ReportIssueSeverity`, `EvidenceKind`/`EvidenceItem`, `FormatPreset`/`FormatSettings`, `TemplateSchema`/`MetadataFieldSpec`/`TemplateSectionSeed`.
- Zod schemas (I/O boundary): `reportSection`, `reportProject`, `reportAsset`, `evidenceItem`, `formatSettings`, `templateSchema`/`metadataFieldSpec`, and **`storedBundleSchema`** covering the FULL bundle (`project + assets + evidence + formatSettings + schemaVersion`) — Locked Decision #1/#9.
- Default constants: `DEFAULT_TEMPLATE_ID`, `DEFAULT_FORMAT_SETTINGS` (`presetId: "academic-default"`), `SCHEMA_VERSION = 1`.
- `software-project` template seed — Vietnamese section titles, **no hard-coded chapter numbers** in `title`/`starterMarkdown`.
- `createProjectFromTemplate(template) → ReportProjectBundle` (`id = crypto.randomUUID()`, seeds → sections with `order` + `status:"draft"`, `assets:[]`, `evidence:[]`, `formatSettings = DEFAULT_FORMAT_SETTINGS`, `schemaVersion = SCHEMA_VERSION`).
- Vitest for the mapper (deterministic, node env).

**Out of scope** (later groups)
- `TocNode` / `CaptionEntry` / `FormattedReport` / `CheckRule` / `CheckContext` / `CheckResult` → defined in CanonicalTypes but **not needed in W1**; land with Format/Check (W3).
- Editor / preview / IndexedDB autosave → Group D. Checker rules + panel → Group E. Export stubs → Group F.
- Template picker UI, metadata form UI, section navigator behavior → later (W2).
- `unified`/remark anything (no AST in W1).

## 3. Checklist

- [ ] `src/types/report.ts` — `ReportProject`, `ReportSection`, `ReportAsset`, `SnippetKind`, `ReportIssue`, `ReportIssueSeverity`, `ReportProjectBundle`.
- [ ] `src/types/evidence.ts` — `EvidenceKind`, `EvidenceItem`.
- [ ] `src/types/format.ts` — `FormatPreset`, `FormatSettings`.
- [ ] `src/types/template.ts` — `TemplateSchema`, `MetadataFieldSpec`, `TemplateSectionSeed`.
- [ ] `src/types/schemas.ts` — zod for the above + `storedBundleSchema` (full bundle).
- [ ] `src/types/defaults.ts` — `DEFAULT_TEMPLATE_ID`, `DEFAULT_FORMAT_SETTINGS`, `SCHEMA_VERSION`.
- [ ] `src/types/index.ts` — single re-export surface.
- [ ] `src/modules/write/templates/software-project.ts` — seed (Vietnamese, no chapter numbers).
- [ ] `src/modules/write/create-project.ts` — `createProjectFromTemplate`.
- [ ] `src/modules/write/index.ts` — public surface (`createProjectFromTemplate`, `softwareProjectTemplate`).
- [ ] `src/modules/write/create-project.test.ts` — Vitest.
- [ ] All shapes match CanonicalTypes **verbatim**; `lint`/`typecheck`/`build`/`vitest` green.

## 4. Interfaces / Files Expected To Change

```
[NEW] src/types/report.ts
[NEW] src/types/evidence.ts
[NEW] src/types/format.ts
[NEW] src/types/template.ts
[NEW] src/types/schemas.ts
[NEW] src/types/defaults.ts
[NEW] src/types/index.ts
[NEW] src/modules/write/templates/software-project.ts
[NEW] src/modules/write/create-project.ts
[NEW] src/modules/write/index.ts
[NEW] src/modules/write/create-project.test.ts
```

Key signatures (locked):

```ts
export function createProjectFromTemplate(
  template: TemplateSchema,
  input?: { title?: string; metadata?: ReportProject["metadata"] },
): ReportProjectBundle;

export const DEFAULT_FORMAT_SETTINGS: FormatSettings; // presetId: "academic-default"
export const SCHEMA_VERSION = 1;
export const DEFAULT_TEMPLATE_ID = "software-project";
```

> Type-dependency direction (no cycles): `evidence.ts` + `format.ts` are leaves → `report.ts` (bundle) + `template.ts` import them → `index.ts` re-exports. `schemas.ts`/`defaults.ts` import types only. `src/modules/write/*` imports from `@/types` + local `./templates`; never the reverse.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Type drift from CanonicalTypes | High | Copy field names/shapes **verbatim**; treat CanonicalTypes as SoT. |
| zod schema diverges from type | High | Schemas mirror types 1:1; `storedBundleSchema` covers the full bundle (Locked #9). |
| Import cycle in `src/types` | Medium | One-directional (leaves → composites → index); type-only imports. |
| Hard-coded chapter numbers / mixed language in seed | Medium | Titles & `starterMarkdown` carry no `1.`; Vietnamese only (1.Write §3.3, Rule.md). |
| Evidence type "unused" in W1 | Low | Required by `bundle.evidence` + `storedBundleSchema` (Locked #1); `bundle.evidence = []`. |
| `crypto.randomUUID` availability | Low | Available in Node 18+ and browsers; tests run node env. |
| >200 lines/file | Low | Split seed `starterMarkdown` if it grows; keep each type file focused. |

## 6. Verification Plan

- `npm run lint` / `typecheck` / `build` / `npx vitest run` — all green.
- `create-project.test.ts` asserts, for `softwareProjectTemplate`:
  - section count == seed length; `order` strictly ascending from the seed; **every** `status === "draft"`.
  - `assets == []`, `evidence == []`, `formatSettings === DEFAULT_FORMAT_SETTINGS`, `schemaVersion === SCHEMA_VERSION`, `project.templateId === template.id`.
  - `storedBundleSchema.parse(bundle)` succeeds (type ↔ schema round-trip).
  - no seed heading/`starterMarkdown` starts with a chapter number.
- No persistence yet (IndexedDB wiring is Group D); mapper is pure/deterministic.
- QA report deferred to Group F `[C15]`.

## 7. Status

`DONE`

> Implemented on `feature/W1-project-bootstrap`. 11 files: `src/types/{report,evidence,format,template,schemas,defaults,index}.ts` + `src/modules/write/{templates/software-project,create-project,index}.ts` + `create-project.test.ts`. Types copied verbatim from CanonicalTypes; `ReportIssue` defined here (covers `[C10]` type-part). zod uses v4 two-arg `z.record(z.string(), …)`. Baked decisions: mapper `createProjectFromTemplate(template, input?)`, `DEFAULT_FORMAT_SETTINGS` (`academic-default`, `includeToc:true`, `continuous`), `SCHEMA_VERSION=1`, seed `requiredEvidenceKinds:["github","video","deploy"]`, `requiresToc:true`, `requiredSections:["Kết luận","Tài liệu tham khảo"]`. Deferred to W3: `TocNode`/`CaptionEntry`/`FormattedReport`/`CheckRule`/`CheckContext`/`CheckResult`. Gate: typecheck ✓ / lint ✓ / build ✓ / vitest ✓ (5 tests — mapper section count/order/status="draft", empty+default bundle, `storedBundleSchema` round-trip, no hard-coded chapter numbers).
