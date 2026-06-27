# Contract For AI — W16 Feat: AI Sinh Dàn Ý (Outline) — Tạo Khung Báo Cáo Thay Cho Điền Form Tay

> **Lane:** Core / break_task / week16_break.
> **Branch:** `feat/w16-ai-outline`.
> **Type:** Capability — finding **S1** (Med-High, `AiAction` đã có `"outline"` ([ai.ts:17](src/types/ai.ts#L17)) nhưng **không có nút/luồng nào dùng**; `AiAssistBar` chỉ wired `rewrite`/`tone` [AiAssistBar.tsx:44-84](src/modules/write/ai/AiAssistBar.tsx#L44)), **S2** (Med, người làm nhanh muốn "mô tả 1 câu → AI dựng khung mục" thay vì điền form metadata [ProjectInitializer](src/modules/write/ProjectInitializer.tsx)). Gốc nỗi đau #6. Review 2026-06-27.
> **Builds on:** `w16_feat_ai_adapter_server_route_register` (đường mạng) **bắt buộc trước**; `buildInitialSections`/`importReadme` để biến outline → sections.
> **Sources:** Review 2026-06-27; `CanonicalTypes.md §10`.

---

## 1. Micro-task Target

Cho phép sinh **dàn ý báo cáo bằng AI** từ một mô tả ngắn, rồi đổ thành sections — đường tắt mạnh nhất thay cho gõ form.

- **S1 — Action outline qua gateway.** Helper `generateOutline(prompt, gateway)` trong `ai/` gọi `requestSuggestion("outline", prompt)`; route dịch thành prompt sinh **markdown có heading depth 1–2** (định dạng để `importReadme` cắt được). Trả markdown → `importReadme()` → `ReportSection[]`.
- **S2 — Lối nhập "Tạo khung bằng AI".** Trên `ProjectInitializer` (lối thứ 4, cạnh 3 lối ở `w16_feat_quickstart_blank_*`) hoặc trong workspace: ô mô tả ngắn ("Báo cáo đồ án web bán hàng, 5 chương…") → bấm → AI trả outline → preview danh sách section → **xác nhận** mới áp (không tự ghi đè).
- **S3 — Guard trạng thái.** Nút chỉ bật khi `getGatewayState() === "ready"`; nếu `disabled`/`unconfigured` → dẫn tới Cài đặt AI (giống AiAssistBar). Không gọi mạng khi chưa ready.

> 🔒 **Phụ thuộc adapter** — không tự gọi provider; đi qua gateway/route đã chuẩn.
> 🔒 **Người dùng xác nhận trước khi áp outline** (không ghi đè bài đang có).
> 🔒 **Tái dùng `importReadme`** để chuyển markdown→sections, không parser mới. Token-only + giọng `VoiceAndContent §7`.

## 2. Scope

### In scope
- `src/modules/write/ai/generate-outline.ts` (NEW): `generateOutline` + map sang sections (qua `importReadme`).
- `src/modules/write/ai/generate-outline.test.ts` (NEW): mock gateway.
- [src/modules/write/ProjectInitializer.tsx](src/modules/write/ProjectInitializer.tsx) (MODIFY) hoặc panel workspace: ô mô tả + preview + xác nhận.
- [src/app/api/ai/route.ts](src/app/api/ai/route.ts) (MODIFY): prompt cho action `outline`.
- [src/modules/write/index.ts](src/modules/write/index.ts) (MODIFY): export.
- [src/app/globals.css](src/app/globals.css) (MODIFY): style (token).

### Out of scope
- ❌ Dựng adapter/route (→ `w16_feat_ai_adapter_server_route_register`).
- ❌ rewrite/tone/whole-report (contract khác).
- ❌ MCP (→ `w16_decide_mcp_*`).

## 3. Checklist
- [ ] **S1** `generateOutline` gọi action "outline", trả markdown→sections qua `importReadme`.
- [ ] **S2** Có ô mô tả + preview outline + xác nhận trước khi áp.
- [ ] **S3** Nút guard theo `GatewayState`; chưa ready → dẫn Cài đặt, không fetch.
- [ ] Không ghi đè bài đang có khi chưa xác nhận.
- [ ] 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/write/ai/generate-outline.ts` | NEW | outline→sections |
| `src/modules/write/ai/generate-outline.test.ts` | NEW | mock gateway |
| `src/modules/write/ProjectInitializer.tsx` | MODIFY | ô mô tả + preview |
| `src/app/api/ai/route.ts` | MODIFY | prompt outline |
| `src/modules/write/index.ts` | MODIFY | export |
| `src/app/globals.css` | MODIFY | style (token) |

> **Import boundary:** không lib mới. Mạng chỉ qua route đã có.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Outline AI không có heading hợp lệ | Med | Prompt ép heading depth 1–2; `importReadme` fallback 1 section. |
| Ghi đè bài đang viết | Med | Preview + xác nhận; mặc định "chèn" hơn "thay". |
| Gọi khi chưa ready | Low | Guard `GatewayState`. |

## 6. Verification Plan
- AI ready + nhập mô tả → preview các section → áp → editor có khung.
- AI off → nút dẫn Cài đặt, không fetch.
- 4 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit: `feat(ai): generate report outline from a short prompt into sections`.
