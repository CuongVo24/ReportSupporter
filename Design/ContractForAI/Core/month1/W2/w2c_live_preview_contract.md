# Contract For AI - W2 Group C: Live Preview (unified + Mermaid)

> **Lane / Week:** Core / Month 1 / W2 - Day 3 (`Design/TaskBrief/Core/month1/w2.md` `[C21]`-`[C23]`).
> **Branch:** `feature/W2-markdown-editor`.
> **Builds on:** Group A (`renderMarkdown` from `src/lib/markdown-pipeline.ts`), W1 `PreviewPane` (`src/components/PreviewPane.tsx`, raw `<pre>`, prop `{ markdown }`).
> **Sources:** `Design/TaskBrief/Core/month1/w2.md` Locked Decision #1 & #2, `week2.md` Day 3, `TechnicalStack.md` §3.

---

## 1. Micro-task Target

Biến `PreviewPane` từ raw `<pre>` thành preview HTML thật chạy qua pipeline Group A (GFM table + KaTeX + highlight). Mermaid render **client-only** trong `MermaidRenderer.tsx` (không SSR). Import KaTeX CSS cho math. Preview re-parse **debounced** (chỉ khi ngừng gõ) để tránh thrash.

## 2. Scope

### In scope (`[C21]`/`[C22]`/`[C23]`)
- `[C21]` `PreviewPane.tsx`: gọi `renderMarkdown(markdown)` → set HTML an toàn vào container. Giữ prop `{ markdown }`. Debounce re-parse (~200–300ms) khi markdown đổi.
- `[C22]` `src/modules/write/MermaidRenderer.tsx`: tìm code block `mermaid` trong HTML đã render và render diagram client-only (dynamic import `mermaid`, `useEffect`). Không chạy khi SSR.
- `[C23]` Import `katex` CSS (qua `src/lib/katex-styles.ts` hoặc import trong preview) để math hiển thị đúng.
- Cài dep (exact pin): `mermaid`.
- Vitest: `PreviewPane` logic thuần (vd hàm debounce/extract) test được không cần jsdom; nếu cần DOM thì chỉ test phần thuần (extract mermaid blocks).

### Out of scope
- ❌ Sửa pipeline (đã chốt ở Group A).
- ❌ Heading numbering / TOC (W3).
- ❌ Print CSS A4 (W3/W4).
- ❌ Export (W4).
- ❌ Dep ngoài matrix W2.

## 3. Checklist
- [ ] `npm i -E mermaid`.
- [ ] `PreviewPane.tsx` render HTML từ `renderMarkdown`, debounced, ≤200 dòng, `"use client"` nếu cần.
- [ ] `MermaidRenderer.tsx` client-only, dynamic import `mermaid`, no SSR.
- [ ] KaTeX CSS được import (math hiển thị).
- [ ] Test phần thuần (extract mermaid / debounce).
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// PreviewPane.tsx — UNCHANGED prop: { markdown: string }
// src/modules/write/MermaidRenderer.tsx
export function MermaidRenderer(props: { code: string }): JSX.Element; // client-only
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/components/PreviewPane.tsx` | MODIFY | ~80 |
| `src/modules/write/MermaidRenderer.tsx` | NEW | ~70 |
| `src/lib/katex-styles.ts` (or CSS import) | NEW | ~10 |
| `src/modules/write/extract-mermaid.test.ts` | NEW | ~40 |
| `package.json` / `lock` | MODIFY | deps |

> **Import boundary:** `PreviewPane` imports `@/lib` (pipeline) + `MermaidRenderer`. `MermaidRenderer` imports `mermaid` only. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Mermaid vỡ SSR (cần DOM) | High | Dynamic import + `useEffect`, client-only; guard `typeof window`. |
| `dangerouslySetInnerHTML` từ pipeline | Medium | HTML đến từ pipeline Group A (không bật raw HTML); input là markdown người dùng đã được remark xử lý. |
| Re-parse mỗi keystroke gây lag | Medium | Debounce ~250ms; chỉ render khi ngừng gõ. |
| KaTeX thiếu CSS → math vỡ layout | Medium | Import `katex/dist/katex.min.css`. |
| File >200 dòng | Medium | Tách MermaidRenderer + katex-styles khỏi PreviewPane. |

## 6. Verification Plan
- Gõ bảng GFM → preview hiện `<table>` (thủ công).
- `$x^2$` → math render KaTeX (thủ công).
- Code fence ` ```ts ` → highlight màu (thủ công).
- ` ```mermaid ` block → diagram render, không lỗi SSR (thủ công + build xanh).
- lint/typecheck/test/build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> Đề xuất 2 commit: (1) PreviewPane qua pipeline + katex CSS; (2) MermaidRenderer client-only + test. +1 docs commit.
