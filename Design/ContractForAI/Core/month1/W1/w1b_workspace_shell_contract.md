# Contract For AI - W1B Workspace Shell (Group B)

> Scope: Group B of Week 1 — TaskBrief `[C3]`. One implementable unit.
> Parent overview: `w1_project_bootstrap_contract.md`. Builds on Group A (`w1a_bootstrap_tooling_contract.md`, DONE).
> Sources: `Design/RoadMap/week_1-2-3-4/week1.md` `[C3]`, `Design/Modules/Other/DesignSystem_Tokens.md`, `Design/Modules/Other/TechnicalStack.md` §1, `Design/Modules/1.Write.md` (workspace-first).

## 1. Micro-task Target

Render the **workspace-first 3-zone shell** at route `/` — editor · preview · side panel — using a minimal `--rs-*` **UI** token set. Presentational only: no editor lib, no canonical types, no real panels (those are Groups C–E). This replaces the Group A placeholder route and gives Groups D/E concrete slots to mount into.

## 2. Scope

**In scope**
- `WorkspaceLayout` component: 3 labeled zones (editor / preview / side panel) via CSS Grid/Flex, fully tokenized.
- **Slot API** so D/E inject real panels without touching the layout: `WorkspaceLayout` takes `{ editor, preview, sidePanel }` as `React.ReactNode` props.
- Route `/` renders `WorkspaceLayout` with placeholder content per slot. **Workspace-first**: NO marketing hero / landing / CTA.
- Minimal `--rs-*` **UI** tokens in `globals.css` (subset of DesignSystem_Tokens.md): color (UI light `:root`), spacing, font-UI, radius, elevation. Components use `var(--rs-*)` only — **no hardcoded hex/px**.
- Optional slim top bar showing the product name only (no autosave indicator — that's Group D).

**Out of scope**
- `--rs-report-*` tokens / A4 layout → Format (W3); the preview zone is an empty placeholder here.
- Dark mode `[data-theme="dark"]` overrides + theme toggle → later; **light `:root` only**.
- Severity / readiness / component tokens for editor/checker/template/field → land with their components (D/E).
- Real `EditorPanel` / `PreviewPanel` / `CheckerPanel` → Groups D/E.
- Canonical types → Group C. Section navigator / metadata form behavior → later.

## 3. Checklist

- [ ] `src/components/WorkspaceLayout.tsx` — 3-zone responsive shell, slot props, tokens only.
- [ ] `src/app/page.tsx` — render `WorkspaceLayout` with placeholder slot content (no hero).
- [ ] `src/app/globals.css` — add `--rs-*` UI token subset (color / space / font / radius / elevation) on `:root` + base app background & typography; keep file **< 200 lines** (split to `tokens.css` if needed).
- [ ] `src/app/layout.tsx` — apply tokenized app background / base font; `lang="vi"`; no hero.
- [ ] No hardcoded hex/px in any `.tsx` (only `var(--rs-*)`).
- [ ] Token **names copied verbatim** from DesignSystem_Tokens.md.
- [ ] `lint` / `typecheck` / `build` green; `/` prerenders without error.

## 4. Interfaces / Files Expected To Change

- `[NEW]` `src/components/WorkspaceLayout.tsx`
- `[MODIFY]` `src/app/page.tsx` (placeholder text → `WorkspaceLayout` + slots)
- `[MODIFY]` `src/app/globals.css` (minimal reset → token set + base styles)
- `[MODIFY]` `src/app/layout.tsx` (apply base background/font tokens)

Slot contract (locked, so D/E wire cleanly):

```ts
type WorkspaceLayoutProps = {
  editor: React.ReactNode;
  preview: React.ReactNode;
  sidePanel: React.ReactNode;
};
```

> No imports from `src/modules/*` (they don't exist yet) and no canonical-type usage. `WorkspaceLayout` is `src/components/` shared UI.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Shell drifts into a landing page | High | Workspace-first: 3 working zones, no hero/CTA (TechnicalStack §1). |
| `--rs-report-*` leaks into the UI shell | Medium | UI branch only; report tokens deferred to Format (token-branch separation, DesignSystem §0/§7). |
| Hardcoded colors/spacing | Medium | `var(--rs-*)` only; no hex/px in components. |
| `WorkspaceLayout` couples to future panels | Medium | Slot props (`ReactNode`); no import of D/E components. |
| Token names diverge from DesignSystem | Medium | Copy names verbatim (e.g. `--rs-color-bg`, `--rs-space-4`, `--rs-font-family-ui`). |
| `globals.css` > 200 lines | Low | Keep subset minimal; split to `tokens.css` if it grows. |

## 6. Verification Plan

- `npm run lint` / `typecheck` / `build` green.
- `npm run dev` → `/` shows the 3-zone workspace (editor | preview | side panel), workspace-first, **no marketing hero**. Capture a screenshot as evidence.
- Visual: zones use token colors/spacing; window resize keeps the layout intact.
- No component unit tests in W1 (no `jsdom`/testing-library in the matrix) — visual + build verification only.
- QA report deferred to Group F `[C15]`.

## 7. Status

`DONE`

> Implemented on `feature/W1-project-bootstrap`. Decisions: 3-column `editor | preview | side-panel` (`.ws-main` grid `1fr 1fr 320px`, collapses to 1 column < 900px); dark mode deferred (light `:root` only). `WorkspaceLayout` uses slot props (`editor`/`preview`/`sidePanel`: `ReactNode`); no `src/modules/*` imports. Tokens (`--rs-*` UI subset) added to `globals.css`, names verbatim from DesignSystem; `globals.css` ~135 lines (< 200); no hardcoded hex/px in `.tsx`. Gate: `lint` ✓ / `typecheck` ✓ / `build` ✓ (route `/` static) / `vitest` ✓. Dev screenshot confirms shell + zones + workspace-first (no hero). Also folded in: `.gitignore` `evidence/` → `/evidence/` (root-anchored) so `src/modules/evidence/` is no longer ignored.
