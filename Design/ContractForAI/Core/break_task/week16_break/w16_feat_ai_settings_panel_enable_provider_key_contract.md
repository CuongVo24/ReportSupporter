# Contract For AI — W16 Feat: Màn Cài Đặt AI — Bật Tính Năng + Chọn Provider + Nhập API Key

> **Lane:** Core / break_task / week16_break.
> **Branch:** `feat/w16-ai-settings`.
> **Type:** Capability / dead-affordance fix — finding **S1** (High, kiến trúc AI dựng đủ nhưng **không có UI bật**: `saveAiConfig` ([ai-config.ts:69](src/modules/write/ai/ai-config.ts#L69)) chưa component nào gọi; cờ mặc định OFF [ai-config.ts:28](src/modules/write/ai/ai-config.ts#L28) → `getGatewayState()` luôn `disabled` → 2 nút trong [AiAssistBar.tsx:91-117](src/modules/write/ai/AiAssistBar.tsx#L91) **luôn disabled** với note "Bật AI trong cấu hình" trỏ tới màn không tồn tại [AiAssistBar.tsx:118-122](src/modules/write/ai/AiAssistBar.tsx#L118)), **S2** (Med, `AiConfig` ([ai.ts:48-57](src/types/ai.ts#L48)) chỉ có `enabled`+`provider`, **thiếu chỗ chứa key/model**). Gốc nỗi đau #1 + nửa câu hỏi "nối API kiểu gì". Review 2026-06-27.
> **Builds on:** W11 AI layer — `loadAiConfig`/`saveAiConfig`/`isAiReady` ([ai-config.ts](src/modules/write/ai/ai-config.ts)), `AiConfig`/`GatewayState` ([ai.ts](src/types/ai.ts)).
> **Sources:** Review 2026-06-27; `VoiceAndContent.md §7`; `CanonicalTypes.md §10`.

---

## 1. Micro-task Target

Cho người dùng **bật AI + chọn provider + nhập key** từ một màn Cài đặt. Contract này **chỉ lo config + UI**; phần adapter/đường mạng nằm ở `w16_feat_ai_adapter_server_route_register` (tách để rủi ro thấp trước).

- **S1 — Màn/Dialog "Cài đặt AI".** Mở từ note hiện có trong `AiAssistBar` (biến "Bật AI trong cấu hình" thành **link/nút** thật) và/hoặc từ topbar. Gồm: toggle `enabled`; chọn `provider` (vd `openai` | `gemini` | `anthropic`); ô nhập **API key**; (tùy chọn) chọn `model`. Lưu qua `saveAiConfig`. Hiển thị `GatewayState` hiện tại để user biết đã "ready" chưa.
- **S2 — Mở rộng `AiConfig` (có chủ đích, ghi rõ).** Thêm field tùy chọn vào [ai.ts](src/types/ai.ts) + `aiConfigSchema`: `apiKey?: string`, `model?: string`. **Cảnh báo bảo mật:** key lưu trong `localStorage` (qua `saveAiConfig`) **chỉ chấp nhận khi đi cùng** route server-side ở contract adapter — *hoặc* contract adapter sẽ chuyển sang **không lưu key ở client** (server đọc từ env). Quyết định cuối khóa ở contract adapter; ở đây để field optional + cảnh báo rõ trong UI ("Key lưu cục bộ trên máy bạn").
- **S3 — `isAiReady` phản ánh đúng.** Sau khi lưu enabled+provider(+key theo chiến lược chốt), `getGatewayState()` chuyển khỏi `disabled`; `AiAssistBar` mở nút khi đã ready *và* có adapter (adapter thuộc contract sau — nên ở contract này nút có thể vẫn `unconfigured` cho tới khi adapter đăng ký).

> 🔒 **Không gọi mạng ở contract này** — chỉ đọc/ghi config. Mạng + key handling thật ở `w16_feat_ai_adapter_server_route_register`.
> 🔒 **Cảnh báo privacy tường minh trong UI:** bật AI = nội dung section sẽ được gửi tới provider khi dùng. Mặc định vẫn OFF.
> 🔒 **Không key/secret hardcode.** Schema đổi phải đồng bộ `CanonicalTypes.md §10`. Token-only + giọng `VoiceAndContent §7`.

## 2. Scope

### In scope
- [src/types/ai.ts](src/types/ai.ts) (MODIFY): `apiKey?`, `model?` vào `AiConfig` + `aiConfigSchema`.
- [src/modules/write/ai/ai-config.ts](src/modules/write/ai/ai-config.ts) (MODIFY nếu cần): giữ load/save tương thích field mới (đã dùng schema nên chủ yếu là schema).
- `src/modules/write/ai/AiSettingsPanel.tsx` (NEW): dialog/panel cài đặt.
- `src/modules/write/ai/AiSettingsPanel.test.tsx` (NEW).
- [src/modules/write/ai/AiAssistBar.tsx](src/modules/write/ai/AiAssistBar.tsx) (MODIFY): note → mở Cài đặt.
- [src/modules/write/index.ts](src/modules/write/index.ts) (MODIFY): export panel.
- [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY): chỗ mở Cài đặt (topbar/side panel).
- [src/app/globals.css](src/app/globals.css) (MODIFY): style (token).

### Out of scope
- ❌ Adapter + route server + `registerAdapter` (→ `w16_feat_ai_adapter_server_route_register`).
- ❌ Action outline / whole-report (→ contract AI tương ứng).
- ❌ MCP (→ `w16_decide_mcp_*`).

## 3. Checklist
- [ ] **S1** Dialog Cài đặt AI mở được từ AiAssistBar/topbar; toggle + provider + key + (model).
- [ ] **S1** Lưu qua `saveAiConfig`; hiển thị `GatewayState`.
- [ ] **S2** `AiConfig`/schema có `apiKey?`/`model?`; `CanonicalTypes §10` cập nhật.
- [ ] **S3** Bật xong, state rời `disabled`; privacy warning hiển thị.
- [ ] Mặc định vẫn OFF khi chưa từng cấu hình.
- [ ] 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/types/ai.ts` | MODIFY | `apiKey?`, `model?` |
| `src/modules/write/ai/AiSettingsPanel.tsx` | NEW | UI cài đặt |
| `src/modules/write/ai/AiSettingsPanel.test.tsx` | NEW | test |
| `src/modules/write/ai/AiAssistBar.tsx` | MODIFY | note → link Cài đặt |
| `src/modules/write/ai/ai-config.ts` | MODIFY | tương thích field mới |
| `src/modules/write/index.ts` | MODIFY | export |
| `src/components/Workspace.tsx` | MODIFY | mở Cài đặt |
| `src/app/globals.css` | MODIFY | style (token) |

> **Import boundary:** không lib mới. Không mạng ở contract này.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Key trong localStorage lộ qua XSS | High | Cảnh báo UI; chiến lược cuối ưu tiên **server giữ key** (chốt ở contract adapter). |
| User bật nhưng chưa có adapter → tưởng hỏng | Med | Hiển thị `GatewayState` "unconfigured" + giải thích cần bước kế. |
| Schema đổi phá load config cũ | Med | Field optional; `safeParse` đã fallback default. |

## 6. Verification Plan
- Mở Cài đặt → bật + nhập provider/key → lưu → reload vẫn còn (load đúng).
- `getGatewayState()` rời `disabled` sau khi cấu hình.
- Privacy warning hiển thị; mặc định OFF khi sạch config.
- 4 gate xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit: `feat(ai): AI settings panel to enable feature, choose provider and key`.
