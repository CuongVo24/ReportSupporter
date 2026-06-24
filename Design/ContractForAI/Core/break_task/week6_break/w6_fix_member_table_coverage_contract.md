# Contract For AI — W6 Break: Fix Member-Table False Positives & Template Data Consistency

> **Lane:** Core / break_task / week6_break.
> **Branch:** `feature/W6-advanced-templates` (hoặc `fix/w6-template-data`).
> **Type:** Bug fix / consistency — review findings **#1**, **#2**, **#6** (W6 code review).
> **Builds on:** Group B (`lab-report.ts`, `internship-report.ts`), Group D (`sections/member-responsibility.ts`, `sections/project-timeline.ts`), W3 `missing-member-table` rule (`missing-sections.ts` — **không sửa**).
> **Sources:** W6 code review, `Design/ContractForAI/Core/month2/W6/w6b_*`, `w6d_*`, `Design/Modules/Other/CanonicalTypes.md §5`.

---

## 1. Micro-task Target

Sửa **bất nhất dữ liệu template** khiến checker báo nhầm và làm trải nghiệm so le giữa các template nhóm. Rule `missing-member-table` coi *mọi* template có field `members: textList` là "template nhóm" ([missing-sections.ts:160](src/modules/check/rules/missing-sections.ts)) — nhưng chỉ `software-project` được nhúng sẵn bảng member nên không bị kêu, còn `lab-report`/`internship-report` thì luôn bị cảnh báo dù đúng là báo cáo nhóm.

- **#1 `missing-member-table` báo nhầm trên `lab-report`.** `lab-report` khai báo `members: textList` (required) nhưng skeleton **không** có bảng phân công nào → checker luôn cảnh báo `missing-member-table` cho mọi báo cáo thực hành. ([lab-report.ts:36](src/modules/write/templates/lab-report.ts), [missing-sections.ts:160](src/modules/check/rules/missing-sections.ts))
- **#2 `internship-report` thoả checker do may rủi.** Internship có `members: textList` nhưng **không** nhúng `buildMemberResponsibility`; nó chỉ thoát `missing-member-table` vì `buildProjectTimeline` tình cờ chứa một bảng GFM (rule chỉ đếm table bất kỳ). Đúng tinh thần Group D ("nhúng member/timeline vào software-project **và** internship") thì internship nên có bảng phân công thật. ([internship-report.ts:56](src/modules/write/templates/internship-report.ts))
- **#6 Chính sách `requiredSections` "Tài liệu tham khảo" bất nhất.** `lab-report` **bắt buộc** "Tài liệu tham khảo" còn `internship-report` thì **không**, dù cả hai đều có section đó. Cần thống nhất quan điểm. ([lab-report.ts:81](src/modules/write/templates/lab-report.ts), [internship-report.ts:83](src/modules/write/templates/internship-report.ts))

> 🔒 **Reuse, không copy (Locked #5).** Bảng member nhúng qua `buildMemberResponsibility()` — **không** paste Markdown cứng.
> 🔒 **Không rewrite rule (Locked #6).** Giữ nguyên `missing-sections.ts` (id/severity/shape). Đây là fix **dữ liệu template**, không phải fix rule. (`readme-report` xử lý ở contract `w6_polish_readme_wiring_and_form_contract.md` vì skeleton sinh động từ README.)

## 2. Scope

### In scope
- **#1** `src/modules/write/templates/lab-report.ts`: thêm một section "Thành viên & Phân công" với `starterMarkdown: buildMemberResponsibility()` (import từ `../sections/member-responsibility`), `order` chèn hợp lý (vd sau "Mục tiêu"), các `order` còn lại dồn lại liên tục. **Không** đưa section này vào `requiredSections` (giống `software-project`). Title không số.
- **#2** `src/modules/write/templates/internship-report.ts`: thêm section "Thành viên & Phân công" nhúng `buildMemberResponsibility()` (giữ nguyên section "Nội dung Công việc" dùng `buildProjectTimeline`). Dồn `order` liên tục. Không thêm vào `requiredSections`.
- **#6** Thống nhất chính sách references: **khuyến nghị** cả hai template **bắt buộc** "Tài liệu tham khảo" (chuẩn học thuật) → thêm `"Tài liệu tham khảo"` vào `internship-report.requiredSections`. (Nếu chọn ngược lại — cả hai optional — thì bỏ khỏi `lab-report.requiredSections`; chọn **một** hướng và áp cho cả hai.)
- **Regression tests** (`lab-report.test.ts`, `internship-report.test.ts`, `missing-sections.test.ts`):
  - skeleton `lab-report`/`internship-report` chứa section có bảng GFM (header + separator).
  - chạy checker trên bundle sinh từ skeleton 2 template → **0** issue `missing-member-table`.
  - `requiredSections ⊆ sections[].title` vẫn đúng sau khi thêm section.
  - chính sách references đã thống nhất (assert `requiredSections` của cả hai).

### Out of scope
- ❌ Sửa `missing-sections.ts` / đổi heuristic group-detection (Locked #6).
- ❌ `readme-report` member block (→ contract polish, vì sinh từ README import).
- ❌ Thêm field mới vào `TemplateSchema` (canonical §5).
- ❌ Thêm template mới / dep mới / network.

## 3. Checklist
- [ ] `lab-report` nhúng `buildMemberResponsibility()` qua builder (không copy Markdown); skeleton có bảng GFM hợp lệ.
- [ ] `internship-report` nhúng `buildMemberResponsibility()` (giữ timeline); `order` liên tục, không trùng.
- [ ] Checker trên skeleton 2 template → 0 `missing-member-table`.
- [ ] Chính sách "Tài liệu tham khảo" thống nhất giữa lab & internship; `requiredSections ⊆ titles`.
- [ ] Section mới **không** lọt vào `requiredSections` (tránh kéo theo `missing-references`/section-count sai).
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

> Chỉ sửa **dữ liệu template** + test. Không đổi interface (`TemplateSchema` §5 giữ nguyên), không đổi builder signature.

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/write/templates/lab-report.ts` | MODIFY | ~+8 (section member + dồn order) |
| `src/modules/write/templates/internship-report.ts` | MODIFY | ~+8 (section member + requiredSections) |
| `src/modules/write/templates/lab-report.test.ts` · `internship-report.test.ts` | MODIFY | ~+25 |
| `src/modules/check/rules/missing-sections.test.ts` | MODIFY | ~+20 (0 member-table cho 2 template) |

> **Import boundary:** template chỉ import `@/types` + builder `./sections/...`. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| Dồn `order` sai → trùng/nhảy số | TB | Test khẳng định `order` liên tục `0..n-1` không trùng. |
| Section member lọt `requiredSections` → đổi số section bắt buộc / kéo rule khác | TB | Chỉ thêm vào `sections[]`, **không** vào `requiredSections`; test assert. |
| Đổi chính sách references phá test cũ | Thấp | Cập nhật test internship cho `missing-references` theo hướng đã chọn. |
| Builder member đổi shape sau này | Thấp | Nhúng qua hàm (Locked #5); một nguồn duy nhất. |

## 6. Verification Plan
- `generateSkeleton(labReportTemplate, {...})` → có section "Thành viên & Phân công" chứa bảng GFM; checker → 0 `missing-member-table`.
- `generateSkeleton(internshipReportTemplate, {...})` → có cả bảng member lẫn timeline; checker → 0 `missing-member-table`.
- internship thiếu "Tài liệu tham khảo" (sau khi thành required) → `missing-references` (error); có đủ → 0.
- `requiredSections` lab == internship về chính sách references.
- re-run checker cùng bundle → cùng tập issue (idempotent).
- lint/typecheck/test/build xanh.

## 7. Status

`PLANNED`
