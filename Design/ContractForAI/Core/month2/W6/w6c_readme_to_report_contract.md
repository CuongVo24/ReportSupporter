# Contract For AI - W6 Group C: README-to-Report Template

> **Lane / Week:** Core / Month 2 / W6 - Day 3 (`Design/TaskBrief/Core/month2/w6.md` `[C70]`-`[C71]`).
> **Branch:** `feature/W6-advanced-templates`.
> **Builds on:** Group A (registry), W2 `unified`/mdast parser (`@/lib/markdown-pipeline`), `TemplateSchema`, `ReportSection` (`@/types`).
> **Depended on by:** Group E (checker đối chiếu required sections), W8 (đóng gói báo cáo).
> **Sources:** `w6.md` Locked Decisions #1/#4, `week6.md` Day 3, `ProductPRD.md §2` (target user "turn README into report"), `ProductPRD.md §6` (no AI / offline).

---

## 1. Micro-task Target

Cho người dùng biến **README.md** của dự án thành khung báo cáo: một `TemplateSchema` cho report-from-README + hàm `importReadme` map heading mdast → các `ReportSection` một cách **deterministic** (không AI, không mạng).

> **🔒 Mapping deterministic, không AI (Locked #4).** `importReadme` parse mdast bằng pipeline W2 và map heading → section theo luật cố định. Không gọi model, không fetch, không bịa nội dung.
> **🔒 Chỉ README/Markdown (Locked #1, Non-goal).** Đầu vào là chuỗi Markdown README; không convert PDF/Docx/HTML hay định dạng khác.
> **📌 Preview path thực tế.** Preview là `src/components/PreviewPane.tsx` (không phải `PreviewPanel.tsx`).

## 2. Scope

### In scope (`[C70]`/`[C71]`)
- `src/modules/write/templates/readme-report.ts`: `export const readmeReportTemplate: TemplateSchema` — khung report khi dựng từ README; `requiredSections` tối thiểu; đăng ký vào `ALL_TEMPLATES`.
- `src/modules/write/readme-import.ts`: `export function importReadme(markdown: string): ReportSection[]` — parse mdast (W2 `parseMarkdown`), gom nội dung theo heading cấp 1/2 thành `ReportSection` (title từ heading, `starterMarkdown` là nội dung dưới heading, `order` tăng dần, `status:"draft"`); nội dung trước heading đầu / không khớp → bucket "Mở đầu" có kiểm soát. Offline, no AI, deterministic.
- `src/modules/write/index.ts` (MODIFY): export `importReadme`, `readmeReportTemplate` (qua registry/public surface).
- Wiring nhập README vào initializer (đường tạo project từ README → `ReportSection[]`); preview qua `PreviewPane`.
- Vitest: `readme-import.test.ts` — README nhiều heading → đúng số/ tiêu đề section; nội dung trước heading đầu vào bucket; README rỗng → mảng rỗng/ 1 bucket; cùng input → cùng output (deterministic); **không** gọi mạng/AI.

### Out of scope
- ❌ Convert định dạng ngoài README/Markdown (Non-goal).
- ❌ AI sinh nội dung (→ W11 optional).
- ❌ Section block member/timeline (Group D).
- ❌ Sửa rule checker (Group E).
- ❌ Dep mới (dùng pipeline W2).

## 3. Checklist
- [ ] `readme-report.ts`: `TemplateSchema` + đăng ký registry.
- [ ] `importReadme` map heading mdast → `ReportSection[]` deterministic; nội dung lạc vào bucket có kiểm soát.
- [ ] Offline: no `fetch`, no AI; dùng `parseMarkdown` (W2) — không parser mới.
- [ ] Public surface qua `@/modules/write`.
- [ ] `readme-import.test.ts` phủ nhiều heading/empty/bucket/deterministic/no-network.
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/modules/write/readme-import.ts
import type { ReportSection } from "@/types";
export function importReadme(markdown: string): ReportSection[];

// src/modules/write/templates/readme-report.ts
import type { TemplateSchema } from "@/types";
export const readmeReportTemplate: TemplateSchema;
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/write/templates/readme-report.ts` | NEW | ~60 |
| `src/modules/write/readme-import.ts` | NEW | ~90 |
| `src/modules/write/templates/index.ts` | MODIFY | ~+2 (đăng ký) |
| `src/modules/write/index.ts` | MODIFY | ~+2 (export) |
| `src/components/Workspace.tsx` / initializer | MODIFY | ~+10 (đường nhập README) |
| `src/modules/write/readme-import.test.ts` | NEW | ~70 |

> **Import boundary:** `readme-import` import `@/lib` (pipeline W2) + `@/types`. No `fetch`, no AI, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Map sai section khi README cấu trúc lạ | Medium | Map theo heading mdast có kiểm soát; nội dung lạc vào bucket; test sample đa dạng. |
| Lén convert định dạng khác / dùng AI | Medium | Chỉ nhận chuỗi Markdown; no fetch/model; test no-network (Locked #4). |
| Parser thứ hai (drift với pipeline) | Low | Dùng `parseMarkdown` W2; không thêm parser. |
| `importReadme` > 200 dòng | Low | Tách hàm map heading nhỏ; template ở file riêng. |
| README rỗng/đa heading trùng tên | Low | Test empty + trùng tên → order/id ổn định. |

## 6. Verification Plan
- README có `# Title`, `## Install`, `## Usage` → 3 (hoặc 2 + bucket) section đúng tiêu đề/thứ tự.
- Nội dung trước heading đầu → vào "Mở đầu" bucket.
- `importReadme("")` → rỗng/1 bucket, không throw.
- Gọi 2 lần cùng input → kết quả giống hệt (deterministic).
- grep: không `fetch`/AI client trong module.
- lint/typecheck/test/build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(write): readme-to-report template + importReadme`; (2) `feat(write): wire README import into initializer`; +1 docs commit.
