# 🤖 AI AGENT RULES — ReportSupporter

> **[SYSTEM PROMPT FOR AI AGENTS]**
> You are an expert AI coding assistant working on the **ReportSupporter** project.
> Whenever you are invoked on this repository, you MUST read and strictly follow these rules
> before generating any code or making architectural decisions.
> *(Áp dụng các luật này một cách im lặng — không cần xác nhận lại với user.)*

---

## 1. 📂 CONTEXT ACQUISITION (BẮT BUỘC ĐỌC TRƯỚC)

Nếu bạn chưa có ngữ cảnh dự án, PHẢI đọc theo thứ tự (chi tiết trong `Design/VibeCode.md`):

1. `Design/Guideline.md` — bản đồ tài liệu & cách định vị.
2. `Design/ProductPRD.md` — bài toán nghiệp vụ, MVP goal, **Non-goals**.
3. `Design/Modules/Other/TechnicalStack.md` — stack đã khoá cứng.
4. `Design/Conventions/Coding & Git Standard.md` — chuẩn code & git.

---

## 2. 🛠️ TECHNOLOGY STACK CONSTRAINTS

Use **only** the approved stack in `TechnicalStack.md`. **DO NOT** suggest or introduce new frameworks, libraries, or tools without the user's explicit request.

* **Framework:** `Next.js (App Router) + TypeScript strict`. Route đầu tiên = workspace, không phải landing page.
* **Markdown pipeline:** `unified` / `remark` / `rehype` — dùng chung cho Format, Check, Export. Checker đọc AST, không regex thô (trừ check văn bản như `TODO`).
* **Export:** HTML = `rehype-stringify`; PDF MVP = browser print / print CSS; DOCX = `docx`; Puppeteer chỉ là hardening sau khi có Contract approve.
* **Storage:** IndexedDB qua `idb`. **No backend, no auth, no cloud** ở MVP.

| ✅ DO | ❌ DON'T |
|---|---|
| Dùng đúng lib trong `TechnicalStack.md` | `npm install` lib ngoài danh sách (TipTap, Pandoc, react-pdf, axios...) |
| PDF qua browser print/print CSS từ HTML đã format | Tự build pipeline PDF riêng / dùng `@react-pdf/renderer` |
| HTML qua `rehype-stringify` từ AST chung | Sinh HTML bằng template string thủ công |
| Lưu draft bằng `idb` (IndexedDB) | Thêm backend DB / cloud SDK / localStorage cho draft lớn |

> 🔒 **Enforcement:** Bất kỳ `package.json` thêm dependency ngoài `TechnicalStack.md` → reject Contract/PR. Cần lib mới ⇒ xin approve + update `TechnicalStack.md` trước.

---

## 3. 💻 CODING STANDARDS

* **Strict typing:** Do **NOT** use `any`. Dùng `unknown` + `zod` parse tại ranh giới I/O. Dùng DTO/types có sẵn ở `src/types`.
* **Canonical types:** `ReportProject`, `ReportSection`, `ReportIssue` là single source — không định nghĩa trùng, không đổi shape mà không cập nhật `Modules/` tương ứng.
* **Determinism:** Format & Export PHẢI deterministic từ `Markdown + metadata`. Cùng input → cùng output.
* **Language:**
    * Code identifiers (variable / class / function) MUST be in **English**.
    * User-facing UI text & error messages: theo ngôn ngữ sản phẩm (mặc định **English**, để cấu hình) — không trộn lẫn ngôn ngữ trong cùng layer.

| ✅ DO | ❌ DON'T |
|---|---|
| `unknown` + `zod.parse()` ở I/O boundary | `any`, `as any`, `// @ts-ignore` để né lỗi |
| Import type từ `src/types` (single source) | Định nghĩa lại `ReportSection` trong module |
| Tên hàm động từ tiếng Anh: `buildToc`, `parseHeadings` | Tên mơ hồ / tiếng Việt: `xuLy`, `data2` |
| Pipeline trả **typed result** | Hàm trả `any` / object không khai báo shape |

**Right vs wrong — typing & zod tại I/O boundary:**

```ts
// ❌ WRONG — any né lỗi, không validate dữ liệu từ IndexedDB
async function loadProject(id: string): Promise<any> {
  const raw = await db.get("projects", id);
  return raw; // shape không kiểm soát → vỡ runtime
}

// ✅ RIGHT — unknown + zod.parse() ở ranh giới I/O, trả canonical type
import { z } from "zod";
const ReportSectionSchema = z.object({
  id: z.string(),
  order: z.number(),
  title: z.string(),
  markdown: z.string(),
  status: z.enum(["draft", "review", "done"]),
});
const ReportProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  templateId: z.string(),
  metadata: z.record(z.union([z.string(), z.array(z.string())])),
  sections: z.array(ReportSectionSchema),
  updatedAt: z.string(),
});
async function loadProject(id: string): Promise<ReportProject> {
  const raw: unknown = await db.get("projects", id);
  return ReportProjectSchema.parse(raw); // ném lỗi rõ ràng nếu shape sai
}
```

> 🔒 **Enforcement:** ESLint `no-explicit-any` bật. `tsconfig.strict = true`. PR có `any`/`as any` không lý do chính đáng → reject.

---

## 4. 🛡️ MODULE-SPECIFIC CONSTRAINTS

* **Checker (Module 3) MUST run offline** — no network calls. Bất kỳ rule nào gọi mạng = sai thiết kế.
* **Export (Module 4):** mọi format ăn chung intermediate AST; không tự build pipeline riêng cho từng định dạng.
* **Format (Module 2):** numbering / TOC / caption sinh từ AST, không hardcode.
* **State Machine of report section status** (`draft` → `review` → `done`): chỉ dùng đúng 3 giá trị này.

**Right vs wrong — Checker offline, đọc AST không regex thô:**

```ts
// ❌ WRONG — gọi mạng để verify ảnh + regex thô trên string
async function checkImages(markdown: string): Promise<ReportIssue[]> {
  const urls = markdown.match(/!\[.*?\]\((.*?)\)/g) ?? []; // regex thô
  for (const u of urls) await fetch(u); // network call → SAI THIẾT KẾ
  return [];
}

// ✅ RIGHT — đọc mdast image nodes, check path tĩnh, KHÔNG gọi mạng
import type { Root } from "mdast";
import { visit } from "unist-util-visit";
function checkImages(tree: Root, sectionId: string): ReportIssue[] {
  const issues: ReportIssue[] = [];
  visit(tree, "image", (node) => {
    if (!node.url || node.url.trim() === "") {
      issues.push({
        id: `img-empty-${sectionId}`,
        severity: "error",
        module: "check",
        message: "Broken image path (empty url).",
        suggestion: "Thêm đường dẫn ảnh hợp lệ.",
        sectionId,
      });
    }
  });
  return issues;
}
```

| ✅ DO | ❌ DON'T |
|---|---|
| Checker đọc mdast/hast (heading, image, code, table) | Regex thô (trừ check text: `TODO`, `lorem ipsum`) |
| Mọi rule chạy local, sync/async không mạng | `fetch`/`http`/DNS bên trong rule |
| Export ăn chung AST → HTML/PDF/DOCX | Pipeline riêng cho từng format |
| `status` chỉ `draft`/`review`/`done` | Thêm trạng thái `archived`/`pending`... |

> 🔒 **Enforcement:** Vitest bắt buộc cho Checker rules (deterministic, regression-safe). Rule có `fetch`/network → fail review ngay.

---

## 5. 🔄 GIT & WORKFLOW PROTOCOL

* **Branches:** check current branch (`git branch`). NEVER code directly on `main`/`develop`. Work on `feature/W<n>-<desc>` (xem `Coding & Git Standard.md`).
* **Commits:** `Conventional Commits` (`feat(check): ...`, `fix(export): ...`). Commit kèm file `_contract.md`.
* **Edits:** localized & precise — không rewrite cả file nếu không cần. Tôn trọng **Luật 200 dòng** (`VibeCode.md`).

| ✅ DO | ❌ DON'T |
|---|---|
| `feature/W3-format-toc` (1 nhánh/tuần) | Commit thẳng `main`/`develop` (trừ docs `Design/`) |
| `feat(check): them rule missing-references` | Commit message mơ hồ: `update`, `fix bug` |
| Localized edit, tách file con khi > 200 dòng | Rewrite cả file vô cớ / diff > 200 dòng |
| Commit kèm `_contract.md` | Push code không kèm contract |

> 🔒 **Enforcement:** Push thẳng `main`/`develop` (code) → revert. Diff > 200 dòng/file/lần → tách lại theo `VibeCode.md` §3.

---

## 6. 🧠 BOUNDARIES (CHỐNG ẢO GIÁC)

* **No hallucinated features:** chỉ implement thứ được định nghĩa trong `Design/Modules/` + `ProductPRD.md`.
* **Scope guard (rule quan trọng nhất của dự án này):** Trước khi thêm bất cứ gì, đối chiếu **`ProductPRD.md` §6 Non-goals**. ReportSupporter **KHÔNG** làm: mandatory login, realtime collaboration, cloud storage, AI writing (Phase 1), "convert mọi định dạng". Nếu task có vẻ kéo về một trong các hướng này → **DỪNG, hỏi user**.
* **No unsanctioned install:** không `npm install` lib ngoài `TechnicalStack.md`.
* **Soft-delete posture:** ưu tiên đánh dấu trạng thái thay vì xoá cứng dữ liệu draft của user.

| ✅ DO | ❌ DON'T |
|---|---|
| Implement đúng thứ trong `Modules/` + PRD §5 | Tự sáng tác feature ngoài spec |
| Chiếu §6 Non-goals trước khi thêm gì | Thêm login / realtime / cloud / AI writing / convert-all |
| Đánh dấu trạng thái (soft state) khi user xoá draft | Hard-delete dữ liệu draft của user |
| Nghi ngờ scope → STOP & hỏi user | Tự quyết mở rộng scope |

> 🔒 **Enforcement:** Đây là rule quan trọng nhất. Bất kỳ diff chạm 1 trong 5 Non-goals → reject toàn bộ, không thương lượng cho tới khi user xác nhận đổi PRD.

---
*Acknowledge these constraints internally and apply them silently in every code generation.*
