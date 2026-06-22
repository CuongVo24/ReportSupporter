# 🛠️ TECHNICAL STACK — ReportSupporter (LOCKED V1.0)

> **AI RULE:** This file is the **single source of truth** for the technology stack.
> **DO NOT** suggest, install, or import any framework / library / ORM not listed here
> without the user's explicit written approval. Mọi `npm install` ngoài danh sách này = vi phạm.

ReportSupporter là một **workspace tạo báo cáo** chạy chủ yếu phía client (no mandatory login, no cloud storage — theo `ProductPRD.md` §6 Non-goals). Toàn bộ stack được chốt để: (1) deterministic giữa preview ↔ export, (2) chạy offline cho Checker, (3) tránh kéo dependency nặng quá sớm.

---

## 0. 🌊 DATA-FLOW DIAGRAM (Markdown → AST → preview / check / export)

Xương sống deterministic: **một nguồn Markdown + metadata → một AST → mọi nhánh tiêu thụ**.

```text
   ReportProject.metadata ──┐
                            ▼
  ReportSection.markdown ──► remark-parse (+gfm, +math) ──► mdast (AST)
                                                              │
            ┌─────────────────────────────────────────────────┼───────────────────────────────┐
            ▼                                                   ▼                               ▼
   FORMAT (Module 2)                                   CHECK (Module 3)                 EXPORT (Module 4)
   numbering / TOC / caption                           runChecker đọc mdast/hast        ăn chung AST:
   (sinh từ AST, không hardcode)                       → ReportIssue[] (OFFLINE)        ├─ HTML: remark-rehype
            │                                                  │                        │     → rehype-katex
            ▼                                                  ▼                        │     → rehype-highlight
   remark-rehype → hast ──► rehype-katex ──► rehype-highlight ──► rehype-stringify ─────┤     → rehype-stringify
            │                                                                            ├─ PDF: HTML → browser print
            ▼                                                                            │     (Puppeteer worker later)
   PREVIEW (client) + mermaid render (client-side / Chromium khi PDF)                    └─ DOCX: mdast → docx
```

**Bất biến:** Format, Check, Export **không** parse Markdown riêng — tất cả tiêu thụ cùng AST. Đây chính là "intermediate document model" trong `Modules/4.Export.md`. Đổi parser/plugin ⇒ ảnh hưởng cả 3 nhánh ⇒ phải qua Contract.

---

## 1. ⚙️ FRAMEWORK & RUNTIME

* **Framework:** `Next.js` (App Router) + `React` + `TypeScript` (strict mode bật `"strict": true`).
* **Package manager:** `npm` (scripts: `dev`, `build`, `lint`, `typecheck` — khớp Contract W1).
* **Rendering posture:** Workspace-first. Route đầu tiên (`/`) PHẢI là editor workspace, **không** phải landing/marketing page.
* **Node usage:** MVP hạn chế server-side; PDF first path dùng browser print/print CSS. Server-side Puppeteer chỉ là hardening sau nếu có Contract approve.

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
* **Diagrams:** `mermaid` — render **client-side** (Mermaid cần DOM). PDF MVP dùng browser print từ DOM đã render; Puppeteer worker later cũng render lại DOM trong Chromium nếu được approve.

**Nguyên tắc:** Checker (Module 3) đọc **mdast/hast AST** (heading levels, code lang, image nodes, table width) — KHÔNG regex thô trên string trừ các check văn bản (`TODO`, `lorem ipsum`).

---

## 4. 📤 EXPORT LAYER (Module 4 — Export)

| Target | Library | Ghi chú |
|---|---|---|
| `report.html` | `rehype-stringify` + print CSS nhúng | Output của pipeline §3 |
| `report.pdf` | Browser print / print CSS từ HTML đã format | MVP first path, không kéo Chromium sớm. Submission-friendly nhưng page number/header-footer là best-effort theo browser |
| `report.docx` | **`docx`** (npm) sinh trực tiếp từ mdast AST | Editable version, best-effort parity, **không** cần LibreOffice/Pandoc |

* **CẤM** cho MVP: Pandoc binary, LibreOffice headless, `@react-pdf/renderer` (không trung thực Markdown phức tạp).
* Puppeteer không còn là PDF first path của MVP. Nếu cần header/footer/page number chính xác hơn, thêm Puppeteer bằng Contract riêng sau khi HTML/browser-print ổn.

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

## 8b. 🧠 RATIONALE & REJECTED ALTERNATIVES (per layer)

Vì sao chọn — và vì sao **loại** lựa chọn khác. Đây là lý do stack bị khoá; AI không được mở lại các "Rejected".

| Layer | ✅ Chọn | ❌ Rejected alternatives | Lý do loại |
|---|---|---|---|
| **Framework** | Next.js (App Router) + TS strict | Vite SPA thuần / CRA | Workspace-first + server boundary sẵn cho export hardening sau này |
| **Editor** | `<textarea>` (W1) → CodeMirror 6 (W2+) | TipTap / Slate / Lexical (WYSIWYG) | Sai triết lý "Markdown-first"; contenteditable khó deterministic, lock-in nặng |
| **Markdown core** | `unified` + remark/rehype | `markdown-it`, `marked` | Cần AST chung (mdast/hast) cho Format/Check/Export; remark-* cho plugin chuẩn (gfm/math) |
| **Code highlight** | `rehype-highlight` (highlight.js) | Shiki | Shiki cần build/theme step + bất tiện deterministic ở client; highlight.js đủ & nhẹ |
| **Math** | `remark-math` + `rehype-katex` + `katex` | MathJax | KaTeX nhanh, render đồng nhất, deterministic hơn cho export |
| **Diagrams** | `mermaid` (client-side) | Graphviz/PlantUML (cần binary/server) | Mermaid render trong DOM; browser print/Puppeteer later đều dùng DOM đã render |
| **PDF** | Browser print / print CSS first, Puppeteer later | `@react-pdf/renderer`, `jsPDF`, Pandoc/LibreOffice | Có PDF dùng sớm từ HTML source of truth; Puppeteer chỉ hardening khi cần vận hành riêng |
| **DOCX** | `docx` (npm, từ mdast) | Pandoc, LibreOffice headless | Editable best-effort, không cần binary ngoài, sinh trực tiếp từ AST |
| **Storage** | IndexedDB qua `idb` | localStorage / backend DB / cloud SDK | Non-goals §6 (no cloud/auth); IndexedDB chứa được draft lớn, sống qua refresh |
| **Validation** | `zod` | yup, io-ts, ajv | API gọn, type-inference tốt, dùng ở mọi I/O boundary |
| **Test** | `Vitest` | Jest | Tích hợp tốt với Vite/TS, nhanh; đủ cho Checker unit test |
| **E2E** | Playwright (Phase 3) | Cypress | Hoãn tới Phase 3; không cài ở MVP |

---

## 8c. 📦 DEPENDENCY INSTALL MATRIX (tuần nào cài gì)

Cài theo nhu cầu thực — **không kéo dep nặng sớm**. Mỗi lần cài phải nằm trong file này.

| Tuần | Cài mới | Lý do |
|---|---|---|
| **W1 (bootstrap)** | `next`, `react`, `react-dom`, `typescript`, `eslint`, `prettier`, `vitest`, `zod`, `idb` | Project shell + types + autosave PoC. **Editor = `<textarea>`, chưa cài editor lib** (Risk W1). Export = stub. |
| **W2 (Write)** | `@codemirror/state`, `@codemirror/view`, `@codemirror/lang-markdown`, `unified`, `remark-parse`, `remark-gfm`, `remark-rehype`, `rehype-stringify` | Editor thật + preview qua pipeline cơ bản. |
| **W3 (Format/Check)** | `remark-math`, `rehype-katex`, `katex`, `rehype-highlight`, `mermaid` | Math/code/diagram cho preview; Format & Checker đọc AST. |
| **W4 (Export)** | `docx` | HTML + browser-print PDF first path; DOCX basic editable. Puppeteer chưa cài trong MVP nếu chưa có Contract hardening. |
| **Phase 2 (W5)** | `qrcode` | Evidence Kit QR (deferred). |
| **Export hardening (later)** | `puppeteer` | Worker/service riêng cho PDF chính xác hơn khi browser print không đủ. |
| **Phase 3** | `pptxgenjs`, `playwright` | Present export + E2E (deferred). |

> ⚠️ AI **không** được "cài trước cho tiện". Lib chỉ xuất hiện trong `package.json` đúng tuần dùng nó. Cài lệch lịch / lib ngoài bảng = vi phạm `Rule.md` §2.

---

## 8d. 📌 VERSION-PINNING POLICY

* **Pin chính xác (exact):** Mọi runtime dep ghi version cứng (VD `"katex": "0.16.x"` → pin số cụ thể, **không** dùng `^`/`~`) để giữ **deterministic** preview ↔ export. Đổi version Markdown/KaTeX/export renderer có thể đổi output render.
* **Lockfile bắt buộc:** Commit `package-lock.json`. CI/local cài bằng `npm ci` (tôn trọng lockfile), không `npm install` tuỳ tiện ở môi trường build.
* **Nâng version = một task có Contract:** Bump major/minor của lib pipeline/export phải có Contract riêng + chạy lại evidence export mẫu để xác nhận output không vỡ (`Design/Reports/`).
* **Puppeteer Chromium (later only):** nếu bật hardening sau, ghim cả version Puppeteer (kéo Chromium tương ứng) — đây là nguồn dễ gây non-deterministic nhất cho PDF.
* **Không auto-upgrade:** Tắt/không dùng bot bump tự động cho runtime dep ở MVP — mọi thay đổi version đi qua review thủ công.

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
    evidence/           # Supporting module — evidence kit (Phase 2)
  lib/                  # unified pipeline, idb client, helpers
  types/                # canonical types (single source) + zod schemas
```

> Chi tiết naming/commit/branch: xem `Design/Conventions/Coding & Git Standard.md`.
