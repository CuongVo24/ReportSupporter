# Contract For AI - W5 Group C: Evidence Appendix Table

> **Lane / Week:** Core / Month 2 / W5 - Day 3 (`Design/TaskBrief/Core/month2/w5.md` `[C60]`-`[C61]`).
> **Branch:** `feature/W5-evidence-kit`.
> **Builds on:** Group A (`kindMeta`), Group B (`EvidenceItem[]` in bundle), W2 `unified` pipeline (`renderMarkdown`/`parseMarkdown`), `src/components/PreviewPane.tsx`.
> **Depended on by:** Group D (QR sits inside the appendix), W4 Export (export consumes the same appendix artifact), W8 submission package.
> **Sources:** `w5.md` Locked Decisions #3/#7, `week5.md` Day 3, `Support.Evidence.md §5`, `TechnicalStack.md §3` (one pipeline).

---

## 1. Micro-task Target

Sinh **bảng phụ lục minh chứng** tự động từ `evidence[]` dưới dạng Markdown, đi qua **đúng** pipeline `unified` để preview = 3 export format. Xuất bản public surface của module Evidence, và hiển thị appendix trong preview.

> **🔒 Một artifact, một pipeline (Locked #3).** `buildEvidenceAppendix` trả Markdown; preview + export đều parse cùng `unified` → không renderer thứ hai, parity numbering/structure (`TechnicalStack.md §3`).
>
> **📌 Điểm tích hợp PreviewPane thực tế.** PreviewPane **không** có hàm `renderMarkdown` đơn lẻ; nó dùng `parseMarkdown` + `renderMdastToHtml` (`@/lib/markdown-pipeline`) rồi chạy `numberHeadings`/`generateToc` (`@/modules/format`). Appendix vì vậy phải nối vào **chuỗi source Markdown** đầu vào `parseMarkdown` (cùng `resolvedMarkdown` đang feed pipeline), **không** render rời rồi ghép HTML.
>
> **🔒 Heading phụ lục ĐƯỢC đánh số + vào TOC (chốt).** Nối Markdown trước `parseMarkdown` nghĩa là `## Phụ lục minh chứng` đi qua `numberHeadings` + `generateToc` như mọi heading khác ⇒ preview = export. Đây là hành vi mong muốn (phụ lục là một mục được đánh số của báo cáo), không bypass.

## 2. Scope

### In scope (`[C60]`/`[C61]`)
- `src/modules/evidence/evidence-appendix.ts`: `buildEvidenceAppendix(evidence: EvidenceItem[]): string` — bảng GFM cột **Loại** (label từ `kindMeta`) · **Tiêu đề** · **Liên kết** (url là link Markdown nếu có) · **Ghi chú**, có heading `## Phụ lục minh chứng`. `evidence` rỗng → trả `""` (không sinh phụ lục rỗng). Deterministic (cùng input → cùng output); escape ký tự `|`/newline trong cell.
- `src/modules/evidence/index.ts`: public surface — `EvidencePanel`, `EvidenceForm`, `validateEvidence`, `buildEvidenceAppendix`, `kindMeta` (+ types nếu cần). Mọi consumer (Write/Check/Export) import qua đây.
- `src/components/PreviewPane.tsx` (MODIFY): nối `buildEvidenceAppendix(evidence)` vào cuối **source Markdown** (`resolvedMarkdown`/`debouncedMarkdown`) **trước** `parseMarkdown`, để đi cùng đường `numberHeadings`/`generateToc`/sanitize — không gọi renderer rời. Nhận `evidence` qua prop (Workspace truyền `bundle.evidence`).
- Vitest: `evidence-appendix` — n item → bảng GFM đúng số hàng + label kind đúng; rỗng → `""`; cell chứa `|`/newline được escape; url optional (không có url → cell trống, không vỡ bảng).

### Out of scope
- ❌ QR (Group D) — appendix chừa chỗ, QR chèn ở Group D.
- ❌ Nhúng appendix vào file export (W4-dependent — Group D ghi rõ; export thật ở W4).
- ❌ Sửa pipeline `unified` (đã chốt W2).
- ❌ Form/Panel (Group B).
- ❌ Dep mới.

## 3. Checklist
- [ ] `buildEvidenceAppendix` trả Markdown table deterministic; rỗng → `""`; escape cell.
- [ ] `src/modules/evidence/index.ts` export đúng public surface; consumer chỉ import qua index.
- [ ] `PreviewPane` nối appendix vào source Markdown trước `parseMarkdown` (qua `numberHeadings`/`generateToc`/sanitize, không bypass); heading phụ lục được đánh số + vào TOC.
- [ ] `evidence-appendix.test.ts` phủ n-item/empty/escape/url-optional.
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/modules/evidence/evidence-appendix.ts
import type { EvidenceItem } from "@/types";
export function buildEvidenceAppendix(evidence: EvidenceItem[]): string; // Markdown ("" nếu rỗng)

// src/modules/evidence/index.ts
export { EvidencePanel } from "./EvidencePanel";
export { EvidenceForm } from "./EvidenceForm";
export { validateEvidence } from "./validate";
export { buildEvidenceAppendix } from "./evidence-appendix";
export { kindMeta } from "./kind-meta";
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/evidence/evidence-appendix.ts` | NEW | ~70 |
| `src/modules/evidence/index.ts` | NEW | ~12 |
| `src/components/PreviewPane.tsx` | MODIFY | ~+10 |
| `src/components/Workspace.tsx` | MODIFY | ~+1 (pass `evidence`) |
| `src/modules/evidence/evidence-appendix.test.ts` | NEW | ~70 |

> **Import boundary:** `evidence-appendix` imports `@/types` + `kindMeta` only. `PreviewPane` imports `@/modules/evidence` + `@/lib` (pipeline). No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Appendix render khác giữa preview ↔ export | Medium | Một artifact Markdown qua một pipeline; export consume cùng `buildEvidenceAppendix` (Locked #3). |
| Cell chứa `|`/newline vỡ bảng GFM | Medium | Escape `|`→`\|`, thay newline bằng khoảng trắng; test phủ. |
| Appendix rỗng tạo bảng trống xấu | Low | `evidence` rỗng → `""` (không sinh). |
| Bypass sanitize khi nối appendix | Medium | Nối vào Markdown **trước** render → đi qua `rehype-sanitize` như nội dung thường. |

## 6. Verification Plan
- 3 item (github/video/deploy) → bảng 3 hàng, cột Loại đúng label VI; url thành link MD.
- `buildEvidenceAppendix([])` → `""`.
- item có `note` chứa `|` → cell escape, bảng không vỡ.
- Preview hiển thị "Phụ lục minh chứng" (đã đánh số) + bảng, có mục trong TOC, qua sanitize (no raw HTML).
- lint/typecheck/test/build xanh.

## 7. Status

`DONE`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(evidence): appendix table builder + module index`; (2) `feat(preview): render evidence appendix`; +1 docs commit.
