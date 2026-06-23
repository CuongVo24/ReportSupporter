# Contract For AI — W2 Break: Fix Asset Resolve Order (preview images)

> **Lane:** Core / break_task / week2_break.
> **Branch:** `feature/W2-markdown-editor` (hoặc `fix/w2-asset-resolve`).
> **Type:** Bug fix — review finding **#1**: ảnh paste (`asset:<id>`) **không hiển thị** trong preview.
> **Builds on:** Group A (`renderMarkdown` + sanitize schema, `src/lib/markdown-pipeline.ts`), Group C (`PreviewPane`, `resolveAssetRefs`), Group E (image insert → ref `![alt](asset:<id>)`).
> **Sources:** `Design/Modules/Other/Security.md §1.3`, `Design/Modules/1.Write.md §5.3`, `Design/Modules/Other/TechnicalStack.md §3`, contracts `w2c`/`w2e`.

---

## 1. Micro-task Target

Sửa **thứ tự resolve asset** trong `PreviewPane` để ảnh `asset:<id>` hiển thị thật.

**Root cause:** `PreviewPane` gọi `resolveAssetRefs(renderMarkdown(part), assets)` — tức resolve **SAU** render. Nhưng `rehype-sanitize` (trong `renderMarkdown`) chỉ cho `src` protocol `http/https/data`; `asset:` không thuộc allowlist nên **`src="asset:<id>"` bị strip** ngay khi render. Tới lượt `resolveAssetRefs` chạy thì chuỗi `asset:<id>` đã biến mất → không thay được → ảnh trống.

**Fix:** resolve `asset:<id>` → `data:` URL **trên Markdown TRƯỚC khi render** (đúng `Security.md §1.3`). Khi đó `<img>` nhận `src="data:..."` — protocol `data` đã được schema cho phép → sống qua sanitize.

## 2. Scope

### In scope
- `src/components/PreviewPane.tsx`: đảo thứ tự nhánh non-mermaid → `renderMarkdown(resolveAssetRefs(part, assets))`.
- `src/modules/write/resolve-assets.ts`: cập nhật JSDoc (ghi rõ: chạy trên **Markdown, trước render/sanitize**). Signature & logic **không đổi**.
- **Regression test tích hợp** (thuần, không jsdom): chuỗi `resolveAssetRefs` → `renderMarkdown` để chứng minh `<img>` sống với `src="data:..."`. Đây là test đáng lẽ bắt được bug (test cũ chỉ kiểm resolver **cô lập**, không qua sanitize).

### Out of scope
- ❌ Đổi sanitize schema (giữ nguyên — `data:` đã đủ; KHÔNG thêm protocol `asset`).
- ❌ Đổi logic `resolveAssetRefs` (chỉ đổi nơi gọi + JSDoc).
- ❌ Asset manager / resize / nhiều ảnh (sau).
- ❌ Findings #2/#3/#4 (contract polish riêng).

## 3. Checklist
- [ ] `PreviewPane.tsx`: nhánh non-mermaid resolve markdown trước, render sau. Nhánh mermaid **không đổi**.
- [ ] `resolve-assets.ts`: JSDoc nêu rõ chạy trên Markdown trước sanitize.
- [ ] Test: markdown `![x](asset:a1)` + `[{id:"a1", data:"data:image/png;base64,AAA", …}]` → HTML render chứa `data:image/png;base64,AAA` ở `src`, **không** còn `asset:a1`.
- [ ] Test: id không có trong assets → không throw (img có thể bị strip src, chấp nhận).
- [ ] 4 gates xanh (build verify khi máy đủ RAM).

## 4. Expected Interfaces / Files

```ts
// KHÔNG đổi signature:
export function resolveAssetRefs(source: string, assets: ReportAsset[]): string;
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/components/PreviewPane.tsx` | MODIFY | ~2 (đảo thứ tự) |
| `src/modules/write/resolve-assets.ts` | MODIFY | JSDoc only |
| `src/lib/markdown-pipeline.test.ts` *(hoặc `resolve-assets.test.ts`)* | MODIFY | +~15 (regression) |

> **Import boundary** không đổi. Thuần, offline, no `fetch`.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| Data URL dài trong Markdown ảnh hưởng parse | Thấp | remark xử lý URL dài trong `](...)` ổn; base64 không chứa `)` nên không vỡ cú pháp link. |
| Regex `asset:`/`image:` thay nhầm trong text/code | Thấp (pre-existing) | Không introduce mới; ghi known-limitation, tinh chỉnh khi AST-aware (W3). |
| Nhánh Mermaid bị ảnh hưởng | Thấp | Chỉ sửa nhánh non-mermaid; mermaid vẫn split trước. |

## 6. Verification Plan
- Unit: `renderMarkdown(resolveAssetRefs("![a](asset:a1)", [{id:"a1", data:"data:image/png;base64,AAA", …}]))` → chứa `data:image/png;base64,AAA`, không còn `asset:a1`.
- Unit: id thiếu → không throw.
- Manual (khi đủ RAM): paste ảnh → hiện trong preview; `<img>` có `src="data:..."`.
- lint / typecheck / test / build xanh.

## 7. Status

**DONE**

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất 1 commit `fix(preview): resolve asset refs before sanitize` + 1 docs commit (contract này).
