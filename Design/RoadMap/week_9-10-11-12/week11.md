# 📅 WEEK 11: OPTIONAL AI ASSISTANT

> Phase 3 — Present & AI Layer (W9-W12). Reference: `Design/RoadMap/MasterRoadMap.md` §Week 11.

---

## 1. 🎯 Week Goal / Theme

**Theme:** *Add AI help as an explicit, optional, user-controlled layer — never automatic.*

Tuần 11 là tuần **duy nhất** AI được phép xuất hiện (`ProductPRD.md` §6 cấm AI ở Phase 1; MasterRoadMap đặt AI **optional** ở W11). Nguyên tắc tối cao: AI **chỉ chạy sau hành động rõ ràng của user** (explicit action), **giữ user content control luôn hiển thị**, và mọi tính năng phải hoạt động bình thường **khi tắt AI**. AI là lớp phủ tùy chọn, không phải lõi sản phẩm.

Mục tiêu chốt từ MasterRoadMap:
- Add AI-assisted outline generation behind explicit user action.
- Add section rewrite suggestions.
- Add academic tone improvement.
- Keep user content control visible.

---

## 2. 🧩 Context — Modules & Dependencies

- **Builds:** lớp AI tùy chọn phủ lên Module 1 (Write) + Module 5 (Present).
- **Depends on:** W9 outline generator (AI nâng cấp outline), W2 editor (rewrite vào section), W10 script (AI có thể cải tiến).
- **Depended on by:** W12 (beta readiness — demo có/không AI đều phải chạy).
- **Constraint:** AI là **optional**. Tắt AI → app W1-W10 vẫn đầy đủ tính năng.

---

## 3. 🔭 Scope

### ✅ In scope
- AI feature flag (mặc định OFF) + cấu hình do user bật.
- AI-assisted outline generation — chỉ chạy khi user bấm nút rõ ràng.
- Section rewrite suggestions — hiển thị dạng đề xuất, user accept/reject (không tự ghi đè).
- Academic tone improvement — tương tự, đề xuất có kiểm soát.
- User content control visible: luôn thấy bản gốc, diff, nút hoàn tác.

### ⛔ Out of scope
- AI tự động chạy nền / auto-rewrite (vi phạm "behind explicit user action").
- AI bắt buộc để dùng sản phẩm (phải optional).
- AI ghi đè nội dung không qua confirm.
- Bất kỳ tính năng AI nào ngoài 3 mục trên (outline/rewrite/tone).

> ⚠️ **Provider/SDK chưa nằm trong `TechnicalStack.md`.** Việc chọn AI provider + SDK là **lib/integration ngoài stack đã khoá** → **bắt buộc xin approve** trước khi cài (`VibeCode.md` §4 cấm import lậu; `TechnicalStack.md` AI RULE). Tuần này thiết kế lớp AI **provider-agnostic** sau cổng explicit-action; integration cụ thể chỉ làm sau khi user duyệt.

---

## 4. 🛠️ Task Breakdown (Day 1 → Day 5)

> Branch: `feature/W11-ai-assistant`. **Contract-first bắt buộc** (đụng ranh giới stack).

### Day 1 — AI Layer Design & Flag
- `[NEW]` `src/types/ai.ts` (`AiSuggestion`, `AiAction` union: outline | rewrite | tone)
- `[NEW]` `src/modules/write/ai/ai-config.ts` (feature flag, mặc định OFF)
- `[NEW]` `src/modules/write/ai/ai-gateway.ts` (interface provider-agnostic — *không* hard-code provider)

### Day 2 — Explicit-action Outline Assist
- `[NEW]` `src/modules/present/ai/assist-outline.ts` (chỉ gọi khi user bấm)
- `[NEW]` `src/modules/present/ai/AiOutlineButton.tsx` (nút rõ ràng + trạng thái)

### Day 3 — Section Rewrite Suggestions
- `[NEW]` `src/modules/write/ai/rewrite-section.ts` (trả suggestion, không ghi đè)
- `[NEW]` `src/modules/write/ai/SuggestionDiff.tsx` (hiển thị diff gốc ↔ đề xuất, accept/reject)

### Day 4 — Academic Tone Improvement
- `[NEW]` `src/modules/write/ai/improve-tone.ts`
- `[MODIFY]` `src/modules/write/ai/SuggestionDiff.tsx` (dùng chung cho rewrite + tone)
- `[NEW]` `src/modules/write/ai/UserControlBar.tsx` (luôn hiển thị bản gốc + undo)

### Day 5 — Off-state Verify & QA
- Kiểm chứng: tắt AI flag → toàn bộ app W1-W10 chạy đủ tính năng.
- `[NEW]` `src/modules/write/ai/ai-config.test.ts` (off-state không gọi gì)
- `[NEW]` `Design/Reports/Month3/W11/W11_QA_Report.md`, `ai_control_evidence.md`, `build_output.txt`

---

## 5. 📦 Dependencies installed this week

> **Mặc định KHÔNG cài.** AI provider/SDK nằm ngoài `TechnicalStack.md`.

| Library | Why | Stack ref |
|---|---|---|
| *(AI provider/SDK — PENDING APPROVAL)* | Chọn provider AI là quyết định ngoài stack đã khoá → **xin approve trước khi cài** | AI RULE (`TechnicalStack.md` đầu file) |

> Lớp `ai-gateway.ts` thiết kế provider-agnostic để không lock-in; integration thật chỉ thực hiện sau khi user duyệt provider + cách lưu key (không hard-code secret).

---

## 6. 📤 Deliverables

- AI feature flag (default OFF) + config do user bật.
- AI-assisted outline generation (explicit action).
- Section rewrite suggestions (accept/reject, không tự ghi đè).
- Academic tone improvement (đề xuất có kiểm soát).
- User control bar luôn hiển thị bản gốc + undo + diff.
- Off-state verify: tắt AI → app vẫn đủ tính năng.
- `Design/Reports/Month3/W11/` QA + AI control evidence.

---

## 7. ⚠️ Risks

| Risk | Level | Mitigation |
|---|---|---|
| AI tự chạy / tự ghi đè nội dung | High | Mọi AI action sau explicit click; suggestion accept/reject, không auto-write. |
| AI trở thành bắt buộc | High | Feature flag OFF mặc định; off-state test app vẫn đủ tính năng. |
| Cài SDK ngoài stack không xin phép | High | Provider/SDK = ngoài stack → Contract-first + approve (`TechnicalStack.md` AI RULE). |
| Lộ/secret key hard-code | High | Không hard-code key; provider-agnostic gateway; user tự cấu hình. |
| Mất user content control | Medium | UserControlBar luôn hiện bản gốc + undo + diff (`MasterRoadMap` W11). |

---

## 8. ✅ Definition of Done

- [ ] `npm run lint` + `typecheck` + `build` xanh.
- [ ] `Vitest` xanh (ai-config off-state không gọi gì).
- [ ] AI flag mặc định OFF; tắt AI → app W1-W10 chạy đủ tính năng.
- [ ] Outline/rewrite/tone chỉ chạy sau explicit user action.
- [ ] Suggestion hiển thị diff, accept/reject, không tự ghi đè.
- [ ] User content control (bản gốc + undo) luôn hiển thị.
- [ ] Không cài AI provider/SDK ngoài stack khi chưa approve.
- [ ] Evidence tại `Design/Reports/Month3/W11/`.
- [ ] Commit kèm contract, branch `feature/W11-ai-assistant`.
