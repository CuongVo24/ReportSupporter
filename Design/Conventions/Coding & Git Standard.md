# 📐 CODING & GIT STANDARD — ReportSupporter (V1.0)

> Chuẩn code + Git cho dự án. AI và người đều phải tuân thủ. Nguồn stack: `Design/Modules/Other/TechnicalStack.md`.

---

## 1. 🔤 NAMING CONVENTIONS

| Loại | Convention | Ví dụ |
|---|---|---|
| Type / Interface / Class | `PascalCase` | `ReportProject`, `ReportIssue` |
| Variable / function | `camelCase` | `parseHeadings`, `draftKey` |
| React component file | `PascalCase.tsx` | `EditorPanel.tsx` |
| Non-component file | `kebab-case.ts` | `markdown-pipeline.ts`, `idb-client.ts` |
| Constant | `UPPER_SNAKE_CASE` | `DEFAULT_TEMPLATE_ID` |
| Folder | `kebab-case` / module name | `modules/check` |

* Code identifiers = **English** only (xem `Rule.md` §3).
* Tên phải mô tả ý nghĩa nghiệp vụ, không viết tắt mơ hồ.

### 🔤 More naming examples (ReportSupporter domain)

| Loại | ✅ Tốt | ❌ Tránh | Vì sao |
|---|---|---|---|
| Function (động từ) | `buildToc`, `parseHeadings`, `numberSections`, `runChecker`, `exportPdf` | `toc`, `headingStuff`, `doIt`, `handle2` | Bắt đầu bằng động từ, mô tả hành động |
| Boolean | `hasConclusion`, `isOffline`, `shouldNumber` | `conclusion`, `flag`, `check` | Tiền tố `is/has/should` |
| Checker rule id | `missing-references`, `skipped-heading-level`, `code-block-no-lang` | `rule1`, `checkRefs` | kebab, mô tả lỗi (khớp `ReportIssue.id` prefix) |
| Type | `ReportSection`, `TocEntry`, `TemplateSchema`, `CheckerRule` | `Section2`, `Data`, `Obj` | PascalCase, danh từ nghiệp vụ |
| Component | `EditorPanel.tsx`, `PreviewPane.tsx`, `IssueList.tsx`, `TemplatePicker.tsx` | `comp.tsx`, `Panel1.tsx` | PascalCase.tsx, mô tả UI |
| Non-component lib | `markdown-pipeline.ts`, `idb-client.ts`, `toc-normalize.ts` | `utils.ts` (chung chung), `helper.ts` | kebab, một trách nhiệm rõ |
| Constant | `DEFAULT_TEMPLATE_ID`, `A4_WIDTH_MM`, `DRAFT_STORE_NAME` | `defaultId`, `width` | UPPER_SNAKE cho hằng cấu hình |

---

## 2. 🗂️ SOURCE STRUCTURE (1 Module ↔ 1 thư mục)

```text
src/
  app/                  # Next.js App Router — route đầu tiên = workspace
  components/           # UI dùng chung
  modules/
    write/   format/   check/   export/
  lib/                  # unified pipeline, idb client, helpers
  types/                # canonical types + zod schemas (SINGLE SOURCE)
```

* **Canonical types** sống ở `src/types` và **chỉ định nghĩa một lần**. `ReportProject`, `ReportSection`, `ReportIssue` phải khớp shape trong `ProductPRD.md` / `Modules/` / Contract W1. Đổi shape → cập nhật cả `.md` tương ứng (Single Source of Truth).
* Mỗi module export qua một `index.ts` rõ ràng; không import chéo vào nội bộ module khác (chỉ qua public surface).

### 🌲 Sample folder tree (đầy đủ file — đích nhắm)

```text
src/
  app/
    layout.tsx               # root layout (workspace-first, no marketing hero)
    page.tsx                 # route "/" = workspace editor
    api/
      export/pdf/route.ts    # server route Puppeteer (stub tới W4)
  components/
    EditorPanel.tsx
    PreviewPane.tsx
    IssueList.tsx
    TemplatePicker.tsx
  modules/
    write/
      index.ts               # public surface: { Editor, useAutosave }
      editor.ts
      autosave.ts            # idb draft autosave
      template-seed.ts       # software project template seed
    format/
      index.ts               # public surface: { numberSections, buildToc, buildCaptions }
      numbering.ts
      toc.ts
      toc-extract.ts
      toc-normalize.ts
      captions.ts
    check/
      index.ts               # public surface: { runChecker, rules }
      checker.ts             # orchestrator: chạy mọi rule, gộp ReportIssue[]
      rules/
        missing-references.ts
        skipped-heading-level.ts
        code-block-no-lang.ts
        missing-captions.ts
      checker.test.ts        # Vitest (bắt buộc cho Module 3)
    export/
      index.ts               # public surface: { exportHtml, exportPdf, exportDocx }
      export-html.ts         # rehype-stringify + print CSS
      export-pdf.ts          # gọi /api/export/pdf (Puppeteer) — stub tới W4
      export-docx.ts         # docx từ mdast
  lib/
    markdown-pipeline.ts     # unified: remark-parse + gfm + math + rehype-katex + highlight
    idb-client.ts            # idb wrapper (stores: projects, drafts)
    mermaid-render.ts        # client-side mermaid
  types/
    report.ts                # ReportProject, ReportSection, ReportIssue (SINGLE SOURCE)
    template.ts              # TemplateSchema + zod
    schemas.ts               # zod schemas dùng ở I/O boundary
```

---

## 3. 🧱 LUẬT 200 DÒNG (cross-ref `VibeCode.md` §3)

* Không thêm/sửa/ghi đè **quá 200 dòng trên 1 file / 1 lần**. Vượt ngưỡng → tách file con, code từng nhánh ~100 dòng → test → mở dải tiếp.
* Ưu tiên **localized edits**, không rewrite cả file khi không cần.

---

## 4. 🔒 TYPING & VALIDATION

* `tsconfig` bật `strict: true`. **Cấm `any`** — dùng `unknown` + `zod`.
* Mọi dữ liệu vào từ IndexedDB / template JSON / form metadata phải qua `zod.parse()` trước khi dùng.
* Không ép kiểu (`as`) để né lỗi type — sửa type cho đúng.

---

## 4b. 🚧 IMPORT-BOUNDARY RULES (giữa các module)

Mỗi module là một "hộp đen" — chỉ giao tiếp qua `index.ts` public surface.

| ✅ DO | ❌ DON'T |
|---|---|
| `import { runChecker } from "@/modules/check"` | `import { rules } from "@/modules/check/rules/missing-references"` (chọc nội bộ) |
| `import type { ReportSection } from "@/types/report"` | Định nghĩa lại `ReportSection` trong module |
| Module dùng chung helper qua `@/lib/...` | Format `import` thẳng file private của Check |
| `app/` & `components/` gọi module qua public surface | Vòng phụ thuộc 2 chiều (check ⇄ format) |

**Luồng phụ thuộc cho phép (một chiều):**

```text
app / components
      │
      ▼
   modules/{write,format,check,export}   ──► lib (pipeline, idb)
      │                                       │
      └───────────────► types ◄───────────────┘
   (mọi module/lib đều phụ thuộc types; types KHÔNG phụ thuộc ngược)
```

> Quy tắc: `types` là tầng thấp nhất (không import ai). `lib` chỉ phụ thuộc `types`. `modules` phụ thuộc `lib` + `types`. `app`/`components` phụ thuộc `modules` qua `index.ts`. **Không cycle.**

---

## 5. 🌿 GIT FLOW & BRANCHES

Branching: tẽ từ `develop` → làm → gộp `develop` → (self-QC) → gộp `main`.

* **Feature branch:** `feature/W<tuần>-<mô-tả-ngắn>` — ví dụ `feature/W2-markdown-editor`.
* **Fix branch:** `fix/<mô-tả>`.
* **NEVER** commit thẳng vào `main`/`develop` (trừ tài liệu `Design/` dùng chung).
* Một feature branch cho cả tuần — không tạo nhánh mới mỗi micro-task.

---

## 6. ✅ COMMIT CONVENTION (Conventional Commits)

```text
<type>(<scope>): <mô tả ngắn>
```

* **type:** `feat` · `fix` · `refactor` · `docs` · `test` · `chore`.
* **scope:** module/area — `write` · `format` · `check` · `export` · `editor` · `storage`.
* Ví dụ: `feat(check): them rule missing-references`, `fix(export): sua page-break PDF`.
* **Commit kèm `_contract.md`** của nhóm micro-task để lưu vết quyết định thiết kế.

### 📜 Sample commit history (một tuần W3 — Format)

```text
feat(format): them heading numbering tu mdast        # task #1
docs(format): commit w3_heading_numbering_contract   # contract kèm theo
feat(format): them TOC generator (toc + extract)     # task #2 file con 1
feat(format): them toc-normalize danh so 1/1.1/1.1.1 # task #2 file con 2
docs(format): commit w3_toc_contract
feat(format): them figure/table caption tu AST       # task #3
fix(format): sua caption dem trung khi co 2 bang     # bugfix trong tuần
docs(format): commit w3_caption_contract
chore(format): export public surface qua index.ts    # gom public API
```

> Mỗi feature đi kèm một `docs(...)` commit chứa `_contract.md`. Một nhánh `feature/W3-format` cho cả tuần. Cuối tuần PR vào `develop` (cân nhắc squash để log sạch).

---

## 6b. 🔍 PR SELF-REVIEW TEMPLATE

Solo không có Buddy review — dán template này vào mô tả PR và tự tích trước khi merge vào `develop`.

```markdown
## PR: feature/W<n>-<desc> → develop

### What
- <1–3 dòng: nhóm micro-task nào, Module nào>

### Contract(s)
- [ ] Đã commit kèm `_contract.md` tương ứng

### 3S Self Gate
- [ ] Structure: naming/typing chuẩn, không `any`, diff ≤200 dòng/file, import qua index.ts
- [ ] Scope: khớp Task Brief, KHÔNG chạm §6 Non-goals, không lib ngoài stack
- [ ] Safety: lint ✓ / typecheck ✓ / build ✓ / Vitest ✓ (nếu đụng Checker)

### Determinism (nếu đụng Format/Export)
- [ ] Cùng Markdown + metadata → output không đổi

### Single Source of Truth
- [ ] Đã update `.md` liên quan nếu logic đổi

### Evidence
- [ ] Đã ghi `Design/Reports/Month<X>/W<N>/` (nếu cần)
```

---

## 6c. 🧯 ERROR-HANDLING PATTERNS

Quy ước xử lý lỗi theo từng layer — lỗi phải **visible & recoverable**, không nuốt im lặng.

| Layer | Pattern | Ghi chú |
|---|---|---|
| **I/O boundary** (IndexedDB, template JSON, form) | `unknown` + `zod.parse()` → ném `ZodError` rõ ràng | Không `try/catch` nuốt; để lỗi nổi lên với message cụ thể |
| **Pipeline** (parse/format) | Trả typed result; lỗi cú pháp Markdown → thu thành `ReportIssue` info/warning | Không crash editor vì 1 lỗi nhỏ |
| **Checker** (Module 3) | Mỗi rule trả `ReportIssue[]`; rule lỗi nội bộ → log + bỏ qua rule đó, không sập cả checker | Offline, deterministic |
| **Export** (Module 4) | Lỗi export PHẢI surface cho user (toast/issue) + recoverable | Acceptance `Modules/4.Export.md` — không nuốt exception |

**Right vs wrong — export error visible & recoverable:**

```ts
// ❌ WRONG — nuốt exception, user không biết vì sao không có file
async function exportPdf(project: ReportProject): Promise<Blob | null> {
  try {
    return await renderPdf(project);
  } catch {
    return null; // im lặng → user tưởng treo
  }
}

// ✅ RIGHT — lỗi visible (typed) & recoverable
type ExportResult =
  | { ok: true; blob: Blob }
  | { ok: false; issue: ReportIssue };

async function exportPdf(project: ReportProject): Promise<ExportResult> {
  try {
    const blob = await renderPdf(project);
    return { ok: true, blob };
  } catch (err) {
    return {
      ok: false,
      issue: {
        id: "export-pdf-failed",
        severity: "error",
        module: "export",
        message: "PDF export failed.",
        suggestion: "Kiểm tra Mermaid/ảnh lỗi rồi thử lại.",
      },
    };
  }
}
```

---

## 7. 🔁 API / RETURN SHAPE (deterministic & typed)

* Mọi hàm pipeline (parse / format / check / export) trả về **typed result**, không trả `any`.
* Checker trả mảng `ReportIssue[]` đúng shape:
    ```ts
    type ReportIssue = {
      id: string;
      severity: "error" | "warning" | "info";
      module: "write" | "format" | "check" | "export";
      message: string;
      suggestion: string;
      sectionId?: string;
      line?: number;
    };
    ```
* Lỗi export phải **visible & recoverable** (Acceptance `Modules/4.Export.md`) — không nuốt exception.

---

## 8. 🧹 LINT / FORMAT / TEST GATE (trước khi push)

1. `npm run lint` — ESLint không lỗi đỏ.
2. `npm run typecheck` — không lỗi type.
3. `npm run build` — build xanh.
4. `Vitest` xanh cho Checker rules (khi đụng Module 3).

> Quy trình push đầy đủ + self quality gate: xem `Design/Conventions/WorkFlow.md`.
