# Contract For AI — W25 Docs (M): Threat Model/Key Storage/Data-at-Rest Khớp Implementation

> **Lane:** Core / break_task / week25_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Security documentation / privacy contract; làm cuối sau A–L.
> **Findings:**
> - **S1** (🟡) — Comments trong `src/types/ai.ts` và `ai-config.ts` còn nói API key nằm ở `localStorage`; implementation hiện giữ key volatile trong memory tab và scrub legacy storage.
> - **S2** (🟠) — “local-first” dễ bị hiểu thành “encrypted/private tuyệt đối”; project/snapshot/assets nằm plaintext trong IndexedDB của origin, đọc được bởi same-origin XSS, extension/profile hoặc người có quyền thiết bị.
> - **S3** (🟡) — Threat model chưa nối rõ boundaries mới: trusted ingress, PDF capability/renderer isolation, remote image privacy, import bombs, dependency/container supply chain.
> - **S4** (🟡) — Retention/delete/export/reset behavior và optional at-rest encryption decision chưa có owner/requirement rõ.
> **Builds on:** A–L implementation truth, W24 deployment/security docs, storage migration contracts.
> **Sources:** docs/comments/storage review 2026-07-22.

---

## 1. Micro-task Target

Tài liệu và code comments nói đúng dữ liệu nào ở đâu, ai có thể đọc, khi nào gửi mạng, retention/delete ra sao và lớp nào là primary boundary. Chốt bằng ADR whether optional at-rest encryption is required; không quảng cáo encryption nếu chưa triển khai.

- **S1 — Key lifecycle truth.** Ghi BYO key chỉ trong memory tab, gửi same-origin proxy header, không server-persist; reload cần nhập lại; legacy local/session storage scrub; XSS trong tab vẫn là threat.
- **S2 — Local data classification.** IndexedDB/cache/service worker chứa report/assets/snapshots plaintext; browser origin/device profile boundary; remote AI/PDF/image network flows/consent được map.
- **S3 — Threat model.** Assets, actors, trust boundaries, abuse/resource risks, mitigations/primary-vs-defense-in-depth, residual risks và monitoring/incident owner.
- **S4 — Data lifecycle/ADR.** Project/snapshot/export/key/cache deletion semantics, backup/restore limitations; Decide optional encryption (passphrase/key handling/recovery/perf/migration) theo product requirements.

> 🔒 Docs không được gọi regex sanitizer/rate limit/npm audit là boundary tuyệt đối. Không hứa zero network khi user chủ động AI/PDF/remote image.

## 2. Scope

### In scope
- `src/types/ai.ts`, `src/modules/write/ai/ai-config.ts` comments (MODIFY).
- Security/privacy/deployment/README docs (MODIFY/NEW): data flow + threat model + incident/dependency ownership.
- ADR optional IndexedDB encryption (NEW, decision only nếu chưa approve feature).
- Tests/lint snapshot bảo vệ storage key scrub/docs env parity nếu phù hợp.

### Out of scope
- ❌ Tự triển khai encryption trong docs contract.
- ❌ Legal compliance certification/claim.
- ❌ Cloud sync/account redesign.

## 3. Checklist

- [ ] Không còn claim API key persist localStorage; comment/UI/docs khớp memory-only + legacy scrub.
- [ ] Data inventory ghi rõ IndexedDB plaintext, service-worker/cache/export files, network egress và deletion/retention.
- [ ] Threat model map A–L, phân biệt primary boundary/mitigation/residual risk/owner.
- [ ] ADR at-rest encryption chốt required/deferred/rejected với criteria, UX recovery và migration impact.
- [ ] User-facing privacy copy tiếng Việt rõ, không tuyệt đối hóa “local-first/offline”.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/types/ai.ts` | MODIFY | correct memory-only threat comment |
| `src/modules/write/ai/ai-config.ts` | MODIFY | correct lifecycle comment |
| `Design/Modules/Other/Deployment.md` | MODIFY | boundary/owner/rotation/incident |
| `Design/Security/ThreatModel.md` | NEW hoặc canonical path hiện có | assets/flows/threats/residuals |
| `Design/Decisions/*data-at-rest*.md` | NEW | encryption decision |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Docs drift sau code change | Med | Link canonical config/types; lightweight docs parity checklist/test; owner per boundary. |
| Encryption ADR bị hiểu là feature đã có | High | Status/decision rõ; UI/README chỉ claim implementation shipped. |
| Threat model quá chung không actionable | Med | Mỗi threat có asset/entry point/control/test/owner/residual risk/next review. |
| Privacy copy làm user sợ không cần thiết | Low | Plain language, nêu local-first benefits lẫn giới hạn và user controls. |

## 6. Verification Plan

- Search toàn repo cho `localStorage`/`sessionStorage`/“local-first”/API key và đối chiếu actual read/write callers; stale claim bằng 0.
- Walkthrough data-flow: import → IDB/snapshot → preview → AI/PDF/remote image → export/delete/reset; mỗi transition có disclosure/control.
- Security review ký xác nhận threat model link tới test/evidence A–L và ADR status không bị suy rộng.

## 7. Status

`PROPOSED — docs contract, chỉ hoàn tất sau khi implementation contracts chốt behavior cuối.`

