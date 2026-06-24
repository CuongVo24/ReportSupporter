# Contract For AI - W6 Group B: Lab & Internship Templates

> **Lane / Week:** Core / Month 2 / W6 - Day 2 (`Design/TaskBrief/Core/month2/w6.md` `[C68]`-`[C69]`).
> **Branch:** `feature/W6-advanced-templates`.
> **Builds on:** Group A (`templates/index.ts` registry, `getTemplate`), W1 `TemplateSchema`, W2 `generateSkeleton`/`createProjectFromTemplate`.
> **Depended on by:** Group D (section block nhúng vào internship/software), Group E (checker đối chiếu `requiredSections` của 2 template mới).
> **Sources:** `w6.md` Locked Decisions #1/#2/#5, `week6.md` Day 2, `1.Write.md`, `CanonicalTypes.md §5`.

---

## 1. Micro-task Target

Thêm hai template báo cáo phổ biến: **lab report** và **internship report**, mỗi cái là một `TemplateSchema` thuần data, đăng ký vào registry Group A, đi qua cùng skeleton generator.

> **🔒 Template là data (Locked #1).** Hai template chỉ khai báo `sections`/`requiredSections`/`metadataFields` — không thêm code path. Section titles **không** mang số chương (Format sở hữu numbering, `1.Write §3.3`).
> **🔒 Reuse type (Locked #2).** Dùng `TemplateSchema` từ `@/types`; không thêm field.

## 2. Scope

### In scope (`[C68]`/`[C69]`)
- `src/modules/write/templates/lab-report.ts`: `export const labReportTemplate: TemplateSchema` — `sections`: Mục tiêu (Objective) · Phương pháp (Method) · Kết quả (Results) · Thảo luận (Discussion) · Kết luận (Conclusion) · Tài liệu tham khảo (References); `requiredSections` khớp; `metadataFields` hợp lý (môn/lab/giảng viên); `requiresToc` theo nhu cầu; `requiredEvidenceKinds` tối thiểu.
- `src/modules/write/templates/internship-report.ts`: `export const internshipReportTemplate: TemplateSchema` — `sections`: Công ty (Company) · Công việc (Tasks) · Kỹ năng (Skills) · Tự đánh giá (Reflection) · Đánh giá của người hướng dẫn (Mentor evaluation) · Tài liệu tham khảo; `metadataFields` (công ty, người hướng dẫn, vị trí); `requiredSections` khớp.
- `src/modules/write/templates/index.ts` (MODIFY): đăng ký `labReportTemplate` + `internshipReportTemplate` vào `ALL_TEMPLATES`.
- Vitest: mỗi template → `generateSkeleton` sinh đúng số section + đúng tiêu đề; section titles không chứa số chương; `requiredSections` ⊆ tiêu đề section.

### Out of scope
- ❌ README-to-report (Group C).
- ❌ Section block member/timeline (Group D) — Group D sẽ nhúng sau.
- ❌ Sửa rule checker (Group E).
- ❌ Thêm field `TemplateSchema` (canonical).
- ❌ Dep mới.

## 3. Checklist
- [ ] `lab-report.ts` + `internship-report.ts`: `TemplateSchema` đầy đủ, section titles không số.
- [ ] `requiredSections` của mỗi template ⊆ `sections[].title`.
- [ ] Đăng ký cả hai vào `ALL_TEMPLATES`; `id` duy nhất.
- [ ] Test mỗi template sinh đúng skeleton qua `generateSkeleton`.
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/modules/write/templates/lab-report.ts
import type { TemplateSchema } from "@/types";
export const labReportTemplate: TemplateSchema;

// src/modules/write/templates/internship-report.ts
import type { TemplateSchema } from "@/types";
export const internshipReportTemplate: TemplateSchema;
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/write/templates/lab-report.ts` | NEW | ~80 |
| `src/modules/write/templates/internship-report.ts` | NEW | ~85 |
| `src/modules/write/templates/index.ts` | MODIFY | ~+4 (đăng ký) |
| `src/modules/write/templates/lab-report.test.ts` · `internship-report.test.ts` | NEW | ~70 |

> **Import boundary:** template import only `@/types`. Test import `generateSkeleton`/`getTemplate` qua `@/modules/write`.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Section title chứa số chương (đụng numbering) | Medium | Title thuần chữ; Format đánh số; test khẳng định không có prefix số. |
| `requiredSections` lệch `sections[]` | Medium | Test `requiredSections ⊆ titles`; checker sẽ dùng đúng. |
| Trùng `id` với template khác | Low | `id` riêng (`lab-report`/`internship-report`); test registry. |
| Template phình code path riêng | Low | Chỉ data; đi qua `generateSkeleton` chung (Locked #1). |

## 6. Verification Plan
- Picker hiển thị "Lab report" + "Internship report"; chọn → form metadata đúng field.
- `generateSkeleton(labReportTemplate, {...})` ra đúng 6 section đúng thứ tự.
- internship skeleton có section "Đánh giá của người hướng dẫn".
- `getTemplate("lab-report")`/`getTemplate("internship-report")` trả đúng.
- lint/typecheck/test/build xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(write): lab + internship report templates`; (2) `feat(write): register new templates in registry`; +1 docs commit.
