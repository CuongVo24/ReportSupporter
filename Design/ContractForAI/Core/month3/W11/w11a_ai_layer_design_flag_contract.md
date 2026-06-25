# Contract For AI - W11 Group A: AI Layer Design & Flag

> **Lane / Week:** Core / Month 3 / W11 - Day 1 (`Design/TaskBrief/Core/month3/w11.md` `[C116]`-`[C117]`).
> **Branch:** `feature/W11-ai-assistant`.
> **Builds on:** W1 canonical types, W2 editor (`ReportSection`), W9/W10 Present (`SlideOutline`), `ProductPRD.md §6` (AI policy), `TechnicalStack` AI RULE.
> **Depended on by:** Group B–E (mọi AI action qua gateway + flag), W12 beta (demo có/không AI).
> **Sources:** `w11.md` Locked #1/#2/#3, `MasterRoadMap.md` W11, `VibeCode.md §4` (no import lậu).

---

## 1. Micro-task Target

Thiết kế **lớp AI provider-agnostic** + **feature flag (mặc định OFF)**: type AI canonical, config flag, và gateway interface trừu tượng. Chưa approve provider → gateway trả `unconfigured`, **không fetch**.

> **🔒 Flag OFF mặc định (Locked #2).** OFF → không gọi gì; app W1–W10 không phụ thuộc AI.
> **🔒 Provider-agnostic, không cài lậu (Locked #3).** Gateway là interface; chọn provider/SDK ngoài stack → approve trước khi cài; không hard-code key.

## 2. Scope

### In scope (`[C116]`/`[C117]`)
- `src/types/ai.ts` (**NEW**) + `CanonicalTypes.md §10` (MODIFY): `AiAction` (`outline|rewrite|tone`), `AiSuggestion` (`{ id, action, original, suggestion, accepted? }`), `AiConfig` (`{ enabled: boolean; provider?: string }`) + zod.
- `src/modules/write/ai/ai-config.ts` (**NEW**): đọc/ghi flag (mặc định `enabled:false`); OFF → không gọi gateway.
- `src/modules/write/ai/ai-gateway.ts` (**NEW**): `requestSuggestion(action, input): Promise<AiSuggestion>`; unconfigured → trạng thái `unconfigured`, **không** `fetch`.
- Export qua `write/index.ts`.

### Out of scope
- ❌ Outline-assist (Group B), rewrite (C), tone (D).
- ❌ Cài AI provider/SDK (ngoài stack — approve riêng).
- ❌ Đổi shape W2/W9/W10.

## 3. Checklist
- [ ] `AiAction`/`AiSuggestion`/`AiConfig` + zod ở `CanonicalTypes §10` + `@/types`.
- [ ] Flag mặc định OFF; OFF → không gọi gateway.
- [ ] Gateway provider-agnostic; unconfigured → không `fetch`, không throw.
- [ ] Không hard-code key/secret; không cài provider SDK.
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/types/ai.ts (+ CanonicalTypes §10)
export type AiAction = "outline" | "rewrite" | "tone";
export type AiSuggestion = { id: string; action: AiAction; original: string; suggestion: string; accepted?: boolean };
export type AiConfig = { enabled: boolean; provider?: string };

// src/modules/write/ai/ai-gateway.ts
export type GatewayState = "ready" | "unconfigured" | "disabled";
export function requestSuggestion(action: AiAction, input: string): Promise<AiSuggestion>;
```

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/types/ai.ts` | NEW | AI canonical types |
| `Design/Modules/Other/CanonicalTypes.md` | MODIFY | §10 AI model |
| `src/modules/write/ai/ai-config.ts` | NEW | feature flag (OFF) |
| `src/modules/write/ai/ai-gateway.ts` | NEW | provider-agnostic interface |
| `src/modules/write/index.ts` | MODIFY | export |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Cài SDK ngoài stack không xin phép | High | Gateway interface; approve trước khi cài (Locked #3). |
| Hard-code key/secret | High | Không nhúng secret; user tự cấu hình. |
| Flag default ON nhầm | Medium | Mặc định `enabled:false`; test off-state. |
| Re-declare type AI | Low | `CanonicalTypes §10` trước; `@/types`. |

## 6. Verification Plan
- Flag OFF → gọi gateway bị chặn ở caller; không `fetch` (grep no-network).
- Unconfigured → trả trạng thái, app không vỡ.
- lint/typecheck/test/build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. ⚠️ Approve **không** bao gồm cài AI provider/SDK (ngoài stack — Contract riêng). Đề xuất commit: `feat(ai): add ai types + config flag (off) + provider-agnostic gateway`; `docs(ai): commit w11a contract`.
