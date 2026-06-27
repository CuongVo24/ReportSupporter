# Contract For AI — W16 Feat: Adapter Provider Thật + Route Server Giữ Key + registerAdapter

> **Lane:** Core / break_task / week16_break.
> **Branch:** `feat/w16-ai-adapter`.
> **Type:** Capability / "nối API" — finding **S1** (High, `registerAdapter` ([ai-gateway.ts:48](src/modules/write/ai/ai-gateway.ts#L48)) **chưa được gọi ở đâu ngoài test** → `_adapter` luôn `null` → `requestSuggestion` luôn rơi vào nhánh no-op [ai-gateway.ts:85-94](src/modules/write/ai/ai-gateway.ts#L85); dù bật cờ AI vẫn không có gì gọi mạng), **S2** (High/bảo mật, chưa có đường gọi provider **không lộ key xuống browser** — app chưa có API route nào: chỉ [page.tsx](src/app/page.tsx)/[layout.tsx](src/app/layout.tsx)/dev gallery). Gốc nỗi đau #2 + nửa câu hỏi "nối API kiểu gì". Review 2026-06-27.
> **Builds on:** `w16_feat_ai_settings_panel_enable_provider_key` (config UI) **bắt buộc Approve trước**; `AiAdapter` interface ([ai-gateway.ts:29](src/modules/write/ai/ai-gateway.ts#L29)); `rewriteSection`/`improveTone` ([ai/](src/modules/write/ai)).
> **Sources:** Review 2026-06-27; `CanonicalTypes.md §10`; `TechnicalStack.md`.

---

## 1. Micro-task Target

Biến gateway "có khung" thành "gọi được": một adapter thật gọi provider qua **route server-side** (Next.js Route Handler) để key không xuống browser, rồi `registerAdapter` lúc app khởi động khi config ready.

- **S1 — Route Handler server-side.** `src/app/api/ai/route.ts` (NEW, App Router) nhận `{ action, input, provider, model }`, đọc **key từ biến môi trường server** (vd `OPENAI_API_KEY`/`GEMINI_API_KEY`/`ANTHROPIC_API_KEY`) — **không** nhận key từ client (chiến lược ưu tiên; chốt mâu thuẫn với field `apiKey?` ở contract settings: nếu giữ key client thì route nhận key qua header, nhưng **khuyến nghị server-env**). Gọi REST provider bằng `fetch` (không SDK), map về `{ suggestion: string }`. Xử lý lỗi/timeout, không lộ chi tiết key.
- **S2 — Adapter thoả `AiAdapter`.** `src/modules/write/ai/adapters/http-adapter.ts` (NEW): `request(action, input)` → `fetch("/api/ai", ...)` → trả `suggestion`. Thuần về mặt giao tiếp gateway; mọi chi tiết provider nằm sau route.
- **S3 — Đăng ký adapter.** Khi `loadAiConfig()` ready (enabled+provider), gọi `registerAdapter(httpAdapter)` (vd trong một effect ở `Workspace`/provider khởi tạo), và `registerAdapter(null)` khi tắt AI. Sau bước này `getGatewayState()` → `ready`, nút trong `AiAssistBar` mở, `rewriteSection`/`improveTone` chạy thật.
- **S4 — Mapping AiAction.** Route dịch `AiAction` ("rewrite"/"tone"/"outline") thành prompt phù hợp; giữ provider-agnostic ở gateway.

> 🔒 **Key không bao giờ xuống browser** (ưu tiên server-env). Nếu Approve chọn "key client" thì phải gửi qua header tới route, **không** nhúng vào bundle, và ghi rõ trade-off.
> 🔒 **Chỉ gọi mạng sau opt-in** (cờ AI ON). Flag OFF/unconfigured → giữ no-op như cũ ([ai-gateway.ts:85](src/modules/write/ai/ai-gateway.ts#L85)).
> 🔒 **Không SDK provider** — `fetch` REST. Privacy: cập nhật `Design/` PRD/privacy note rằng AI gửi nội dung section ra ngoài.
> 🔒 **Không đổi interface `AiAdapter`/gateway public** — chỉ implement + đăng ký.

## 2. Scope

### In scope
- `src/app/api/ai/route.ts` (NEW): Route Handler, đọc key env, fetch provider.
- `src/modules/write/ai/adapters/http-adapter.ts` (NEW): adapter → route.
- `src/modules/write/ai/adapters/http-adapter.test.ts` (NEW): mock fetch.
- [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY) hoặc một init module: `registerAdapter` theo config + cleanup khi tắt.
- [src/modules/write/index.ts](src/modules/write/index.ts) (MODIFY): export adapter nếu cần.
- `.env.example` (NEW/MODIFY): liệt kê key env (không giá trị thật).
- `Design/` PRD/privacy note (MODIFY): ghi AI gửi dữ liệu ra ngoài.

### Out of scope
- ❌ UI cài đặt (→ `w16_feat_ai_settings_panel_*`).
- ❌ Action outline/whole-report logic (→ contract tương ứng) — contract này chỉ làm đường ống chạy được cho rewrite/tone trước.
- ❌ MCP (→ `w16_decide_mcp_*`).

## 3. Checklist
- [ ] **S1** `/api/ai` nhận action+input, đọc key từ env server, gọi provider, trả `{suggestion}`; lỗi/timeout an toàn.
- [ ] **S2** `http-adapter` thoả `AiAdapter`, gọi route, test mock fetch.
- [ ] **S3** `registerAdapter` chạy khi ready; `null` khi tắt; `getGatewayState()` → `ready`.
- [ ] **S4** rewrite/tone trả kết quả thật (mock provider trong test).
- [ ] Flag OFF → tuyệt đối không fetch (test giữ no-op).
- [ ] Key không xuất hiện trong client bundle. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/app/api/ai/route.ts` | NEW | Route Handler, key env |
| `src/modules/write/ai/adapters/http-adapter.ts` | NEW | adapter→route |
| `src/modules/write/ai/adapters/http-adapter.test.ts` | NEW | mock fetch |
| `src/components/Workspace.tsx` | MODIFY | registerAdapter theo config |
| `src/modules/write/index.ts` | MODIFY | export |
| `.env.example` | NEW/MODIFY | key env mẫu |
| `Design/ProductPRD.md` (privacy) | MODIFY | note gửi dữ liệu ra ngoài |

> **Import boundary:** không SDK provider (fetch REST). Route server-side là ngoại lệ "offline" có chủ đích, chỉ chạy khi opt-in.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Lộ key | High | Key ở env server; client chỉ thấy `/api/ai`; không log key. |
| Phá cam kết offline/privacy | High | Chỉ fetch sau opt-in; non-AI flow vẫn offline; cập nhật PRD. |
| Provider đổi schema REST | Med | Cô lập mapping trong route; adapter ổn định. |
| Mâu thuẫn "key client" (settings) vs "key server" (route) | Med | Chốt 1 chiến lược khi Approve; mặc định server-env. |
| Static export/host không có server | Med | Ghi rõ cần runtime Node (Vercel/Node host); nếu host tĩnh thì AI tắt. |

## 6. Verification Plan
- Bật AI + cấu hình → bấm "Viết lại đoạn" → nhận kết quả (mock provider).
- Tắt AI → không có request tới `/api/ai` (test).
- Grep bundle client: không có key. 4 gate xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit: `feat(ai): http adapter + server route for provider calls, register on ready`.
