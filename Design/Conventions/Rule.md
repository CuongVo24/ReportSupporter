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
* **Export:** PDF = `puppeteer` (server-side, **stub tới W4**); DOCX = `docx`; HTML = `rehype-stringify`.
* **Storage:** IndexedDB qua `idb`. **No backend, no auth, no cloud** ở MVP.

---

## 3. 💻 CODING STANDARDS

* **Strict typing:** Do **NOT** use `any`. Dùng `unknown` + `zod` parse tại ranh giới I/O. Dùng DTO/types có sẵn ở `src/types`.
* **Canonical types:** `ReportProject`, `ReportSection`, `ReportIssue` là single source — không định nghĩa trùng, không đổi shape mà không cập nhật `Modules/` tương ứng.
* **Determinism:** Format & Export PHẢI deterministic từ `Markdown + metadata`. Cùng input → cùng output.
* **Language:**
    * Code identifiers (variable / class / function) MUST be in **English**.
    * User-facing UI text & error messages: theo ngôn ngữ sản phẩm (mặc định **English**, để cấu hình) — không trộn lẫn ngôn ngữ trong cùng layer.

---

## 4. 🛡️ MODULE-SPECIFIC CONSTRAINTS

* **Checker (Module 3) MUST run offline** — no network calls. Bất kỳ rule nào gọi mạng = sai thiết kế.
* **Export (Module 4):** mọi format ăn chung intermediate AST; không tự build pipeline riêng cho từng định dạng.
* **Format (Module 2):** numbering / TOC / caption sinh từ AST, không hardcode.
* **State Machine of report section status** (`draft` → `review` → `done`): chỉ dùng đúng 3 giá trị này.

---

## 5. 🔄 GIT & WORKFLOW PROTOCOL

* **Branches:** check current branch (`git branch`). NEVER code directly on `main`/`develop`. Work on `feature/W<n>-<desc>` (xem `Coding & Git Standard.md`).
* **Commits:** `Conventional Commits` (`feat(check): ...`, `fix(export): ...`). Commit kèm file `_contract.md`.
* **Edits:** localized & precise — không rewrite cả file nếu không cần. Tôn trọng **Luật 200 dòng** (`VibeCode.md`).

---

## 6. 🧠 BOUNDARIES (CHỐNG ẢO GIÁC)

* **No hallucinated features:** chỉ implement thứ được định nghĩa trong `Design/Modules/` + `ProductPRD.md`.
* **Scope guard (rule quan trọng nhất của dự án này):** Trước khi thêm bất cứ gì, đối chiếu **`ProductPRD.md` §6 Non-goals**. ReportSupporter **KHÔNG** làm: mandatory login, realtime collaboration, cloud storage, AI writing (Phase 1), "convert mọi định dạng". Nếu task có vẻ kéo về một trong các hướng này → **DỪNG, hỏi user**.
* **No unsanctioned install:** không `npm install` lib ngoài `TechnicalStack.md`.
* **Soft-delete posture:** ưu tiên đánh dấu trạng thái thay vì xoá cứng dữ liệu draft của user.

---
*Acknowledge these constraints internally and apply them silently in every code generation.*
