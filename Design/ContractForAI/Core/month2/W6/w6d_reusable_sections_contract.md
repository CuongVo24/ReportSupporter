# Contract For AI - W6 Group D: Reusable Sections (Members & Timeline)

> **Lane / Week:** Core / Month 2 / W6 - Day 4 (`Design/TaskBrief/Core/month2/w6.md` `[C72]`-`[C73]`).
> **Branch:** `feature/W6-advanced-templates`.
> **Builds on:** Group A (registry), Group B (lab/internship template), W6 software-project template, W3 `missing-member-table` rule (đã có).
> **Depended on by:** Group E (checker member-table thoả mãn bởi block), W8 (báo cáo nộp có phân công/timeline).
> **Sources:** `w6.md` Locked Decisions #1/#5, `week6.md` Day 4, `1.Write.md`.

---

## 1. Micro-task Target

Tạo hai **section block tái dùng**: bảng phân công thành viên (member responsibility) và timeline dự án (project timeline), rồi **nhúng bằng tham chiếu** vào các template phù hợp (software-project, internship) thay vì copy từng template.

> **🔒 Block dùng chung, không copy (Locked #5).** Member/timeline sống ở `src/modules/write/sections/`; template nhúng qua hàm builder — không paste Markdown lặp.
> **📌 Khớp checker có sẵn.** Bảng member thoả `missing-member-table` (W3) — bảng GFM phân công; không cần sửa rule.

## 2. Scope

### In scope (`[C72]`/`[C73]`)
- `src/modules/write/sections/member-responsibility.ts`: `export function buildMemberResponsibility(): string` (hoặc nhận tham số members) → block Markdown có heading + bảng GFM cột Thành viên · Vai trò · Nhiệm vụ.
- `src/modules/write/sections/project-timeline.ts`: `export function buildProjectTimeline(): string` → block Markdown có heading + bảng/list mốc thời gian (Giai đoạn · Mốc · Mô tả).
- MODIFY template liên quan (`software-project.ts`, `internship-report.ts`): nhúng `starterMarkdown` của section tương ứng bằng builder (import từ `sections/`), không paste cứng.
- `src/modules/write/index.ts` (MODIFY): export 2 builder (public surface).
- Vitest: mỗi builder → block deterministic, có bảng GFM hợp lệ (header + separator); section nhúng vào template xuất hiện trong skeleton; bảng member khiến `missing-member-table` **không** kêu.

### Out of scope
- ❌ Sửa rule checker (Group E — chỉ verify thoả mãn).
- ❌ README import (Group C).
- ❌ Template mới (Group B).
- ❌ Dep mới.

## 3. Checklist
- [ ] `member-responsibility.ts` + `project-timeline.ts`: builder trả Markdown deterministic, bảng GFM hợp lệ.
- [ ] Template nhúng block bằng builder (không copy Markdown).
- [ ] Bảng member thoả `missing-member-table` (W3).
- [ ] Export builder qua `@/modules/write`.
- [ ] Test builder + nhúng vào skeleton.
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/modules/write/sections/member-responsibility.ts
export function buildMemberResponsibility(members?: string[]): string; // Markdown block

// src/modules/write/sections/project-timeline.ts
export function buildProjectTimeline(): string; // Markdown block
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/write/sections/member-responsibility.ts` | NEW | ~40 |
| `src/modules/write/sections/project-timeline.ts` | NEW | ~40 |
| `src/modules/write/templates/software-project.ts` | MODIFY | ~+2 (nhúng block) |
| `src/modules/write/templates/internship-report.ts` | MODIFY | ~+2 (nhúng block) |
| `src/modules/write/index.ts` | MODIFY | ~+2 (export builder) |
| `src/modules/write/sections/sections.test.ts` | NEW | ~60 |

> **Import boundary:** section builder import only chuẩn lib (không `@/types` nếu không cần). Template import builder từ `./sections/...`. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Copy block giữa template (debt) | Medium | Block ở `sections/`; template gọi builder; test khẳng định cùng nguồn. |
| Bảng GFM hỏng (thiếu separator) | Medium | Builder sinh header + `---` separator; test parse bảng hợp lệ. |
| Bảng member không thoả checker | Low | Bảng GFM trong section → `missing-member-table` không kêu; test khẳng định. |
| Builder > 200 dòng | Low | Mỗi block một file nhỏ. |

## 6. Verification Plan
- `buildMemberResponsibility(["A - 001"])` → block có heading + bảng 3 cột.
- `buildProjectTimeline()` → block có bảng/list mốc thời gian.
- software-project skeleton chứa section phân công (bảng GFM).
- Chạy checker trên bundle có block member → **0** `missing-member-table`.
- lint/typecheck/test/build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(write): reusable member + timeline section blocks`; (2) `feat(write): embed reusable sections into templates`; +1 docs commit.
