# Contract For AI - W5 Group E: Checker Reconciliation & QA

> **Lane / Week:** Core / Month 2 / W5 - Day 5 (`Design/TaskBrief/Core/month2/w5.md` `[C64]`-`[C65]`).
> **Branch:** `feature/W5-evidence-kit`.
> **Builds on:** Groups A–D (Evidence module), W3 `evidence-gaps.ts` (`missing-required-evidence`/`broken-evidence-url-shape`/`missing-project-links` — **already read `bundle.evidence`**).
> **Depended on by:** W8 submission package; Phase 2 quality gate.
> **Sources:** `w5.md` Locked Decisions #6, `week5.md` Day 5, `Support.Evidence.md §6` (QC), `3.Check.md §5.2`, prior `W3_QA_Report.md` format.

---

## 1. Micro-task Target

**Xác nhận** checker đã đối chiếu đúng dữ liệu Evidence-Kit thật (rule đã có từ W3 — không viết lại), **mở rộng test** cho dữ liệu do UI W5 tạo, rồi chạy 4 gates và viết QA evidence W5.

> **🔒 Verify, không rewrite (Locked #6).** `missing-required-evidence`/`broken-evidence-url-shape`/`missing-project-links` đã consume `bundle.evidence` từ W3 + W3-break. W5 chỉ **bổ sung test coverage** cho item sinh từ Evidence panel; chỉ sửa rule nếu test lộ lỗi thật.

## 2. Scope

### In scope (`[C64]`/`[C65]`)
- `src/modules/check/rules/evidence-gaps.test.ts` (MODIFY/EXTEND): phủ luồng W5 với `EvidenceItem` thật:
  - software template + `requiredEvidenceKinds:["github","video","deploy"]`, `bundle.evidence` thiếu `video` → `missing-required-evidence` (error) đúng kind thiếu.
  - evidence có `url` shape sai (vd `"abc"`) → `broken-evidence-url-shape` (warning), **không** network.
  - evidence cấp đủ github/deploy (kind) → **không** `missing-project-links` (đã fix W3-break; khẳng định không hồi quy).
- (Chỉ khi test lộ lỗi) sửa tối thiểu `evidence-gaps.ts` — **không** đổi shape, không đổi rule id.
- QA evidence: `Design/Reports/Month2/W5/W5_QA_Report.md` (kết quả map `Support.Evidence.md §6` QC + `week5.md` DoD), `evidence_samples.md` (vài evidence mẫu → appendix table + QR + issues checker), `build_output.txt`.

### Out of scope
- ❌ Viết lại rule checker (đã có W3 — chỉ verify/extend test).
- ❌ Thay đổi Evidence UI/appendix/QR (Groups B/C/D).
- ❌ `evidence.zip` đóng gói (→ W8).
- ❌ Dep mới / network.

## 3. Checklist
- [ ] `evidence-gaps.test.ts` phủ: required-kind thiếu · url shape sai · link đủ không false-positive — với `EvidenceItem` thật.
- [ ] Rule ids/severity giữ nguyên (`missing-required-evidence` error, `broken-evidence-url-shape` warning).
- [ ] Checker chạy offline (no network) — test khẳng định.
- [ ] `Design/Reports/Month2/W5/` có QA report + evidence samples + build output.
- [ ] 4 gates xanh (lint/typecheck/test/build).

## 4. Expected Interfaces / Files

> Chủ yếu test + evidence; **không** đổi interface rule (CanonicalTypes §6 giữ nguyên).

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/check/rules/evidence-gaps.test.ts` | MODIFY | +case W5 (required-kind / url-shape / no-false-positive) |
| `src/modules/check/rules/evidence-gaps.ts` | MODIFY (chỉ nếu test fail) | fix tối thiểu, không đổi id/shape |
| `Design/Reports/Month2/W5/W5_QA_Report.md` | NEW | kết quả QC (`Support.Evidence.md §6`) + DoD |
| `Design/Reports/Month2/W5/evidence_samples.md` | NEW | evidence mẫu → appendix + QR + issues |
| `Design/Reports/Month2/W5/build_output.txt` | NEW | log 4 gates |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Rule rewrite ngoài ý (drift) | Medium | Chỉ verify/extend test; sửa rule chỉ khi test fail, không đổi id/shape (Locked #6). |
| Test phụ thuộc network | High | Evidence rule offline; test không mock fetch (không có fetch để mock). |
| QA report lệch format các tuần trước | Low | Theo `W3_QA_Report.md` + `Reports/README.md`. |
| Required-evidence test giả định template chưa đăng ký | Medium | Dùng `software-project` template (đã trong `getTemplateSchema`); nêu rõ template dùng. |

## 6. Verification Plan
- software template thiếu `video` evidence → `missing-required-evidence` (error), message nêu kind thiếu.
- evidence url `"abc"` → `broken-evidence-url-shape` (warning); không network call.
- evidence đủ github+deploy → **0** `missing-project-links`.
- re-run checker cùng bundle → cùng tập issue (idempotent, trừ `ranAt`).
- `evidence_samples.md` chứng minh appendix + QR + issues end-to-end.
- lint/typecheck/test/build xanh; `build_output.txt` lưu.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `test(check): evidence-gaps coverage for W5 evidence-kit data`; (2) `docs(w5): W5 QA report + evidence samples`; +1 docs commit. Đóng Evidence Kit (Phase 2 mở màn).
