# Contract For AI - W2 Group A: Markdown Pipeline (shared backbone)

> **Lane / Week:** Core / Month 1 / W2 - Day 1 (`Design/TaskBrief/Core/month1/w2.md` `[C16]`-`[C17]`).
> **Branch:** `feature/W2-markdown-editor`.
> **Builds on:** W1 (`ReportSection.markdown: string`, canonical types, `src/lib` exists).
> **Depended on by:** Group C (preview), W3 (Format/Check read AST), W4 (Export render). This is the single shared parser.
> **Sources:** `Design/TaskBrief/Core/month1/w2.md` Locked Decision #1, `Design/RoadMap/week_1-2-3-4/week2.md` Day 1, `Design/Modules/Other/TechnicalStack.md` §3, `Design/Modules/Other/CanonicalTypes.md`.

---

## 1. Micro-task Target

Đặt **một** pipeline `unified` deterministic tại `src/lib` làm xương sống chung cho preview (W2), check/format (W3), export (W4). Không có parser thứ hai ở bất kỳ đâu. Pipeline nhận raw Markdown `string` → trả HTML string (cho preview) qua `remark-parse` + `remark-gfm` + `remark-math` → `remark-rehype` → `rehype-katex` + `rehype-highlight` → `rehype-stringify`. Mermaid KHÔNG nằm trong pipeline (client-only, Group C).

## 2. Scope

### In scope (`[C16]`/`[C17]`)
- `src/lib/markdown-pipeline.ts`: hàm `renderMarkdown(md: string): string` (HTML) + (nếu cần) `parseMarkdown(md: string)` trả mdast cho W3. Pipeline khởi tạo 1 lần (module-level), tái dùng.
- `src/lib/pipeline-types.ts`: type kết quả pipeline, no `any`. Input là `string`; nếu chạm `unknown` (vd plugin options) thì narrow rõ.
- Cài deps W2 (pin **exact**, no `^`/`~`): `unified`, `remark-parse`, `remark-gfm`, `remark-math`, `remark-rehype`, `rehype-katex`, `rehype-highlight`, `rehype-stringify`, `katex`. (CodeMirror → Group B; `mermaid` → Group C.)
- Vitest: render GFM table, render math (`$...$` → KaTeX markup), render code fence với language (highlight class xuất hiện), input rỗng → output an toàn.

### Out of scope
- ❌ Mermaid (Group C, client-only).
- ❌ CodeMirror / editor (Group B).
- ❌ Heading numbering / TOC / format presets (W3).
- ❌ Sanitize nâng cao / `rehype-sanitize` policy phức tạp (chỉ cần an toàn cơ bản; W3 nếu cần siết).
- ❌ Bất kỳ dep ngoài matrix W2.

## 3. Checklist
- [ ] `npm i -E unified remark-parse remark-gfm remark-math remark-rehype rehype-katex rehype-highlight rehype-stringify katex` (exact pin; ghi version vào contract sau khi cài).
- [ ] `src/lib/markdown-pipeline.ts` ≤200 dòng, export `renderMarkdown`.
- [ ] `src/lib/pipeline-types.ts` typed, no `any`.
- [ ] `src/lib/markdown-pipeline.test.ts`: table / math / code-highlight / empty.
- [ ] 4 gates xanh (lint/typecheck/test/build).

## 4. Expected Interfaces / Files

```ts
// src/lib/pipeline-types.ts
export type RenderResult = { html: string };

// src/lib/markdown-pipeline.ts
export function renderMarkdown(markdown: string): string; // returns HTML
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/lib/markdown-pipeline.ts` | NEW | ~60 |
| `src/lib/pipeline-types.ts` | NEW | ~15 |
| `src/lib/markdown-pipeline.test.ts` | NEW | ~50 |
| `package.json` / `package-lock.json` | MODIFY | deps |

> **Import boundary:** `src/lib/markdown-pipeline.ts` imports only `unified`/remark/rehype/katex packages (+ optional `@/types`). No import from `modules/*` or UI. Pure, offline, no `fetch`.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Preview pipeline ≠ export pipeline sau này | High | Một pipeline duy nhất ở `src/lib`; mọi consumer ăn chung. |
| Pipeline rebuild mỗi render (chậm) | Medium | Khởi tạo processor 1 lần ở module scope, tái dùng. |
| Raw HTML trong Markdown gây inject | Medium | `remark-rehype` mặc định bỏ raw HTML; không bật `allowDangerousHtml`. |
| Dep leak ngoài matrix | Medium | Chỉ cài đúng danh sách §3; `mermaid` để Group C. |
| KaTeX CSS chưa có ở W2 Day1 | Low | Markup KaTeX render ở pipeline; CSS import ở Group C (preview). |

## 6. Verification Plan
- `renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |")` chứa `<table>`.
- `renderMarkdown("$x^2$")` chứa class KaTeX (`katex`).
- ` ```ts\nconst a=1\n``` ` → chứa `hljs`/language class.
- `renderMarkdown("")` → string an toàn, không throw.
- lint/typecheck/test/build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất 2 commit: (1) cài deps + pipeline + types + test; (2) (nếu tách) — mặc định gộp 1 commit feat + 1 docs contract.
