# Contract For AI - W8 Group B: README Generator from Metadata

> **Lane / Week:** Core / Month 2 / W8 - Day 2 (`Design/TaskBrief/Core/month2/w8.md` `[C88]`-`[C89]`).
> **Branch:** `feature/W8-submission-package`.
> **Builds on:** W1 canonical `ReportProject.metadata` + `ReportProjectBundle` (`@/types`), W5 `EvidenceItem[]` (`bundle.evidence`), W6 `importReadme` (đường ngược — README → report; Group B là chiều xuôi report → README).
> **Depended on by:** Group A (README string đi vào `evidence.zip`), Group E (panel + QA).
> **Sources:** `w8.md` Locked Decisions #1/#3, `MasterRoadMap.md` W8 ("Generate `README.md` from report metadata"), `ProductPRD.md §6` (no AI / offline), `Support.Evidence.md`.

---

## 1. Micro-task Target

Sinh `README.md` **deterministic** từ `project.metadata` + `bundle.evidence`: tiêu đề báo cáo, thông tin trường/môn/GVHD/thành viên, mô tả ngắn, và danh sách link minh chứng (video/github/deploy…). Không AI, không mạng, không bịa nội dung.

> **🔒 Deterministic, no AI (Locked #3).** README sinh từ field metadata + evidence theo template cố định; cùng input → cùng output. Không gọi model, không fetch.
> **🔒 Một nguồn dữ liệu (Locked #1).** Metadata đọc từ `project.metadata`, link từ `bundle.evidence` (W5) — không tự chế danh sách minh chứng song song với Evidence Kit.
> **📌 Tách chiều với W6.** W6 `importReadme` là README → sections; Group B là report → README. Hai hàm độc lập, không gộp.

## 2. Scope

### In scope (`[C88]`/`[C89]`)
- `src/modules/export/generate-readme.ts` (**NEW**): `generateReadme(bundle: ReportProjectBundle): string` — dựng Markdown README: `# <title>`, block metadata (trường/môn/GVHD/thành viên/ngày từ `metadata`), section "Minh chứng" liệt kê `EvidenceItem` (`- [title](url)` theo `kind`), bỏ qua field rỗng có kiểm soát. Reuse `kind-meta` (W5) cho nhãn kind nếu cần.
- `src/modules/export/index.ts` (MODIFY): export `generateReadme`.
- Vitest: `generate-readme.test.ts` — metadata đủ → README có đúng các block; field rỗng → bỏ dòng (không in "undefined"); evidence rỗng → section minh chứng rỗng/ẩn; cùng input → cùng output; **không** gọi mạng/AI.

### Out of scope
- ❌ Đóng gói zip (Group A — chỉ nhận string).
- ❌ Final checklist (Group C).
- ❌ Export history (Group D).
- ❌ AI sinh mô tả (→ W11 optional).
- ❌ Dep mới / fetch.

## 3. Checklist
- [ ] `generateReadme`: title + metadata block + danh sách minh chứng từ `bundle.evidence`.
- [ ] Field/evidence rỗng → bỏ dòng có kiểm soát, không in `undefined`.
- [ ] Deterministic; offline (no fetch/AI).
- [ ] Public surface qua `@/modules/export`.
- [ ] `generate-readme.test.ts` phủ full/empty-field/empty-evidence/deterministic/no-network.
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/modules/export/generate-readme.ts
import type { ReportProjectBundle } from "@/types";
export function generateReadme(bundle: ReportProjectBundle): string;
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/export/generate-readme.ts` | NEW | ~110 |
| `src/modules/export/index.ts` | MODIFY | ~+1 |
| `src/modules/export/generate-readme.test.ts` | NEW | ~80 |

> **Import boundary:** import `@/types` + `@/modules/evidence` (kind-meta) nếu cần. No `fetch`, no AI, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| In `undefined`/dòng rỗng khi thiếu field | Medium | Bỏ qua field rỗng có kiểm soát; test empty-field. |
| Danh sách minh chứng lệch Evidence Kit | Medium | Đọc thẳng `bundle.evidence` (W5); không tạo list song song (Locked #1). |
| Lén dùng AI/fetch để "viết hay hơn" | Low | Template cố định; test no-network (Locked #3). |
| Trùng vai trò với `importReadme` (W6) | Low | Hàm riêng, chiều ngược; không gộp. |

## 6. Verification Plan
- metadata có trường/môn/GVHD/3 thành viên + 2 evidence → README có đủ block + 2 link.
- bỏ trống GVHD → không có dòng GVHD, không `undefined`.
- evidence rỗng → section minh chứng ẩn/rỗng.
- gọi 2 lần cùng bundle → README giống hệt.
- lint/typecheck/test/build xanh.

## 7. Status

`DONE`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(export): generate README.md from report metadata + evidence`; +1 docs commit.
