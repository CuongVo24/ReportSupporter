# Contract For AI - W5 Group A: Evidence Foundation & Validation

> **Lane / Week:** Core / Month 2 / W5 - Day 1 (`Design/TaskBrief/Core/month2/w5.md` `[C56]`-`[C57]`).
> **Branch:** `feature/W5-evidence-kit`.
> **Builds on:** W1 canonical `EvidenceKind`/`EvidenceItem` (`src/types/evidence.ts`) + `evidenceItemSchema` (`src/types/schemas.ts`) — **already shipped**.
> **Depended on by:** Group B (form/panel use `kindMeta` + `validateEvidence`), Group C/D (appendix/QR), Group E (checker reconciliation).
> **Sources:** `w5.md` Locked Decisions #1/#2/#5, `week5.md` Day 1, `Support.Evidence.md §3`, `CanonicalTypes.md §2`.

---

## 1. Micro-task Target

Đặt nền cho module Evidence: **xác nhận** type/schema canonical đã có (W1) — **không khai báo lại** — và thêm hai mảnh mới của module: bảng metadata cho 9 evidence kind (label/icon cho UI) và hàm `validateEvidence` (offline, kiểm **shape** URL, không fetch).

> **🔒 Reuse, không re-declare (Locked #1).** `EvidenceKind`/`EvidenceItem` sống một lần ở `CanonicalTypes.md §2` → `src/types/evidence.ts`. Group A chỉ *consume*. Đổi shape ⇒ sửa `CanonicalTypes.md` trước.
> **🔒 Offline (Locked #2).** `validateEvidence` chỉ kiểm cú pháp URL (`new URL()` / zod), **không** `fetch`.

## 2. Scope

### In scope (`[C56]`/`[C57]`)
- `src/modules/evidence/kind-meta.ts`: `export const kindMeta: Record<EvidenceKind, { label: string; icon: string }>` — 9 kind (`video`/`github`/`deploy`/`drive`/`figma`/`account`/`api-docs`/`slide`/`other`), label tiếng Việt (vd `video → "Video demo"`, `github → "Mã nguồn (GitHub)"`), icon là ký tự/emoji ngắn (a11y kèm label, không chỉ màu).
- `src/modules/evidence/validate.ts`: `validateEvidence(input: unknown): { ok: true; item: EvidenceItem } | { ok: false; errors: Record<string,string> }` — parse qua `evidenceItemSchema`; `url` optional, nếu có thì kiểm shape (`new URL()` không throw, có protocol http/https); message lỗi tiếng Việt; **no fetch**.
- (Reconciliation, no code) Xác nhận `evidenceItemSchema` + `ReportProjectBundle.evidence` đã đúng `CanonicalTypes §2/§4`; nếu lệch thì sửa `CanonicalTypes.md` trước rồi mới chỉnh schema — không tự thêm field.
- Vitest: `validate` — item hợp lệ → `ok:true`; thiếu `title` → `ok:false` (lỗi `title`); `url` sai shape (`"abc"`) → `ok:false` (lỗi `url`); `url` rỗng/undefined → `ok:true`; **không gọi mạng**. `kind-meta` — đủ 9 kind, không thiếu key.

### Out of scope
- ❌ UI (form/panel) — Group B.
- ❌ Appendix table — Group C.
- ❌ QR / `qrcode` — Group D.
- ❌ Sửa rule checker — Group E (đã đọc evidence từ W3).
- ❌ Thêm/đổi `EvidenceKind` shape (canonical, W1).
- ❌ Bất kỳ dep mới (qrcode để Group D).

## 3. Checklist
- [ ] `kind-meta.ts`: đủ 9 kind, label VI + icon; ≤80 dòng.
- [ ] `validate.ts`: dùng `evidenceItemSchema`, URL shape-only, no `fetch`, no `any`.
- [ ] Không tái khai báo `EvidenceItem`/`EvidenceKind` (import từ `@/types`).
- [ ] `validate.test.ts` + `kind-meta.test.ts` phủ hợp lệ/thiếu title/url sai/url rỗng/đủ 9 kind.
- [ ] 4 gates xanh (lint/typecheck/test/build).

## 4. Expected Interfaces / Files

```ts
// src/modules/evidence/kind-meta.ts
import type { EvidenceKind } from "@/types";
export const kindMeta: Record<EvidenceKind, { label: string; icon: string }>;

// src/modules/evidence/validate.ts
import type { EvidenceItem } from "@/types";
export function validateEvidence(input: unknown):
  | { ok: true; item: EvidenceItem }
  | { ok: false; errors: Record<string, string> };
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/evidence/kind-meta.ts` | NEW | ~40 |
| `src/modules/evidence/validate.ts` | NEW | ~50 |
| `src/modules/evidence/kind-meta.test.ts` · `validate.test.ts` | NEW | ~70 |

> **Import boundary:** `kind-meta`/`validate` import only `@/types` (+ `zod` via schema). No UI, no `fetch`, offline. Public surface (`index.ts`) lands in Group C.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Validate gọi mạng (vỡ offline) | High | Shape-only `new URL()`/zod; no `fetch`; test khẳng định không network. |
| Tái khai báo evidence type (drift) | Medium | Import từ `@/types`; chỉ thêm `kindMeta` (UI metadata, không phải canonical shape). |
| Thiếu key trong `kindMeta` | Low | `Record<EvidenceKind,...>` → typecheck bắt thiếu; test đếm đủ 9. |
| URL shape quá lỏng/chặt | Low | Cho `http/https`; rỗng = hợp lệ (url optional); test biên. |

## 6. Verification Plan
- `validateEvidence({kind:"github", title:"Repo", url:"https://github.com/x", qrEnabled:true, ...})` → `ok:true`.
- thiếu `title` → `ok:false`, có `errors.title`.
- `url:"abc"` → `ok:false`, có `errors.url`; `url` undefined → `ok:true`.
- `Object.keys(kindMeta).length === 9`; mọi kind có `label` + `icon`.
- lint/typecheck/test/build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(evidence): kind metadata + offline validateEvidence + tests`; +1 docs commit.
