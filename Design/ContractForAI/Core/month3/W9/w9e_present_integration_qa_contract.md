# Contract For AI - W9 Group E: Present Integration & QA

> **Lane / Week:** Core / Month 3 / W9 - Day 5 (`Design/TaskBrief/Core/month3/w9.md` `[C104]`-`[C105]`).
> **Branch:** `feature/W9-slide-outline`.
> **Builds on:** Groups A–D (outline + timeline + speakers + panel), W5 evidence (cue refs), W6 templates (đa template để verify outline flow).
> **Depended on by:** W10 (script/Q&A trên cùng outline), Phase 3 quality gate.
> **Sources:** `w9.md` Locked Decisions #1/#3, `MasterRoadMap.md` W9, `5.Present.md §8` (QC checklist), prior `W8_QA_Report.md` format, `Reports/README.md`.

---

## 1. Micro-task Target

**Tích hợp + QA** Present W9: xác nhận outline giữ đúng dòng chương mục trên đa template, timeline tổng đúng + cảnh báo vượt, speaker gán từ members, `evidenceRefs` map đúng — rồi chạy 4 gates + viết QA evidence W9.

> **🔒 Verify, không thêm logic (Locked #1).** Group E mở rộng test + viết evidence; chỉ sửa Groups A–D nếu test lộ lỗi thật (không đổi type/shape).
> **🔒 Deterministic baseline (Locked #3).** QA khẳng định outline/timeline/speaker sinh được **offline, không AI** (`5.Present.md §8` "no-AI baseline").

## 2. Scope

### In scope (`[C104]`/`[C105]`)
- `src/modules/present/*.test.ts` (NEW/đủ): integration — bundle đa template (`software-project`/`lab-report`/`internship-report`/`readme-report`) → outline đúng chapter flow; timeline sum/over-limit; speaker từ members; `evidenceRefs` map từ `bundle.evidence`.
- (Chỉ khi test lộ lỗi) sửa tối thiểu Groups A–D — không đổi shape `present.ts`/CanonicalTypes §9.
- QA evidence: `Design/Reports/Month3/W9/W9_QA_Report.md` (map DoD `w9.md` + `5.Present.md §8/§9`), `present_samples.md` (outline + timeline + speaker mẫu của ≥2 template, kèm evidence cue), `build_output.txt`.

### Out of scope
- ❌ Thêm logic outline/timeline/speaker/panel (Groups A–D).
- ❌ Script/Q&A/weak-section (→ W10).
- ❌ Export PPTX/PDF slides (DEFERRED).
- ❌ Dep mới / network / AI.

## 3. Checklist
- [ ] Integration test đa template: outline giữ đúng dòng chương mục.
- [ ] Timeline sum = total; over-limit đúng; speaker từ members.
- [ ] `evidenceRefs` map đúng từ `bundle.evidence`; ref gãy → bỏ có ghi chú (không vỡ).
- [ ] No-AI baseline khẳng định (no network).
- [ ] `Design/Reports/Month3/W9/` có QA report + present samples + build output.
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

> Chủ yếu test + evidence; không đổi interface (CanonicalTypes §9 giữ nguyên).

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/present/*.test.ts` | NEW/ĐỦ | integration đa template |
| `src/modules/present/*` (A–D) | MODIFY (chỉ nếu test fail) | fix tối thiểu, không đổi shape |
| `Design/Reports/Month3/W9/W9_QA_Report.md` | NEW | kết quả QC + DoD |
| `Design/Reports/Month3/W9/present_samples.md` | NEW | outline/timeline/speaker ≥2 template |
| `Design/Reports/Month3/W9/build_output.txt` | NEW | log 4 gates |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Outline lệch chapter flow ở template lạ | Medium | Test ≥2 template; outline theo `order` + heading (Group A). |
| Evidence ref gãy làm vỡ slide | Medium | Bỏ ref đã xoá + ghi chú (edge `5.Present.md §6`); test ref gãy. |
| QA report lệch format các tuần trước | Low | Theo `W8_QA_Report.md` + `Reports/README.md`. |
| Sửa lan sang shape khi fix test | Low | Chỉ fix tối thiểu; không đổi CanonicalTypes §9. |

## 6. Verification Plan
- software-project + lab-report → outline đúng số/thứ tự chương; title khớp heading.
- timeline tổng = Σ slot; vượt limit → cảnh báo.
- members 3 người → 3 speaker gán đều.
- evidence video → slide có `evidenceRefs`; ref xoá → bỏ, không vỡ.
- re-run generator cùng bundle → outline/timeline/speaker giống hệt (deterministic).
- lint/typecheck/test/build xanh; `build_output.txt` lưu.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `test(present): integration coverage (outline/timeline/speaker, multi-template)`; (2) `docs(w9): W9 QA report + present samples`; +1 docs commit.
