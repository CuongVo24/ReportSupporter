# Contract For AI - W10 Group E: Script/Q&A Integration & QA

> **Lane / Week:** Core / Month 3 / W10 - Day 5 (`Design/TaskBrief/Core/month3/w10.md` `[C114]`-`[C115]`).
> **Branch:** `feature/W10-script-qa`.
> **Builds on:** Groups A–D (script + Q&A + weak-section hints + panel), W9 outline/timeline/speaker, W3 Checker, W5 evidence, W6 templates (đa template verify).
> **Depended on by:** W11 (AI assistant optional trên cùng script/Q&A), W12 beta readiness, Phase 3 quality gate.
> **Sources:** `w10.md` Locked Decisions #1/#2, `MasterRoadMap.md` W10, `5.Present.md §8/§9` (QC + acceptance), prior `W9_QA_Report.md` format, `Reports/README.md`.

---

## 1. Micro-task Target

**Tích hợp + QA** Present W10: xác nhận script tham chiếu đúng screenshot/evidence (cue), Q&A bám nội dung section, weak-section hints khớp Checker, và toàn bộ baseline sinh **offline/không AI** — rồi chạy 4 gates + viết QA evidence W10 (đóng phần Present deterministic W9/W10 của Phase 3).

> **🔒 Verify, không thêm logic (Locked #1).** Group E mở rộng test + viết evidence; chỉ sửa A–D nếu test lộ lỗi thật (không đổi shape CanonicalTypes §9).
> **🔒 No-AI baseline + AI off (Locked #2).** QA khẳng định script/Q&A/hints sinh deterministic, offline; không có đường gọi AI active (AI để W11 sau explicit action) — `5.Present.md §8` "Test no-AI baseline" + "Test AI opt-in".

## 2. Scope

### In scope (`[C114]`/`[C115]`)
- `src/modules/present/*.test.ts` (NEW/đủ): integration đa template — script có cue đúng evidence/caption; Q&A bám tín hiệu (deploy→triển khai); weak-section hints khớp `CheckResult`; cùng input → cùng output (deterministic); no-network.
- (Chỉ khi test lộ lỗi) sửa tối thiểu A–D — không đổi shape Present.
- QA evidence: `Design/Reports/Month3/W10/W10_QA_Report.md` (map DoD `w10.md` + `5.Present.md §8/§9`), `present_script_samples.md` (script + Q&A + hints mẫu của ≥2 template, có cue evidence), `build_output.txt`.

### Out of scope
- ❌ Thêm logic script/Q&A/hints/panel (Groups A–D).
- ❌ AI rewrite (→ W11).
- ❌ Export PPTX/PDF slides (DEFERRED).
- ❌ Dep mới / network / AI.

## 3. Checklist
- [ ] Integration test đa template: script cue đúng evidence/caption.
- [ ] Q&A bám nội dung (deploy→triển khai…); weak-section hints khớp Checker.
- [ ] No-AI baseline + không đường AI active (khẳng định no-network).
- [ ] Deterministic (cùng input → cùng script/Q&A/hints).
- [ ] `Design/Reports/Month3/W10/` có QA report + script samples + build output.
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

> Chủ yếu test + evidence; không đổi interface (CanonicalTypes §9 giữ nguyên).

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/present/*.test.ts` | NEW/ĐỦ | integration script/Q&A/hints đa template |
| `src/modules/present/*` (A–D) | MODIFY (chỉ nếu test fail) | fix tối thiểu, không đổi shape |
| `Design/Reports/Month3/W10/W10_QA_Report.md` | NEW | kết quả QC + DoD |
| `Design/Reports/Month3/W10/present_script_samples.md` | NEW | script/Q&A/hints ≥2 template |
| `Design/Reports/Month3/W10/build_output.txt` | NEW | log 4 gates |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Script/Q&A không bám nội dung ở template lạ | Medium | Test ≥2 template; cue/Q&A theo tín hiệu thật (Groups A/B). |
| Hints lệch Checker (drift) | Medium | Hints đọc `CheckResult` (Group C); test khớp issue. |
| Lén có đường AI/fetch | Medium | grep no-network; test no-active-AI (Locked #2). |
| QA report lệch format các tuần trước | Low | Theo `W9_QA_Report.md` + `Reports/README.md`. |

## 6. Verification Plan
- software-project + internship-report → script cue đúng (Hình N / demo evidence); Q&A bám nội dung.
- weak-section hints khớp `CheckResult.issues` theo section.
- re-run generator cùng bundle → script/Q&A/hints giống hệt (deterministic).
- grep: không `fetch`/AI client trong module Present.
- lint/typecheck/test/build xanh; `build_output.txt` lưu.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `test(present): integration coverage (script/Q&A/hints, multi-template)`; (2) `docs(w10): W10 QA report + script samples`; +1 docs commit. Đóng Present deterministic baseline (W9/W10, Phase 3).
