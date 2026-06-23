# Contract For AI - W1A Bootstrap & Tooling (Group A)

> Scope: Group A of Week 1 — TaskBrief `[C1]`, `[C2]`. One implementable unit.
> Parent overview: `w1_project_bootstrap_contract.md`. Source: `Design/TaskBrief/Core/month1/w1.md`, `Design/RoadMap/week_1-2-3-4/week1.md`.

## 1. Micro-task Target

Stand up a runnable, lint/type/test-clean **Next.js (App Router) + TypeScript** shell with the W1 toolchain — **no product code yet**. This is the runway Group B (workspace shell) and Group C (canonical types) build on without re-touching the foundation.

## 2. Scope

**In scope**
- Initialize Next.js (App Router) + React in the repo root.
- TypeScript `strict: true`, path alias `@/* -> src/*`.
- npm scripts: `dev`, `build`, `lint`, `typecheck`.
- ESLint (flat config) with `@typescript-eslint/no-explicit-any` as **error** + Prettier.
- Vitest config: test environment `node`, resolves the `@/` alias, one smoke test.
- Install **only** the W1 matrix, pinned to **exact** versions (no `^`/`~`).

**Out of scope** (later groups / weeks)
- Workspace-first 3-zone shell + design tokens → Group B `[C3]`.
- Canonical types / templates / zod / defaults → Group C `[C4]–[C6]`.
- Editor/preview/autosave (D), checker (E), export stubs (F).
- CodeMirror, `unified`/remark/rehype/katex/mermaid, `docx`, `puppeteer` → W2+/W4.
- Component-test libs (`jsdom`, `@testing-library/*`) — **not installed** in W1.

## 3. Checklist

- [ ] `package.json` with deps + scripts `dev`/`build`/`lint`/`typecheck`.
- [ ] Exact-pinned versions for `next`, `react`, `react-dom`, `typescript`, `eslint`, `prettier`, `vitest`, `zod`, `idb` (+ committed lockfile).
- [ ] `tsconfig.json` — `strict: true`, `paths: { "@/*": ["./src/*"] }`.
- [ ] `next.config.ts`.
- [ ] `eslint.config.mjs` — flat config, `no-explicit-any` error, integrates `eslint-config-next`.
- [ ] `.prettierrc`.
- [ ] `vitest.config.ts` — `test.environment = "node"`, `@/` alias resolution.
- [ ] Minimal `src/app/layout.tsx` + `src/app/page.tsx` + `globals.css` **only** as needed for `build` to pass (real shell is Group B).
- [ ] `npm run lint` / `typecheck` / `build` and `npx vitest run` all green.

## 4. Interfaces / Files Expected To Change

- `[NEW]` `package.json`, `package-lock.json`
- `[NEW]` `tsconfig.json`, `next.config.ts`
- `[NEW]` `eslint.config.mjs`, `.prettierrc`, `vitest.config.ts`
- `[NEW]` `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` (placeholder — extended in Group B)
- `[NEW]` `src/smoke.test.ts` (trivial, proves runner + `@/` alias)

> No canonical types are defined here (Group C owns `src/types`). No type re-declaration anywhere.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Floating versions break determinism | Medium | Pin exact versions (TechnicalStack); commit lockfile. |
| ESLint flat config vs `eslint-config-next` friction | Medium | Use Next-supported flat config; `npm run lint` green before close. |
| Vitest can't resolve `@/` alias | Medium | `vite-tsconfig-paths` or `resolve.alias`; smoke test imports via `@/` to prove it. |
| Bootstrap drags in editor/export deps early | Medium | Install matrix only — no CodeMirror/unified/docx/puppeteer. |
| `page.tsx` drifts into a landing page | High | Keep placeholder minimal; workspace-first route is Group B `[C3]`. |
| >200 lines/file | Low | Only `package-lock.json` (generated) exceeds; hand-authored files stay small. |

## 6. Verification Plan

- `npm install` succeeds; lockfile pins exact versions.
- `npm run lint` — no errors (`no-explicit-any` active).
- `npm run typecheck` — clean under `strict`.
- `npm run build` — green.
- `npx vitest run` — green (smoke test confirms runner + `@/` alias).
- `npm run dev` — `/` serves without error (placeholder content; workspace shell is Group B).
- QA report deferred to Group F `[C15]`; nothing written to `Design/Reports/` yet.

## 7. Status

`DONE`

> Implemented on `feature/W1-project-bootstrap`. Decisions: Next `15.5.19` + React `19.2.7` (exact pins), self-managed `@/` alias in `vitest.config.ts` (no `vite-tsconfig-paths`). Gate: `npm run build` ✓ (route `/` prerendered static), `npm run typecheck` ✓, `npm run lint` ✓ (`no-explicit-any` active), `npx vitest run` ✓ (1 smoke test). Added `src/global.d.ts` (`declare module "*.css"`) so global stylesheet imports type-check under TS 6. `next-env.d.ts` + `*.tsbuildinfo` gitignored.
