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

**🔒 Bảo mật:** nhánh HTML (preview + export) chèn `rehype-sanitize` ngay sau `remark-rehype` (trước katex/highlight). Mọi HTML đẩy vào DOM phải là output đã sanitize — xem `Modules/Other/Security.md`.

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

## 2b. 🧩 UI COMPONENT LAYER (Frontend primitives — Phase 4 / W13)

> Tầng UI primitive tái dùng, thuộc discipline `Design/Frontend/`. Khoá lựa chọn để mọi component dựng nhất quán, đẹp **theo mạch** thay vì sửa giao diện cuối kỳ. *Vì sao đẹp:* `Design/Frontend/0.ArtDirection.md`.

* **Headless interactive primitives:** **Radix UI** — `@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-toast`, `@radix-ui/react-select`.
    * *Lý do:* Radix lo sẵn **focus-trap, keyboard nav, ARIA role/label, scroll-lock, typeahead** — đúng những thứ a11y gate yêu cầu (axe tự động hoá ở **W15** → 0 critical; W12–W14 là checklist thủ công). Headless = **không** style mặc định → ta style 100% bằng token `--rs-*`, không xung đột.
* **Component thường** (Button / Input / Textarea / Badge): **tự code** + token, không cần lib.
* **Icon:** **Lucide** (`lucide-react`) — line, stroke đồng nhất, tree-shake theo từng icon, màu kế thừa `currentColor`. Xem `Design/Frontend/Other/Icons.md`.
* **Styling:** CSS **co-located** mỗi component (`Button.tsx` + `Button.css`) + CSS custom properties `--rs-*`. **KHÔNG** Tailwind, **KHÔNG** CSS-in-JS (runtime), giữ token là single source thị giác (`DesignSystem_Tokens.md`).
* **Vị trí:** primitive mới ở `src/components/ui/` (xem §9); panel cũ refactor dùng dần.
* **CẤM:** UI kit nặng có sẵn style (MUI, Ant Design, Chakra, Mantine) — đè token, kéo runtime lớn, sai gu "công cụ vô hình" (`0.ArtDirection.md` §6 anti-patterns). Animation library (Framer Motion…) — micro-interaction bằng CSS thuần (`Frontend/Other/Motion.md`).

---

## 3. 📄 MARKDOWN PIPELINE (dùng chung cho Format · Check · Export)

> Đây là **xương sống deterministic**. Cùng một input Markdown + metadata → cùng một AST → preview, checker, và export đều ăn chung nguồn. Chi tiết các type và cơ chế cache/thread xem tại [PipelineContract.md](file:///e:/ReportSupporter/Design/Modules/Other/PipelineContract.md).

* **Core:** `unified`
* **Parse:** `remark-parse` + `remark-gfm` (bảng, task list, strikethrough)
* **Math (LaTeX):** `remark-math` → `rehype-katex` + `katex`
* **Code highlight:** `rehype-highlight` (highlight.js — deterministic, không cần build step như Shiki)
* **Markdown → HTML:** `remark-rehype` → `rehype-sanitize` → `rehype-stringify`
* **🔒 Sanitize (bảo mật):** `rehype-sanitize` chèn ngay sau `remark-rehype`, **trước** katex/highlight (để markup katex/highlight là trusted). Raw HTML bị bỏ mặc định — **không** `allowDangerousHtml`, **không** `rehype-raw`. Threat model + schema mở rộng (giữ class `math-*`/`language-*`, chặn `javascript:` URI): [Security.md](file:///e:/ReportSupporter/Design/Modules/Other/Security.md).
* **Diagrams:** `mermaid` — render **client-side** (Mermaid cần DOM). PDF MVP dùng browser print từ DOM đã render; Puppeteer worker later cũng render lại DOM trong Chromium nếu được approve.

**Pipeline Contract Types:**
- `ParsedSection`: Cấu trúc AST (mdast) và metadata của một section đơn lẻ.
- `PipelineResult`: Kết quả gộp tất cả các `ParsedSection` thành một AST chung của toàn bộ document.
- `FormattedReport`: AST (cả mdast và hast) kèm theo TOC, figure/table captions và preset đã được Module 2 xử lý.

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
| **Sanitize HTML** | `rehype-sanitize` (schema mở rộng) | Không sanitize / `DOMPurify` riêng | Cùng hệ unified/hast, chèn thẳng pipeline; tránh kéo runtime DOM lib ngoài; raw HTML bỏ mặc định (`Security.md`) |
| **Code highlight** | `rehype-highlight` (highlight.js) | Shiki | Shiki cần build/theme step + bất tiện deterministic ở client; highlight.js đủ & nhẹ |
| **Math** | `remark-math` + `rehype-katex` + `katex` | MathJax | KaTeX nhanh, render đồng nhất, deterministic hơn cho export |
| **Diagrams** | `mermaid` (client-side) | Graphviz/PlantUML (cần binary/server) | Mermaid render trong DOM; browser print/Puppeteer later đều dùng DOM đã render |
| **PDF** | Browser print / print CSS first, Puppeteer later | `@react-pdf/renderer`, `jsPDF`, Pandoc/LibreOffice | Có PDF dùng sớm từ HTML source of truth; Puppeteer chỉ hardening khi cần vận hành riêng |
| **DOCX** | `docx` (npm, từ mdast) | Pandoc, LibreOffice headless | Editable best-effort, không cần binary ngoài, sinh trực tiếp từ AST |
| **Storage** | IndexedDB qua `idb` | localStorage / backend DB / cloud SDK | Non-goals §6 (no cloud/auth); IndexedDB chứa được draft lớn, sống qua refresh |
| **Validation** | `zod` | yup, io-ts, ajv | API gọn, type-inference tốt, dùng ở mọi I/O boundary |
| **Test** | `Vitest` | Jest | Tích hợp tốt với Vite/TS, nhanh; đủ cho Checker unit test |
| **E2E** | Playwright (Phase 3) | Cypress | Hoãn tới Phase 3; không cài ở MVP |
| **UI primitives (interactive)** | **Radix UI** (headless) | MUI / Ant Design / Chakra / Mantine | Headless → style 100% bằng token, không đè; lo sẵn a11y (focus-trap/keyboard/ARIA) đúng W12 gate; UI kit có style đè token + runtime nặng + sai gu "công cụ vô hình" |
| **Icon** | **Lucide** (`lucide-react`) | react-icons / Heroicons / FontAwesome | Một bộ line nhất quán, tree-shake từng icon, `currentColor` hợp token |
| **UI styling** | CSS co-located + `--rs-*` tokens | Tailwind / styled-components / Emotion | Token là single source thị giác (`DesignSystem_Tokens.md`); tránh runtime CSS-in-JS + utility-class drift |
| **Motion** | CSS thuần (transition) | Framer Motion / GSAP | Micro-interaction ≤200ms đủ bằng CSS; tránh runtime animation lib (`Frontend/Other/Motion.md`) |

---

## 8c. 📦 DEPENDENCY INSTALL MATRIX (tuần nào cài gì)

Cài theo nhu cầu thực — **không kéo dep nặng sớm**. Mỗi lần cài phải nằm trong file này.

| Tuần | Cài mới | Lý do |
|---|---|---|
| **W1 (bootstrap)** | `next`, `react`, `react-dom`, `typescript`, `eslint`, `prettier`, `vitest`, `zod`, `idb` | Project shell + types + autosave PoC. **Editor = `<textarea>`, chưa cài editor lib** (Risk W1). Export = stub. |
| **W2 (Write)** | `@codemirror/state`, `@codemirror/view`, `@codemirror/lang-markdown`, `unified`, `remark-parse`, `remark-gfm`, `remark-math`, `remark-rehype`, `rehype-sanitize`, `rehype-katex`, `rehype-highlight`, `rehype-stringify`, `katex`, `mermaid` | Editor thật + live preview đầy đủ (GFM + math KaTeX + code highlight + Mermaid client-side). `rehype-sanitize` chèn ngay sau `remark-rehype` (`Security.md`). Quyết định review-agreed (w2 §Locked): kéo math/highlight/mermaid vào W2 để preview "real" ngay, khớp `RoadMap/week_1-2-3-4/week2.md`. |
| **W3 (Format/Check)** | *(không cài lib mới — pipeline đã đủ ở W2)* | Format (numbering/TOC/caption) & Checker engine đọc AST từ pipeline W2; không thêm dependency. |
| **W4 (Export)** | `docx` | HTML + browser-print PDF first path; DOCX basic editable. Puppeteer chưa cài trong MVP nếu chưa có Contract hardening. |
| **Phase 2 (W5)** | `qrcode` | Evidence Kit QR (deferred). |
| **W8 (Submission)** | `jszip` | Đóng gói bộ nộp bài thành file zip chứa các file xuất bản và phụ lục minh chứng |
| **Export hardening (later)** | `puppeteer` | Worker/service riêng cho PDF chính xác hơn khi browser print không đủ. |
| **Phase 3** | `pptxgenjs`, `playwright` | Present export + E2E (deferred). |
| **W13 (Phase 4 — UI Foundation)** | `@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-toast`, `@radix-ui/react-select`, `lucide-react` | Bộ UI primitive (`src/components/ui/`) + icon, theo `Design/Frontend/2.Components/*`. Exact pin; chạy `npm install --save-exact` để đồng bộ lockfile. |
| **W14 (Phase 4 — UI Adoption)** | *(không cài lib mới)* | Refactor panel/flow dùng primitive W13 + patterns (empty/loading/error). Không thêm dependency. |
| **W15 (Phase 4 — UI Hardening)** | `axe-core` (+ `vitest-axe`) — **devDependency** | A11y automation chạy trong **Vitest + jsdom** (không Playwright — vẫn deferred). Exact pin; `npm install --save-exact`. **Không** runtime dep; axe không vào bundle. |

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
    ui/                 # UI primitives (Phase 4): Button, Input, Select, Textarea, Badge, Dialog, Tabs, Toast — co-located .tsx + .css, style bằng token (Design/Frontend/2.Components/)
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
