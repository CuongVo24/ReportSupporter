# Contract For AI - W6 Group A: Template Library Structure

> **Lane / Week:** Core / Month 2 / W6 - Day 1 (`Design/TaskBrief/Core/month2/w6.md` `[C66]`-`[C67]`).
> **Branch:** `feature/W6-advanced-templates`.
> **Builds on:** W1 canonical `TemplateSchema` (`src/types/template.ts`) + `softwareProjectTemplate` (`src/modules/write/templates/software-project.ts`) + `TemplatePicker`/`ProjectInitializer` (đã multi-template) — **already shipped**.
> **Depended on by:** Group B/C (template mới đăng ký vào registry), Group D (section block nhúng vào template), Group E (checker đọc `requiredSections` theo template trong registry).
> **Sources:** `w6.md` Locked Decisions #1/#2/#3/#7, `week6.md` Day 1, `1.Write.md`, `CanonicalTypes.md §5`.

---

## 1. Micro-task Target

Tạo **registry** cho thư viện template (gom tất cả `TemplateSchema` về một nguồn) và đưa nó vào picker/initializer. **Xác nhận** type `TemplateSchema` đã đủ field (W1) — **không khai báo lại**. Hoàn thiện `requiredSections` cho "Báo cáo đồ án phần mềm" để checker có thước đo thật.

> **🔒 Template là data, engine một đường (Locked #1).** Mọi template đi qua cùng `generateSkeleton` (W2) + cùng checker (W3). Không thêm code path riêng cho từng loại báo cáo.
> **🔒 Reuse, không re-declare (Locked #2).** `TemplateSchema` (`requiredSections`/`metadataFields`/`requiredEvidenceKinds`/`requiresToc`) sống ở `CanonicalTypes.md §5` → `src/types/template.ts`. Group A chỉ *consume*. Đổi shape ⇒ sửa `CanonicalTypes.md` trước.
> **📌 Picker đã multi-template.** `TemplatePicker`/`ProjectInitializer` đã nhận `templates: TemplateSchema[]`. Group A chỉ thay nguồn cấp (hiện caller truyền `[softwareProjectTemplate]`) bằng `ALL_TEMPLATES` — **không** viết lại UI.

## 2. Scope

### In scope (`[C66]`/`[C67]`)
- `src/modules/write/templates/index.ts`: `export const ALL_TEMPLATES: TemplateSchema[]` (khởi đầu chứa `softwareProjectTemplate`) + `export function getTemplate(id: string): TemplateSchema | undefined`. Là nguồn duy nhất cho picker + (qua `getTemplateSchema`) checker.
- `src/modules/write/templates/software-project.ts` (MODIFY nhẹ): mở rộng `requiredSections` cho khớp section set thật (vd thêm `"Mở đầu"`/`"Kiểm thử"` nếu là bắt buộc) — không đổi `id`, giữ section titles không số.
- `src/modules/write/index.ts` (MODIFY): export `ALL_TEMPLATES`, `getTemplate` (public surface; consumer khác chỉ import qua đây, không deep-import file template).
- Caller (`src/components/Workspace.tsx` / page khởi tạo) (MODIFY): truyền `ALL_TEMPLATES` vào `ProjectInitializer` thay vì mảng 1 phần tử.
- (Reconciliation, no code) Xác nhận `TemplateSchema` khớp `CanonicalTypes §5`; nếu lệch thì sửa `CanonicalTypes.md` trước.
- Vitest: `templates/index.test.ts` — `ALL_TEMPLATES` không rỗng, `id` duy nhất; `getTemplate("software-project")` trả đúng; `getTemplate("x")` → `undefined`; mọi template có `requiredSections`/`metadataFields` hợp lệ (zod nếu có schema).

### Out of scope
- ❌ Template lab/internship/readme (Group B/C).
- ❌ Section block member/timeline (Group D).
- ❌ Sửa rule checker (Group E — đã đọc `requiredSections`).
- ❌ Viết lại `TemplatePicker` UI (đã multi-template).
- ❌ Thêm field mới vào `TemplateSchema` (canonical, W1).
- ❌ Dep mới.

## 3. Checklist
- [ ] `templates/index.ts`: `ALL_TEMPLATES` + `getTemplate`; id duy nhất.
- [ ] `software-project.ts`: `requiredSections` phản ánh section set thật; section titles không số.
- [ ] `write/index.ts` export `ALL_TEMPLATES`/`getTemplate`; không deep-import template ngoài module.
- [ ] Caller truyền `ALL_TEMPLATES` vào initializer; picker hiển thị đủ template.
- [ ] Không tái khai báo `TemplateSchema` (import từ `@/types`).
- [ ] `templates/index.test.ts` phủ registry + getTemplate; ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/modules/write/templates/index.ts
import type { TemplateSchema } from "@/types";
export const ALL_TEMPLATES: TemplateSchema[];
export function getTemplate(id: string): TemplateSchema | undefined;
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/write/templates/index.ts` | NEW | ~25 |
| `src/modules/write/templates/software-project.ts` | MODIFY | ~+3 (requiredSections) |
| `src/modules/write/index.ts` | MODIFY | ~+2 (export registry) |
| `src/components/Workspace.tsx` (hoặc page khởi tạo) | MODIFY | ~+2 (truyền ALL_TEMPLATES) |
| `src/modules/write/templates/index.test.ts` | NEW | ~50 |

> **Import boundary:** registry import only `@/types` + các file template trong cùng thư mục. Consumer ngoài Write import qua `@/modules/write`. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Trùng `id` giữa template | Medium | Test khẳng định `id` duy nhất trong `ALL_TEMPLATES`. |
| Deep-import file template phá module boundary | Medium | Chỉ export qua `write/index.ts`; consumer import `@/modules/write`. |
| Tái khai báo `TemplateSchema` (drift) | Low | Import từ `@/types`; Day-1 "mở rộng types" là no-op verify. |
| `requiredSections` lệch section thật → checker sai | Medium | Đồng bộ `requiredSections` với `sections[]`; test sinh skeleton. |
| Caller quên đổi nguồn cấp → picker vẫn 1 template | Low | Verify picker hiển thị đủ; test caller nếu có. |

## 6. Verification Plan
- `ALL_TEMPLATES.map(t => t.id)` không trùng; chứa `"software-project"`.
- `getTemplate("software-project")` trả template; `getTemplate("nope")` → `undefined`.
- Picker (UI) hiển thị toàn bộ template từ registry; chọn được, mô tả đổi theo.
- `generateSkeleton(getTemplate("software-project")!, {...})` ra đúng section set.
- lint/typecheck/test/build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(write): template registry (ALL_TEMPLATES + getTemplate)`; (2) `refactor(write): feed registry into initializer`; +1 docs commit.
