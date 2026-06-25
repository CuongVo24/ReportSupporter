# Contract For AI - W11 Group E: Off-state Verify & QA

> **Lane / Week:** Core / Month 3 / W11 - Day 5 (`Design/TaskBrief/Core/month3/w11.md` `[C124]`-`[C125]`).
> **Branch:** `feature/W11-ai-assistant`.
> **Builds on:** Groups A–D (gateway/flag + outline-assist + rewrite + tone + control bar).
> **Depended on by:** W12 beta (demo chạy được khi tắt AI), Phase 3 quality gate.
> **Sources:** `w11.md` Locked #1/#2, `MasterRoadMap.md` W11, `Conventions/WorkFlow.md` (DoD), `ProductPRD.md §6/§7`.

---

## 1. Micro-task Target

**Verify off-state + QA**: tắt AI flag → toàn bộ app W1–W10 chạy đủ tính năng, không có đường gọi AI/fetch active; mọi AI action chỉ sau explicit click + suggestion không tự ghi đè. Chạy 4 gates + viết QA evidence W11.

> **🔒 Verify, không thêm logic (Locked #1).** Group E mở rộng test + evidence; chỉ sửa A–D nếu test lộ lỗi thật.
> **🔒 Off-state = app đủ tính năng (Locked #2).** OFF không gọi gì; AI là điểm cộng.

## 2. Scope

### In scope (`[C124]`/`[C125]`)
- `src/modules/write/ai/ai-config.test.ts` + `ai-gateway.test.ts` (**NEW**): flag OFF → **không** gọi gateway/fetch; unconfigured → trạng thái, không throw; suggestion không mutate gốc.
- (Chỉ khi test lộ lỗi) sửa tối thiểu A–D — không đổi shape AI (`CanonicalTypes §10`).
- QA evidence: `Design/Reports/Month3/W11/W11_QA_Report.md` (map DoD + AI control), `ai_control_evidence.md` (off-state vs explicit-action + diff accept/reject), `build_output.txt`.

### Out of scope
- ❌ Thêm logic/tính năng AI (Groups A–D).
- ❌ Cài AI provider/SDK (ngoài stack — approve riêng).

## 3. Checklist
- [ ] Flag OFF → không gọi gateway/fetch (grep no-network).
- [ ] Unconfigured → trạng thái, không throw; app W1–W10 path không phụ thuộc AI.
- [ ] Mọi AI action sau explicit click; suggestion không tự ghi đè.
- [ ] `Design/Reports/Month3/W11/` có QA report + control evidence + build output.
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/write/ai/ai-config.test.ts` | NEW | off-state không gọi gì |
| `src/modules/write/ai/ai-gateway.test.ts` | NEW | unconfigured/no-network |
| `src/modules/write/ai/*` (A–D) | MODIFY (chỉ nếu test fail) | fix tối thiểu, không đổi shape |
| `Design/Reports/Month3/W11/W11_QA_Report.md` | NEW | DoD + AI control |
| `Design/Reports/Month3/W11/ai_control_evidence.md` | NEW | off-state + diff evidence |
| `Design/Reports/Month3/W11/build_output.txt` | NEW | gate log |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Lén có đường AI/fetch active khi off | High | grep no-network; test off-state (Locked #2). |
| AI thành bắt buộc | High | App W1–W10 path không phụ thuộc AI (test). |
| Suggestion tự ghi đè | Medium | Test accept/reject; không mutate gốc. |
| QA report lệch format | Low | Theo `W10_QA_Report.md` + `Reports/README.md`. |

## 6. Verification Plan
- Tắt flag → chạy E2E path W1–W10 (template→write→check→export→present) đủ tính năng, no fetch AI.
- Bật flag + explicit click (gateway giả lập) → suggestion hiện diff; reject giữ nguyên.
- grep: không `fetch`/AI client active khi off.
- lint/typecheck/test/build xanh; `build_output.txt` lưu.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `test(ai): off-state + control coverage (no-network, no-overwrite)`; `docs(reports): add W11 QA + AI control evidence`; `docs(ai): commit w11e contract`.
