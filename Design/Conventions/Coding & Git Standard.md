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
