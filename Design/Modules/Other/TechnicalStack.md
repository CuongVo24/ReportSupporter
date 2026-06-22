# 🛠️ TECHNICAL STACK — ReportSupporter (LOCKED V1.0)

> **AI RULE:** This file is the **single source of truth** for the technology stack.
> **DO NOT** suggest, install, or import any framework / library / ORM not listed here
> without the user's explicit written approval. Mọi `npm install` ngoài danh sách này = vi phạm.

ReportSupporter là một **workspace tạo báo cáo** chạy chủ yếu phía client (no mandatory login, no cloud storage — theo `ProductPRD.md` §6 Non-goals). Toàn bộ stack được chốt để: (1) deterministic giữa preview ↔ export, (2) chạy offline cho Checker, (3) tránh kéo dependency nặng quá sớm.

---

## 1. ⚙️ FRAMEWORK & RUNTIME

* **Framework:** `Next.js` (App Router) + `React` + `TypeScript` (strict mode bật `"strict": true`).
* **Package manager:** `npm` (scripts: `dev`, `build`, `lint`, `typecheck` — khớp Contract W1).
* **Rendering posture:** Workspace-first. Route đầu tiên (`/`) PHẢI là editor workspace, **không** phải landing/marketing page.
* **Node usage:** chỉ dùng server-side cho tác vụ export nặng (PDF). Phần Write/Format/Check chạy được hoàn toàn client-side.

---

## 2. ✍️ EDITOR LAYER (Module 1 — Write)

* **W1 (bootstrap):** dùng controlled `<textarea>` đơn giản — *không* kéo editor lib trong tuần 1 (theo Risk W1: "Editor library choice slows bootstrap").
* **Upgrade (W2+):** **CodeMirror 6** với `@codemirror/lang-markdown`, `@codemirror/state`, `@codemirror/view`.
    * *Lý do:* nhẹ, controlled, dễ chèn snippet (table/code/math/mermaid/callout), không lock-in nặng như rich WYSIWYG.
* **CẤM:** không dùng WYSIWYG/contenteditable lib (TipTap, Slate, Lexical) cho MVP — sai triết lý "Markdown-first".

---

## 3. 📄 MARKDOWN PIPELINE (dùng chung cho Format · Check · Export)

> Đây là **xương sống deterministic**. Cùng một input Markdown + metadata → cùng một AST → preview, checker, và export đều ăn chung nguồn. Đây chính là "intermediate document model" nhắc trong `Modules/4.Export.md`.

* **Core:** `unified`
* **Parse:** `remark-parse` + `remark-gfm` (bảng, task list, strikethrough)
* **Math (LaTeX):** `remark-math` → `rehype-katex` + `katex`
* **Code highlight:** `rehype-highlight` (highlight.js — deterministic, không cần build step như Shiki)
* **Markdown → HTML:** `remark-rehype` → `rehype-stringify`
* **Diagrams:** `mermaid` — render **client-side** (Mermaid cần DOM); ở export PDF, Puppeteer sẽ render trong Chromium nên Mermaid vẫn ra hình.

**Nguyên tắc:** Checker (Module 3) đọc **mdast/hast AST** (heading levels, code lang, image nodes, table width) — KHÔNG regex thô trên string trừ các check văn bản (`TODO`, `lorem ipsum`).

---

## 4. 📤 EXPORT LAYER (Module 4 — Export)

| Target | Library | Ghi chú |
|---|---|---|
| `report.html` | `rehype-stringify` + print CSS nhúng | Output của pipeline §3 |
| `report.pdf` | **`puppeteer`** (headless Chromium) render HTML đã format | **Heavy dep → STUB tới W4** (đúng Risk Contract W1). Chạy server-side trong Node route. Trung thực A4 / page-break / header-footer / page number |
| `report.docx` | **`docx`** (npm) sinh trực tiếp từ mdast AST | Deterministic, **không** cần LibreOffice/Pandoc |

* **CẤM** cho MVP: Pandoc binary, LibreOffice headless, `@react-pdf/renderer` (không trung thực Markdown phức tạp).
* PDF dùng Puppeteer vì cần đúng layout học thuật (A4, Times New Roman 13/14, line-height 1.5, justify, chapter-break) trong `Modules/2.Format.md`.

---

## 5. 🗄️ STORAGE LAYER

* **Local draft autosave:** IndexedDB qua **`idb`** (thin wrapper).
    * *Lý do:* No login, no cloud (Non-goals §6). Draft phải sống qua refresh (Acceptance `Modules/1.Write.md`).
* **CẤM:** không thêm backend DB, auth, hay cloud SDK trong MVP.

---

## 6. ✅ VALIDATION & TYPES

* **Runtime validation:** `zod` — cho template schema, report metadata, và parse dữ liệu từ IndexedDB.
* **Static types:** canonical TypeScript types đặt tại `src/types` (xem `Conventions/Coding & Git Standard.md`). Nguồn gốc: `ReportProject`, `ReportSection`, `ReportIssue` (định nghĩa trong `ProductPRD`, `Modules/`, Contract W1).
* **CẤM:** `any`. Dùng `unknown` + zod parse ở ranh giới I/O.

---

## 7. 🧪 TOOLING & TEST

* **Lint/format:** `ESLint` + `Prettier`.
* **Unit test:** `Vitest` — bắt buộc cho **Checker rules** (Module 3) vì logic check phải deterministic & regression-safe.
* **E2E (sau, Phase 3):** Playwright — chưa cài ở MVP.

---

## 8. 🔮 DEFERRED (khoá trước cho Phase 2/3 — chưa cài ở MVP)

| Library | Dùng cho | Phase |
|---|---|---|
| `qrcode` | QR cho evidence links | Phase 2 (W5 Evidence Kit) |
| `pptxgenjs` | Export slides `.pptx` | Phase 3 (Module 5 Present) |

> Liệt kê ở đây để AI **không tự chọn lib khác** khi tới phase đó — vẫn phải xin approve trước khi cài.

---

## 9. 🗂️ SOURCE FOLDER ARCHITECTURE (1 Module ↔ 1 thư mục)

```text
src/
  app/                  # Next.js App Router (route = workspace-first)
  components/           # UI components dùng chung
  modules/
    write/              # Module 1 — editor, preview, template, autosave
    format/             # Module 2 — numbering, TOC, A4 presets
    check/              # Module 3 — checker engine + rules (Vitest)
    export/             # Module 4 — html / pdf / docx exporters
  lib/                  # unified pipeline, idb client, helpers
  types/                # canonical types (single source) + zod schemas
```

> Chi tiết naming/commit/branch: xem `Design/Conventions/Coding & Git Standard.md`.
