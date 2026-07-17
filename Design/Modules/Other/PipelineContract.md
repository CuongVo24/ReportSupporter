# 🔗 PIPELINE CONTRACT — Unified AST Document Model (V1.1)

## W30 common worker protocol

- Preview/check/format use discriminated `PipelineRequest/PipelineResponse`; pure core functions remain unit-testable and execute in `pipeline.worker.ts` in browsers.
- Every message carries request ID, project ID, section revisions and cache key derived from revision plus format/asset hash. Out-of-order/stale responses are rejected.
- Preview does not parse AST on the main thread. Mermaid remains lazy on the main thread because it needs DOM; Import/OCR have separate lazy paths.
- Route shell, editor, preview, import/OCR, Present, Export, AI settings and Mermaid are split. Gates: Library ≤200 KiB gzip, Workspace ≤450 KiB gzip, reducer P95 <16 ms, 40-page main-thread transfer/response P95 <200 ms.

This contract defines the unified data structures, caching strategy, and thread boundaries for the Markdown-to-AST parsing pipeline. It ensures that the Write, Format, Check, and Export modules consume a single source of truth without redundant parsing.

> **Lưu ý:** Các kiểu dữ liệu cơ bản khác (như `ReportProject`, `ReportSection`, `EvidenceItem`, `FormatPreset`) được định nghĩa tập trung tại [CanonicalTypes.md](file:///e:/ReportSupporter/Design/Modules/Other/CanonicalTypes.md).

---

## 1. Data Structures

The AST is represented using standard **mdast** (Markdown Abstract Syntax Tree) and **hast** (HTML Abstract Syntax Tree) structures from the `unified` ecosystem.

> **Type definitions live in [CanonicalTypes.md](file:///e:/ReportSupporter/Design/Modules/Other/CanonicalTypes.md) §7 (Pipeline Model) — Single Source of Truth.** This contract only *cites* them; do **not** re-declare or edit shapes here.

The pipeline types defined canonically in `CanonicalTypes.md` §7:

| Type | Role |
| :--- | :--- |
| `ParsedSection` | One section parsed into mdast (`sectionId`, `markdown`, `ast`, `updatedAt`). |
| `PipelineResult` | Orchestrator output after merging+parsing all sections (`projectId`, `sections[]`, `combinedMdast`, `updatedAt`). |
| `FormattedReport` | Fully formatted & numbered report (`projectId`, `toc`, `figures`, `tables`, `preset`, `hast`, `mdast`). Produced by Format, consumed by Check & Export. |

> AST roots use `import { Root as MdastRoot } from "mdast"` and `import { Root as HastRoot } from "hast"` (same imports declared in `CanonicalTypes.md`).

This document owns the **runtime semantics** below — caching (§2) and worker boundary (§3) — not the type shapes.

---

## 2. Caching Strategy

Parsing Markdown to AST is a CPU-bound operation. To prevent performance lag:
1. **Section-scoped Cache:** The Web Worker maintains an in-memory cache of `ParsedSection` items indexed by `sectionId`.
2. **Cache Key:** The cache key is composed of `sectionId + hash(markdown)`.
3. **Cache Validation:**
   - When a user modifies a section, only that section is re-parsed.
   - For all unmodified sections, the worker returns the cached AST.
   - The combined document AST (`combinedMdast`) is assembled by merging the section-scoped ASTs.

---

## 3. Worker Boundary

To keep the UI main thread responsive:
1. **Thread Separation:** The entire `unified` parsing pipeline (remark → rehype) and Checker engine run inside a Web Worker.
2. **Data Transfer:** Data is transferred between the main thread and the worker using `postMessage()` via **Structured Clone**.
3. **Banned Types:** The AST objects transferred must not contain functions, DOM nodes, or cyclical references.
4. **Mermaid Rendering Exception:** Since Mermaid requires DOM access, it cannot be rendered in the worker. The worker only tags Mermaid code blocks, and the main thread performs the rendering lazy client-side.

---

## 4. Import Boundary (V1.1 — Phase 5 / W21-W24)

Module 6 — Import (`Design/Modules/6.Import.md`) chuyển PDF/DOCX/XLSX/PPTX → Markdown. Ranh giới với pipeline:

1. **Markdown là giao diện duy nhất.** Converter output là **Markdown text + `ReportAsset[]`** (`ImportResult` — `CanonicalTypes.md` §11). Import **không được** sinh mdast/hast trực tiếp — nội dung import re-enter pipeline chuẩn qua `remark-parse` như mọi section khác. Một parser, một nguồn sự thật.
2. **Reverse pipeline (HTML → Markdown) chỉ sống trong Import.** `rehype-remark` + `remark-stringify` (W21) chỉ được import bên trong `src/modules/import/` — Write/Format/Check/Export không được dùng chiều ngược.
3. **Worker boundary.** Converter nặng (DOCX/XLSX/PPTX parse, PDF heuristic) chạy trong **import worker** riêng (W24 hardening), tách khỏi parse worker §3; `pdfjs-dist` tự mang worker của nó (bundle local, không CDN). Dữ liệu qua `postMessage()` Structured Clone — cùng banned types §3. OCR (`tesseract.js`, experimental W24) lazy-load, chỉ chạy sau explicit user action.
4. **Sanitize bắt buộc.** HTML trung gian (mammoth output) phải qua sanitize trước khi vào `rehype-remark` — cùng chính sách `rehype-sanitize` của preview.
5. **Asset contract.** Ảnh trích từ file nguồn → `ReportAsset` base64 data URL (§1 CanonicalTypes), đăng ký qua đường `import-assets` hiện có; Markdown tham chiếu `asset://<id>` như asset chèn tay.
