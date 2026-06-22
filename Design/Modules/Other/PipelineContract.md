# 🔗 PIPELINE CONTRACT — Unified AST Document Model (V1.0)

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
