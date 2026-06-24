# Contract For AI — W6 Break: Polish README Wiring, Form Styles & Dedup

> **Lane:** Core / break_task / week6_break.
> **Branch:** `feature/W6-advanced-templates` (hoặc `polish/w6-readme-wiring`).
> **Type:** Maintainability / polish — review findings **#3**, **#4**, **#5** (+ **#1b** phần `readme-report`).
> **Builds on:** Group C (`readme-import.ts`, `readme-report.ts`, wiring trong `Workspace.tsx`), Group D (`sections/member-responsibility.ts`), `MetadataForm.tsx`, `globals.css`.
> **Sources:** W6 code review, `Design/ContractForAI/Core/month2/W6/w6c_*`, `Design/Modules/1.Write.md`, `Design/Modules/Other/CanonicalTypes.md §5`.

---

## 1. Micro-task Target

Dọn ba điểm nợ kỹ thuật phát sinh khi wiring README import, không đổi hành vi người dùng (trừ #1b loại bỏ cảnh báo nhầm). Trọng tâm: gỡ **per-template code path** ra khỏi component, dồn style vào CSS, khử trùng lặp helper.

- **#3 Per-template code path trong component (mùi Locked #1).** `Workspace.tsx` branch `template.id === "readme-report" ? importReadme(...) : generateSkeleton(...)` — logic "template là data, engine một đường" bị rò vào React component. ([Workspace.tsx:96](src/components/Workspace.tsx))
- **#4 Inline styles + class CSS không tồn tại.** Textarea README dùng `style={{...}}` nội tuyến và tham chiếu class `ws-form-textarea` **chưa được định nghĩa** trong `globals.css`. ([MetadataForm.tsx:94](src/modules/write/MetadataForm.tsx), [globals.css:550](src/app/globals.css))
- **#5 Trùng lặp `getHeadingText`.** `readme-import.ts` tự cài hàm trải phẳng text của heading, lặp lại logic `getFlatText` đã có ở `check/rules/utils.ts` (khác module nên không thể import chéo). ([readme-import.ts:10](src/modules/write/readme-import.ts), [utils.ts:20](src/modules/check/rules/utils.ts))
- **#1b `readme-report` vẫn dính `missing-member-table`.** `readme-report` có `members: textList` nhưng skeleton sinh động từ README thường không có bảng → checker cảnh báo. Vì sections sinh runtime (không phải static skeleton), fix nằm ở **đường wiring** chứ không ở file template (xem contract `w6_fix_member_table_coverage_contract.md` cho lab/internship static). ([readme-report.ts:14](src/modules/write/templates/readme-report.ts))

> 🔒 **Template là data, engine một đường (Locked #1).** Quyết định "import README hay sinh skeleton" thuộc **module Write**, không thuộc component.
> 🔒 **Reuse type/helper (Locked #2/#5).** Helper trải phẳng text về `@/lib`; member block qua `buildMemberResponsibility()`.

## 2. Scope

### In scope
- **#3** `src/modules/write/buildInitialSections.ts` (NEW, hoặc thêm vào file phù hợp trong Write): `export function buildInitialSections(template: TemplateSchema, metadata): ReportSection[]` — gói **toàn bộ** quyết định khởi tạo section: nếu `template.id === "readme-report"` → `importReadme(metadata.readmeContent)`; ngược lại → `generateSkeleton(template, {...})`. Export qua `@/modules/write`.
  - `src/components/Workspace.tsx` (MODIFY): thay nhánh inline bằng `buildInitialSections(template, { title, ...metadata })`; component không còn nhắc tên template cụ thể. Giữ `cleanMetadata` (xoá `readmeContent`).
- **#1b** Trong `buildInitialSections` (đường `readme-report`): sau khi `importReadme`, **prepend** một section "Thành viên & Phân công" dùng `buildMemberResponsibility(metadata.members)` để báo cáo README nhóm cũng thoả `missing-member-table`. (Quyết định thay thế nếu muốn: bỏ `members` khỏi `readme-report.metadataFields` để rule không coi là template nhóm — chọn **một** hướng, ghi rõ.)
- **#4** `src/app/globals.css` (MODIFY): thêm `.ws-form-textarea` (kế thừa/đi kèm `.ws-form-input`, `min-height`, `font-family: monospace`, `width:100%`, `resize:vertical`). `src/modules/write/MetadataForm.tsx` (MODIFY): bỏ `style={{...}}` nội tuyến, chỉ dùng `className="ws-form-input ws-form-textarea"`.
- **#5** `src/lib/markdown-pipeline.ts` (hoặc `src/lib/mdast-text.ts` NEW): `export function flattenNodeText(node): string` trải phẳng `value`/`children` của mdast node. `readme-import.ts` dùng helper này thay `getHeadingText`; `check/rules/utils.ts` `getFlatText` có thể tái dùng helper chung (tuỳ chọn, không bắt buộc đổi nếu phá test). Tôn trọng import boundary (cả Write lẫn Check đều được import `@/lib`).
- **Tests**: `buildInitialSections.test.ts` (readme-report → importReadme + có member section; template khác → generateSkeleton); `readme-import.test.ts` cập nhật nếu đổi helper (giữ deterministic + no-network); `MetadataForm` snapshot/style không bắt buộc.

### Out of scope
- ❌ Đổi hành vi `importReadme` (mapping heading giữ nguyên, deterministic, offline).
- ❌ Thêm field type mới (`textarea`) vào `MetadataFieldSpec` (canonical §5 — vẫn nhận diện qua `field.key === "readmeContent"`, chỉ tách style).
- ❌ Sửa rule `missing-sections.ts` (Locked #6).
- ❌ Member block cho lab/internship (→ contract `w6_fix_member_table_coverage_contract.md`).
- ❌ Dep mới / network.

## 3. Checklist
- [ ] `buildInitialSections` gói quyết định import-vs-skeleton; `Workspace.tsx` không còn `template.id === "readme-report"`.
- [ ] Đường `readme-report` prepend member section → checker 0 `missing-member-table` (hoặc đã bỏ `members` field, ghi rõ lựa chọn).
- [ ] `.ws-form-textarea` định nghĩa trong `globals.css`; `MetadataForm` hết inline `style`.
- [ ] Helper trải phẳng text dùng chung ở `@/lib`; `readme-import` hết `getHeadingText` riêng.
- [ ] `importReadme` vẫn deterministic + no `fetch`/AI (test giữ nguyên xanh).
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/modules/write/buildInitialSections.ts
import type { TemplateSchema, ReportSection } from "@/types";
export function buildInitialSections(
  template: TemplateSchema,
  metadata: Record<string, string | string[]>,
): ReportSection[];

// src/lib/markdown-pipeline.ts (hoặc lib/mdast-text.ts)
export function flattenNodeText(node: { value?: string; children?: unknown[] }): string;
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/write/buildInitialSections.ts` | NEW | ~30 |
| `src/components/Workspace.tsx` | MODIFY | ~−8 (bỏ branch) |
| `src/modules/write/index.ts` | MODIFY | ~+1 (export) |
| `src/lib/markdown-pipeline.ts` | MODIFY | ~+12 (flattenNodeText) |
| `src/modules/write/readme-import.ts` | MODIFY | ~−10 (dùng helper) |
| `src/modules/write/MetadataForm.tsx` | MODIFY | ~−6 (bỏ inline style) |
| `src/app/globals.css` | MODIFY | ~+8 (`.ws-form-textarea`) |
| `src/modules/write/buildInitialSections.test.ts` | NEW | ~40 |

> **Import boundary:** `buildInitialSections` ở Write, import `importReadme`/`generateSkeleton`/builder cùng module. Helper text ở `@/lib` (Write + Check đều dùng được). No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| Gỡ branch làm vỡ đường tạo project README | TB | `buildInitialSections.test.ts` phủ cả hai nhánh; verify trên Workspace. |
| Prepend member section đổi `order` các section README import | TB | Member section `order:0`, dồn order import +1; test assert liên tục. |
| `flattenNodeText` lệch hành vi `getHeadingText` cũ (mất text) | TB | Test cùng input README ra cùng titles như trước (deterministic). |
| `.ws-form-textarea` lệch theme/token | Thấp | Dùng `var(--rs-*)` như `.ws-form-input`; kiểm dark mode. |
| Đổi `getFlatText` (Check) phá test checker | Thấp | Không bắt buộc đổi Check; chỉ readme-import dùng helper mới. |

## 6. Verification Plan
- `buildInitialSections(readmeReportTemplate, { readmeContent: "# A\n## B" })` → có section member (order 0) + section từ README; template khác → giống `generateSkeleton`.
- Tạo project README nhóm trong Workspace → checker **không** kêu `missing-member-table`.
- `importReadme` gọi 2 lần cùng input → giống hệt (deterministic); grep module: không `fetch`/AI.
- README textarea hiển thị đúng (monospace, cao ≥150px) qua class, không inline style; dark mode ổn.
- lint/typecheck/test/build xanh.

## 7. Status

`COMPLETED`
