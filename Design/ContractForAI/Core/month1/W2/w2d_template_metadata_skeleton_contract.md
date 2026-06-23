# Contract For AI - W2 Group D: Template Picker, Metadata & Skeleton

> **Lane / Week:** Core / Month 1 / W2 - Day 4 (`Design/TaskBrief/Core/month1/w2.md` `[C24]`-`[C26]`).
> **Branch:** `feature/W2-markdown-editor`.
> **Builds on:** W1 `createProjectFromTemplate` (`src/modules/write/create-project.ts`), `softwareProjectTemplate`, canonical `TemplateSchema`/`MetadataFieldSpec`/`ReportSection`, W1 zod schemas (`src/types/schemas.ts`).
> **Sources:** `w2.md` Locked Decision #4, `week2.md` Day 4, `Design/Modules/1.Write.md`, CanonicalTypes §1 & §4.

---

## 1. Micro-task Target

Cho người dùng **chọn template** + **điền metadata** (title/school/course/lecturer/members) rồi **sinh skeleton sections** từ template+metadata. Tái dùng mapper W1 (`createProjectFromTemplate`) và validate qua zod schema W1 — KHÔNG khai báo lại type, KHÔNG tạo template type song song.

## 2. Scope

### In scope (`[C24]`/`[C25]`/`[C26]`)
- `[C24]` `src/modules/write/TemplatePicker.tsx`: chọn 1 `TemplateSchema` (W2 có ≥1 template: software-project). Presentational + callback.
- `[C25]` `src/modules/write/MetadataForm.tsx`: form các field theo `MetadataFieldSpec`; validate bằng zod schema W1; báo lỗi field tối giản (a11y: label + text, DesignSystem §7b).
- `[C26]` `src/modules/write/generate-skeleton.ts`: `(template, metadata) => ReportSection[]` (`order`, `status:"draft"`). Hoàn thiện seed `software-project.ts` nếu thiếu section. Build trên `createProjectFromTemplate`, không nhân bản logic.
- Vitest: `generate-skeleton` sinh đúng số section + `order` + `status="draft"`; metadata invalid → zod báo lỗi.

### Out of scope
- ❌ Nhiều template mới (chỉ software-project ở W2; template khác = tuần sau).
- ❌ Autosave/image (Group E).
- ❌ Multi-file section management (Non-goal MVP).
- ❌ Preview/editor changes (Group B/C).

## 3. Checklist
- [ ] `TemplatePicker.tsx` presentational, ≤200 dòng.
- [ ] `MetadataForm.tsx` validate qua zod W1, ≤200 dòng, a11y error text.
- [ ] `generate-skeleton.ts` thuần, tái dùng W1 mapper.
- [ ] `generate-skeleton.test.ts`: section count / order / status / invalid metadata.
- [ ] Export public qua `modules/write/index.ts`.
- [ ] `Workspace.tsx` wire luồng "chọn template → sinh skeleton" (giữ ≤200 dòng; tách sub-component nếu cần).
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/modules/write/generate-skeleton.ts
export function generateSkeleton(
  template: TemplateSchema,
  metadata: Record<string, string | string[]>,
): ReportSection[];

// TemplatePicker.tsx — props { templates, value, onSelect }
// MetadataForm.tsx — props { fields, values, onChange, errors? }
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/write/TemplatePicker.tsx` | NEW | ~60 |
| `src/modules/write/MetadataForm.tsx` | NEW | ~110 |
| `src/modules/write/generate-skeleton.ts` | NEW | ~50 |
| `src/modules/write/generate-skeleton.test.ts` | NEW | ~50 |
| `src/modules/write/templates/software-project.ts` | MODIFY | seed |
| `src/modules/write/index.ts` | MODIFY | +exports |
| `src/components/Workspace.tsx` | MODIFY | wire |

> **Import boundary:** write module imports `@/types` + W1 write internals via relative path. No cross-import from `check`/`export`/`lib pipeline`. No `fetch`.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Khai báo lại template type (drift) | High | Dùng `TemplateSchema` canonical + mapper W1; không tạo type mới. |
| Metadata không validate → bundle hỏng | Medium | Validate qua zod W1 trước khi sinh skeleton. |
| `Workspace.tsx` phình >200 dòng khi wire | Medium | Tách form/picker thành component riêng; Workspace chỉ orchestrate. |
| Skeleton ghi đè draft đang có | Medium | Chỉ generate khi tạo project mới / người dùng xác nhận; không tự ghi đè autosave. |

## 6. Verification Plan
- `generateSkeleton(softwareProjectTemplate, validMeta)` → đúng số section, `order` tăng dần, mọi `status="draft"`.
- Metadata thiếu field bắt buộc → zod `safeParse` fail, form hiện lỗi.
- Chọn template + submit → workspace có sections mới (thủ công).
- lint/typecheck/test/build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> Đề xuất 2 commit: (1) generate-skeleton + seed + test; (2) TemplatePicker + MetadataForm + wire Workspace. +1 docs commit.
