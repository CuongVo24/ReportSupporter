# Contract For AI - W6 Group E: Checker Integration & QA

> **Lane / Week:** Core / Month 2 / W6 - Day 5 (`Design/TaskBrief/Core/month2/w6.md` `[C74]`-`[C75]`).
> **Branch:** `feature/W6-advanced-templates`.
> **Builds on:** Groups A–D (registry + 4 template + section block), W3 `missing-sections.ts` (`missing-conclusion`/`missing-references`/`toc-disabled`/`missing-member-table` — **đã đọc `requiredSections` qua `getTemplateSchema`**).
> **Depended on by:** W7 (đa template để verify layout), W8 (đóng gói báo cáo), Phase 2 quality gate.
> **Sources:** `w6.md` Locked Decisions #1/#6, `week6.md` Day 5, `3.Check.md §5.2`, prior `W5_QA_Report.md` format.

---

## 1. Micro-task Target

**Xác nhận** checker đối chiếu đúng `requiredSections` cho **mọi** template mới (rule đã có từ W3 — không viết lại), **mở rộng test** để mỗi template được enforce đúng và section không bắt buộc không false-positive, rồi chạy 4 gates + viết QA evidence W6.

> **🔒 Verify, không rewrite (Locked #6).** `missing-sections.ts` đã resolve template qua `getTemplateSchema(ctx.templateId)` và gate trên `requiredSections`/`requiresToc`. W6 chỉ **bổ sung test coverage** cho 4 template; chỉ sửa rule nếu test lộ lỗi thật (không đổi id/shape).

## 2. Scope

### In scope (`[C74]`/`[C75]`)
- `src/modules/write/templates/*.test.ts` (NEW/đảm bảo đủ): mỗi template (`software-project`/`lab-report`/`internship-report`/`readme-report`) → `generateSkeleton` sinh đúng skeleton; `readme-import.test.ts` (Group C) cover mapping.
- `src/modules/check/rules/missing-sections.test.ts` (NEW hoặc MODIFY): với từng template,
  - thiếu một `requiredSection` → đúng issue (`missing-conclusion`/`missing-references`...) theo template đang chọn.
  - section **không** nằm trong `requiredSections` của template → **không** false-positive.
  - template không yêu cầu TOC → `toc-disabled` không kêu.
- (Chỉ khi test lộ lỗi) sửa tối thiểu `missing-sections.ts` — **không** đổi rule id/severity/shape.
- QA evidence: `Design/Reports/Month2/W6/W6_QA_Report.md` (map DoD `week6.md` + `3.Check.md`), `template_samples.md` (skeleton mẫu của 4 template + README import + issues checker), `build_output.txt`.

### Out of scope
- ❌ Viết lại rule checker (đã có W3 — verify/extend test).
- ❌ Thêm template/section mới (Groups B/C/D).
- ❌ `evidence.zip` đóng gói (→ W8).
- ❌ Dep mới / network.

## 3. Checklist
- [ ] Mỗi template có test `generateSkeleton` sinh đúng skeleton.
- [ ] `missing-sections.test.ts` phủ: thiếu required-section theo template · không false-positive · `toc-disabled` đúng theo `requiresToc`.
- [ ] Rule ids/severity giữ nguyên.
- [ ] Checker chạy offline (no network).
- [ ] `Design/Reports/Month2/W6/` có QA report + template samples + build output.
- [ ] 4 gates xanh (lint/typecheck/test/build).

## 4. Expected Interfaces / Files

> Chủ yếu test + evidence; **không** đổi interface rule (CanonicalTypes §6 giữ nguyên).

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/write/templates/*.test.ts` | NEW/ĐỦ | 4 template sinh đúng skeleton |
| `src/modules/check/rules/missing-sections.test.ts` | NEW/MODIFY | required-section theo template / no-false-positive / toc |
| `src/modules/check/rules/missing-sections.ts` | MODIFY (chỉ nếu test fail) | fix tối thiểu, không đổi id/shape |
| `Design/Reports/Month2/W6/W6_QA_Report.md` | NEW | kết quả QC + DoD |
| `Design/Reports/Month2/W6/template_samples.md` | NEW | skeleton 4 template + README import + issues |
| `Design/Reports/Month2/W6/build_output.txt` | NEW | log 4 gates |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Rule rewrite ngoài ý (drift) | Medium | Chỉ verify/extend test; sửa rule chỉ khi test fail, không đổi id/shape (Locked #6). |
| False-positive khi template không yêu cầu section đó | Medium | `missing-sections` đã skip khi section không thuộc `requiredSections`; test khẳng định mỗi template. |
| QA report lệch format các tuần trước | Low | Theo `W5_QA_Report.md` + `Reports/README.md`. |
| Test giả định template chưa đăng ký registry | Medium | Dùng `getTemplate`/`ALL_TEMPLATES` (Group A); nêu rõ template dùng. |

## 6. Verification Plan
- lab-report thiếu "Kết luận" → `missing-conclusion` (error); có đủ → 0 issue.
- internship-report không yêu cầu "Kết luận" trong `requiredSections` → **không** `missing-conclusion`.
- template `requiresToc:false` → `toc-disabled` không kêu.
- README import skeleton hợp lý, không vỡ checker.
- re-run checker cùng bundle → cùng tập issue (idempotent, trừ `ranAt`).
- lint/typecheck/test/build xanh; `build_output.txt` lưu.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `test(write): template skeleton coverage (4 templates)`; (2) `test(check): missing-sections per-template coverage`; (3) `docs(w6): W6 QA report + template samples`; +1 docs commit. Đóng Advanced Templates.
