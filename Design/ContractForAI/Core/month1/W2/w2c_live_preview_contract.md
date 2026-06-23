# Contract For AI - W2 Group C: Live Preview (unified + Mermaid)

> **Lane / Week:** Core / Month 1 / W2 - Day 3 (`Design/TaskBrief/Core/month1/w2.md` `[C21]`-`[C23]`).
> **Branch:** `feature/W2-markdown-editor`.
> **Builds on:** Group A (`renderMarkdown` from `src/lib/markdown-pipeline.ts` — HTML đã `rehype-sanitize`), W1 `PreviewPane` (`src/components/PreviewPane.tsx`, raw `<pre>`, prop `{ markdown }`).
> **Sources:** `Design/TaskBrief/Core/month1/w2.md` Locked Decision #1/#2/#5/#6, `week2.md` Day 3, `TechnicalStack.md` §3, `1.Write.md §5.3` (asset resolve).
>
> **⚠️ Accepted deviation (path).** `week2.md` Day 3 ghi `src/modules/write/PreviewPanel.tsx`, nhưng W1 đã đặt preview ở `src/components/PreviewPane.tsx`. Contract này **giữ vị trí W1 thực tế** (`src/components/PreviewPane.tsx`) để khỏi churn; việc dời preview/editor về `src/modules/write/` (theo `TechnicalStack.md §9`) là một refactor riêng, không thuộc W2.

---

## 1. Micro-task Target

Biến `PreviewPane` từ raw `<pre>` thành preview HTML thật chạy qua pipeline Group A (GFM table + KaTeX + highlight). Mermaid render **client-only** trong `MermaidRenderer.tsx` (không SSR). Import KaTeX CSS cho math. Preview re-parse **debounced** (chỉ khi ngừng gõ) để tránh thrash.

## 2. Scope

### In scope (`[C21]`/`[C22]`/`[C23]`)
- `[C21]` `PreviewPane.tsx`: gọi `renderMarkdown(markdown)` (HTML đã sanitize ở Group A) → set vào container qua `dangerouslySetInnerHTML` (an toàn vì đã sanitize). Giữ prop `{ markdown }`. Debounce re-parse (~200–300ms) khi markdown đổi.
- `[C22]` `src/modules/write/MermaidRenderer.tsx`: tìm code block `mermaid` trong HTML đã render và render diagram client-only (dynamic import `mermaid`, `useEffect`). Không chạy khi SSR.
- `[C23]` Import `katex` CSS (qua `src/lib/katex-styles.ts` hoặc import trong preview) để math hiển thị đúng.
- **Asset resolver (`1.Write.md §5.3`):** `src/modules/write/resolve-assets.ts` — thay `asset:<id>` trong Markdown/HTML bằng data URL từ `bundle.assets` (offline) để ảnh paste (Group E) hiển thị trong preview. `PreviewPane` nhận thêm prop `assets` (hoặc map id→dataUrl). Hàm resolver thuần → test được.
- Cài dep (exact pin): `mermaid`.
- Vitest: `resolve-assets` (id có/không trong map), extract mermaid blocks, debounce — phần thuần, không cần jsdom.

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
// PreviewPane.tsx — prop mở rộng: { markdown: string; assets?: ReportAsset[] }
// src/modules/write/resolve-assets.ts
export function resolveAssetRefs(html: string, assets: ReportAsset[]): string; // asset:<id> → data URL
// src/modules/write/MermaidRenderer.tsx
export function MermaidRenderer(props: { code: string }): JSX.Element; // client-only
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/components/PreviewPane.tsx` | MODIFY | ~90 |
| `src/modules/write/MermaidRenderer.tsx` | NEW | ~70 |
| `src/modules/write/resolve-assets.ts` | NEW | ~30 |
| `src/lib/katex-styles.ts` (or CSS import) | NEW | ~10 |
| `src/modules/write/resolve-assets.test.ts` + `extract-mermaid.test.ts` | NEW | ~60 |
| `package.json` / `lock` | MODIFY | deps |

> **Import boundary:** `PreviewPane` imports `@/lib` (pipeline) + `MermaidRenderer` + `resolve-assets`. `MermaidRenderer` imports `mermaid` only. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Mermaid vỡ SSR (cần DOM) | High | Dynamic import + `useEffect`, client-only; guard `typeof window`. |
| `dangerouslySetInnerHTML` từ pipeline | Low | HTML đã qua `rehype-sanitize` ở Group A (raw HTML/`javascript:` bị loại); preview chỉ render output trusted. |
| Re-parse mỗi keystroke gây lag | Medium | Debounce ~250ms; chỉ render khi ngừng gõ. |
| KaTeX thiếu CSS → math vỡ layout | Medium | Import `katex/dist/katex.min.css`. |
| File >200 dòng | Medium | Tách MermaidRenderer + katex-styles khỏi PreviewPane. |

## 6. Verification Plan
- Gõ bảng GFM → preview hiện `<table>` (thủ công).
- `$x^2$` → math render KaTeX (thủ công).
- Code fence ` ```ts ` → highlight màu (thủ công).
- ` ```mermaid ` block → diagram render, không lỗi SSR (thủ công + build xanh).
- `resolveAssetRefs("![](asset:a1)", [{id:"a1",data:"data:..."}])` → chứa data URL; id thiếu → giữ nguyên/placeholder, không throw.
- lint/typecheck/test/build xanh.

## 7. Status

`DONE`

> Đề xuất 2 commit: (1) PreviewPane qua pipeline + katex CSS; (2) MermaidRenderer client-only + test. +1 docs commit.
