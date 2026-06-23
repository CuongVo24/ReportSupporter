# Contract For AI - W2 Group A: Markdown Pipeline (shared backbone)

> **Lane / Week:** Core / Month 1 / W2 - Day 1 (`Design/TaskBrief/Core/month1/w2.md` `[C16]`-`[C17]`).
> **Branch:** `feature/W2-markdown-editor`.
> **Builds on:** W1 (`ReportSection.markdown: string`, canonical types, `src/lib` exists).
> **Depended on by:** Group C (preview), W3 (Format/Check read AST), W4 (Export render). This is the single shared parser.
> **Sources:** `Design/TaskBrief/Core/month1/w2.md` Locked Decision #1, `Design/RoadMap/week_1-2-3-4/week2.md` Day 1, `Design/Modules/Other/TechnicalStack.md` §3, `Design/Modules/Other/CanonicalTypes.md`.

---

## 1. Micro-task Target

Đặt **một** pipeline `unified` deterministic tại `src/lib` làm xương sống chung cho preview (W2), check/format (W3), export (W4). Không có parser thứ hai ở bất kỳ đâu. Pipeline nhận raw Markdown `string` → trả HTML string (cho preview) qua `remark-parse` + `remark-gfm` + `remark-math` → `remark-rehype` → **`rehype-sanitize`** → `rehype-katex` + `rehype-highlight` → `rehype-stringify`. Mermaid KHÔNG nằm trong pipeline (client-only, Group C).

> **🔒 Bảo mật (bất biến — `TechnicalStack.md` §0/§3/§8c, `Security.md`):** `rehype-sanitize` chèn **ngay sau `remark-rehype`, trước** katex/highlight (để markup katex/highlight là trusted). Raw HTML bị bỏ mặc định — **không** `allowDangerousHtml`, **không** `rehype-raw`. Mọi HTML đẩy vào DOM (preview Group C, export W4) phải là output đã sanitize. Schema mở rộng giữ class `math-*`/`language-*`, chặn `javascript:` URI.

## 2. Scope

### In scope (`[C16]`/`[C17]`)
- `src/lib/markdown-pipeline.ts`:
  - `renderMarkdown(md: string): string` — Markdown → HTML đã sanitize (cho preview Group C).
  - `parseMarkdown(md: string): MdastRoot` — Markdown → mdast (remark-parse + gfm + math). **Lock ngay** ở W2 để Check/Format/Export (W3/W4) đọc cùng AST.
  - Pipeline khởi tạo 1 lần (module-level), tái dùng.
- `src/lib/pipeline-types.ts`: re-export/áp dụng các type **canonical** `CanonicalTypes.md §7` — `ParsedSection`, `PipelineResult` (KHÔNG tự khai báo shape mới; cite `import { Root as MdastRoot } from "mdast"`). Type kết quả render, no `any`; chạm `unknown` (plugin options) thì narrow rõ.
- Cài deps W2 (pin **exact**, no `^`/`~`): `unified`, `remark-parse`, `remark-gfm`, `remark-math`, `remark-rehype`, **`rehype-sanitize`**, `rehype-katex`, `rehype-highlight`, `rehype-stringify`, `katex`. (CodeMirror → Group B; `mermaid` → Group C.)
- Vitest: render GFM table; render math (`$...$` → KaTeX markup); render code fence với language (highlight class xuất hiện); input rỗng → output an toàn; **sanitize: `<script>`/`<img onerror>`/`[x](javascript:...)` bị loại khỏi HTML output**.

### Out of scope
- ❌ Mermaid (Group C, client-only).
- ❌ CodeMirror / editor (Group B).
- ❌ Heading numbering / TOC / format presets (W3).
- ❌ **Cache AST theo section + Web Worker boundary** (`PipelineContract.md` §2/§3) → W3. W2 chỉ lock *shape* `ParsedSection`/`PipelineResult` + parse đồng bộ main-thread.
- ❌ `FormattedReport` (TOC/caption/preset — Format Module 2, W3).
- ❌ Bất kỳ dep ngoài matrix W2.

## 3. Checklist
- [ ] `npm i -E unified remark-parse remark-gfm remark-math remark-rehype rehype-sanitize rehype-katex rehype-highlight rehype-stringify katex` (exact pin; ghi version vào contract sau khi cài).
- [ ] `src/lib/markdown-pipeline.ts` ≤200 dòng, export `renderMarkdown` + `parseMarkdown`; sanitize đúng vị trí (sau remark-rehype, trước katex/highlight).
- [ ] `src/lib/pipeline-types.ts` áp dụng `ParsedSection`/`PipelineResult` từ `CanonicalTypes §7`, no `any`.
- [ ] `src/lib/markdown-pipeline.test.ts`: table / math / code-highlight / empty / **sanitize (script/onerror/javascript: bị loại)**.
- [ ] 4 gates xanh (lint/typecheck/test/build).

## 4. Expected Interfaces / Files

```ts
// src/lib/pipeline-types.ts — re-export canonical shapes (CanonicalTypes §7), KHÔNG khai báo mới
import type { Root as MdastRoot } from "mdast";
export type { ParsedSection, PipelineResult } from "@/types"; // §7

// src/lib/markdown-pipeline.ts
export function renderMarkdown(markdown: string): string;   // Markdown → sanitized HTML
export function parseMarkdown(markdown: string): MdastRoot;  // Markdown → mdast (shared AST)
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/lib/markdown-pipeline.ts` | NEW | ~80 |
| `src/lib/pipeline-types.ts` | NEW | ~15 |
| `src/lib/markdown-pipeline.test.ts` | NEW | ~70 |
| `src/types/report.ts` or `src/types/pipeline.ts` | MODIFY/NEW | `ParsedSection`/`PipelineResult` nếu chưa có trong `src/types` |
| `package.json` / `package-lock.json` | MODIFY | deps |

> **Import boundary:** `src/lib/markdown-pipeline.ts` imports only `unified`/remark/rehype/katex packages (+ `@/types` cho AST shapes). No import from `modules/*` or UI. Pure, offline, no `fetch`.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Preview pipeline ≠ export pipeline sau này | High | Một pipeline duy nhất ở `src/lib`; mọi consumer ăn chung `renderMarkdown`/`parseMarkdown`. |
| **XSS qua raw HTML / `javascript:` URI** | **High** | `rehype-sanitize` ngay sau `remark-rehype`; không `allowDangerousHtml`/`rehype-raw`; test phủ script/onerror/js-URI. |
| Pipeline rebuild mỗi render (chậm) | Medium | Khởi tạo processor 1 lần ở module scope, tái dùng. |
| Tự khai báo lại `ParsedSection`/`PipelineResult` (type drift) | Medium | Import từ `@/types` (CanonicalTypes §7); không định nghĩa shape mới trong `lib`. |
| Dep leak ngoài matrix | Medium | Chỉ cài đúng danh sách §3; `mermaid` để Group C. |
| KaTeX CSS chưa có ở W2 Day1 | Low | Markup KaTeX render ở pipeline; CSS import ở Group C (preview). |

## 6. Verification Plan
- `renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |")` chứa `<table>`.
- `renderMarkdown("$x^2$")` chứa class KaTeX (`katex`).
- ` ```ts\nconst a=1\n``` ` → chứa `hljs`/language class.
- `renderMarkdown("<script>alert(1)</script>")` → **không** chứa `<script>`; `renderMarkdown("[x](javascript:alert(1))")` → href bị loại/vô hiệu.
- `parseMarkdown("# h")` → mdast `Root` có heading node (shared AST).
- `renderMarkdown("")` → string an toàn, không throw.
- lint/typecheck/test/build xanh.

## 7. Status

`DONE`

> VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất 2 commit: (1) cài deps + pipeline + types + test; (2) (nếu tách) — mặc định gộp 1 commit feat + 1 docs contract.
