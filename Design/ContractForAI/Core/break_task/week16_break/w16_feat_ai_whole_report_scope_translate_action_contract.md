# Contract For AI — W16 Feat: AI Mức Toàn Báo Cáo + Action Dịch / Chuẩn Hóa Thuật Ngữ

> **Lane:** Core / break_task / week16_break.
> **Branch:** `feat/w16-ai-scope-translate`.
> **Type:** Capability / depth — finding **S1** (Med, AI hiện **chỉ theo từng section** — `AiAssistBar` nhận đúng `section` đang mở [AiAssistBar.tsx:18](src/modules/write/ai/AiAssistBar.tsx#L18), [Workspace.tsx:292-295](src/components/Workspace.tsx#L292); không có thao tác trên toàn báo cáo), **S2** (Low-Med, thiếu action thực dụng cho sinh viên: **dịch** Anh↔Việt / **chuẩn hóa thuật ngữ** học thuật — `AiAction` mới). Gốc nỗi đau #7. Review 2026-06-27.
> **Builds on:** `w16_feat_ai_adapter_server_route_register` (đường mạng) **bắt buộc trước**; `AiAction`/gateway.
> **Sources:** Review 2026-06-27; `CanonicalTypes.md §10`; `VoiceAndContent.md §7`.

---

## 1. Micro-task Target

Mở rộng AI ra **phạm vi toàn báo cáo** và thêm action **dịch/chuẩn hóa thuật ngữ** — vẫn theo mẫu suggestion→diff→accept đã có (an toàn, không tự ghi).

- **S1 — Action "translate"/"terminology".** Thêm vào `AiAction` ([ai.ts:17](src/types/ai.ts#L17)) + `aiActionSchema` các giá trị mới (vd `"translate"`, `"terminology"`), prompt tương ứng trong route. Helper `improveTerminology`/`translateSection` cùng khuôn `rewriteSection`/`improveTone` (trả `AiSuggestion`, đi qua `SuggestionDiff`/`UserControlBar` — không tự áp).
- **S2 — Phạm vi toàn báo cáo.** Cho chạy action trên **toàn bộ sections** (ghép theo `order`, hoặc lặp từng section gom kết quả). Phải có **preview/diff theo từng section + xác nhận** trước khi áp; tránh một cú ghi đè cả báo cáo. Cân nhắc chi phí token → cảnh báo nhẹ khi báo cáo dài.
- **S3 — Guard + privacy.** Như các action AI khác: chỉ chạy khi `ready`; toàn-báo-cáo gửi nhiều nội dung hơn → nhắc người dùng. Flag OFF → no-op.

> 🔒 **Không tự áp** — mọi kết quả qua diff + accept của user.
> 🔒 **Mở rộng `AiAction` có chủ đích** — đồng bộ `CanonicalTypes.md §10` + `aiActionSchema`.
> 🔒 **Phụ thuộc adapter/route.** Token-only + giọng `VoiceAndContent §7`.

## 2. Scope

### In scope
- [src/types/ai.ts](src/types/ai.ts) (MODIFY): thêm action mới vào type + schema.
- `src/modules/write/ai/translate-section.ts` + `improve-terminology.ts` (NEW) + test (NEW).
- [src/modules/write/ai/AiAssistBar.tsx](src/modules/write/ai/AiAssistBar.tsx) (MODIFY): nút action mới.
- Một entry "AI toàn báo cáo" (panel/side) (MODIFY/NEW nhỏ): chạy + diff theo section + xác nhận.
- [src/app/api/ai/route.ts](src/app/api/ai/route.ts) (MODIFY): prompt cho action mới.
- [src/modules/write/index.ts](src/modules/write/index.ts) (MODIFY): export.

### Out of scope
- ❌ Adapter/route nền (→ `w16_feat_ai_adapter_server_route_register`).
- ❌ Outline (→ `w16_feat_ai_outline_*`).
- ❌ MCP (→ `w16_decide_mcp_*`).

## 3. Checklist
- [ ] **S1** Action `translate`/`terminology` có trong type+schema+route+helper, qua diff/accept.
- [ ] **S2** Chạy toàn báo cáo: diff theo section + xác nhận; không ghi đè 1 phát.
- [ ] **S3** Guard `GatewayState`; nhắc khi báo cáo dài; OFF → no-op.
- [ ] 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/types/ai.ts` | MODIFY | action mới + schema |
| `src/modules/write/ai/translate-section.ts` | NEW | helper |
| `src/modules/write/ai/improve-terminology.ts` | NEW | helper |
| `src/modules/write/ai/*.test.ts` | NEW | mock gateway |
| `src/modules/write/ai/AiAssistBar.tsx` | MODIFY | nút action |
| `src/app/api/ai/route.ts` | MODIFY | prompt |
| `src/modules/write/index.ts` | MODIFY | export |

> **Import boundary:** không lib mới. Mạng chỉ qua route đã có.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Ghi đè cả báo cáo | High | Diff theo từng section + xác nhận; không auto-apply. |
| Chi phí token lớn | Med | Cảnh báo độ dài; cho chạy theo section. |
| Action mới phá exhaustiveness switch | Med | Cập nhật mọi nơi match trên `AiAction`; test type. |

## 6. Verification Plan
- Dịch 1 section → diff hiện, accept mới đổi.
- Chạy toàn báo cáo → diff theo section, xác nhận từng phần.
- OFF → no-op. 4 gate xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit: `feat(ai): whole-report scope + translate/terminology actions via diff-accept`.
