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

- [x] Không còn claim API key persist localStorage; comment/UI/docs khớp memory-only + legacy scrub. Code (`src/types/ai.ts`, `ai-config.ts`) đã đúng từ trước; đợt này sửa docs còn stale: `ProductPRD.md` §Privacy, `Design/Modules/Other/CanonicalTypes.md` (2 chỗ).
- [x] Data inventory ghi rõ IndexedDB plaintext, service-worker/cache/export files, network egress và deletion/retention — đã có sẵn ở `ThreatModel.md` §1-3 (Assets/Actors/Data Classification) và `ADR-028`; xác nhận lại khớp code, không sửa thêm.
- [x] Threat model map A–L, phân biệt primary boundary/mitigation/residual risk/owner — đợt này sync lại T1 (DOM-clobber/sink brand — đã đóng, trước ghi “chưa có adversarial test”), T5 (SBOM/scan mới), T7 (hop-count parsing mới), T8 (ZIP bomb — đã đóng, trước ghi “chưa fix”), T9 (aggregate byte cap mới), T11 (AI stream bounds — đã đóng, trước ghi “không giới hạn”).
- [x] ADR at-rest encryption chốt required/deferred/rejected với criteria, UX recovery và migration impact — `ADR-028` đã đạt yêu cầu này từ trước (xác nhận lại, không cần sửa: status “Deferred” rõ ràng, criteria to revisit, không claim encryption đã ship).
- [x] User-facing privacy copy tiếng Việt rõ, không tuyệt đối hóa “local-first/offline” — `AiSettingsPanel.tsx` đã đúng từ trước (xác nhận lại); `README.md` sửa dòng tuyên bố “không gửi dữ liệu báo cáo lên máy chủ” để làm rõ AI/PDF opt-in vẫn có network egress.

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

`DONE (2026-07-25 — cuối pass re-fix A-K trong cùng ngày).`

Thực hiện SAU khi A-K re-fix xong trong cùng phiên, đúng thứ tự contract yêu cầu ("làm cuối sau A-L"). Nhiều phần hoá ra đã đúng từ trước (code comments `ai.ts`/`ai-config.ts`, `ADR-028`, `Security.md` T6, `AiSettingsPanel.tsx` privacy copy, `KichBan-Test-Tong-The.md` QA script) — xác nhận lại, không sửa. Các claim thật sự stale tìm thấy và sửa:

- `ProductPRD.md` §Privacy and AI Data Handling: "stored locally in browser localStorage" → in-memory only + legacy scrub, khớp `ai-config.ts` thật.
- `Design/Modules/Other/CanonicalTypes.md` (2 chỗ): cùng loại claim sai, sửa tương tự.
- `README.md`: dòng "không gửi dữ liệu báo cáo lên máy chủ đám mây" được làm rõ — đúng cho local-first mặc định, nhưng AI/PDF remote opt-in có network egress thật qua route first-party.
- `Design/Modules/Other/Deployment.md`: đoạn "MVP không dùng route server nào (PDF = browser print client-side)" và "Puppeteer service... không bật trong MVP" — đã lỗi thời từ W24/W25 (route server + Puppeteer service THẬT đã tồn tại, chỉ bị tắt bằng feature flag `PDF_REMOTE_ENABLED`, không phải "chưa build"). Thêm ghi chú "Cập nhật W25-M" theo đúng convention file này đã dùng cho W24-H trước đó. Bổ sung biến env mới từ J/E/C vào ma trận (`TRUSTED_PROXY_HOPS`, `RATE_LIMIT_SECRET(+VERSION)`, `OPERATOR_DIAGNOSTICS_TOKEN`, `PDF_BODY_ADMISSION_MAX`, `PDF_REMOTE_ENABLED`, `PDF_TICKET_SECRET(+VERSION)`, `PDF_TICKET_TRUSTED_ISSUER_MODE`) — trước đây thiếu hoàn toàn dù validator đã fail-closed đòi các biến này.
- `Design/Security/ThreatModel.md`: T1 (đóng — DOM-clobber prefix + brand type + sink narrowing, trước ghi "chưa có test riêng" dù test đã tồn tại), T5 (SBOM/scan mới từ L, trước ghi "không có SBOM"), T7 (hop-count RFC 7239 parsing mới từ B), T8 (ZIP bomb — đóng thật từ H, trước ghi rõ ràng "chưa fix, mở issue riêng"), T9 (aggregate byte cap mới từ H), T11 (AI stream bounds — đóng từ D, trước ghi "không giới hạn").
- `src/app/api/pdf/sanitize-pdf-html.ts`: comment tuyên bố "gVisor isolation" không có thật trong deployment — sửa trong đợt I, xác nhận lại nhất quán với ThreatModel T3 (không đổi).
- Index (`w25_break_index.md`) và plan tổng (`w25_fix-all-bugs.md` §2, §9): cập nhật trạng thái cuối cho A-M, không còn contract nào `REOPEN` treo; các mục §9 chưa xanh (Docker probe thật, security review độc lập) được đánh dấu trung thực là chưa đạt, không claim xong.

**Không khẳng định tuyệt đối "0 stale claims toàn repo":** đã quét có mục tiêu (grep các cụm từ khoá cụ thể: `localStorage`+API key, MVP/Puppeteer/route server, gVisor, ZIP bomb/expansion, "không giới hạn"/"chưa cap") qua `Design/` và code comments liên quan trực tiếp tới A-L; không đọc toàn bộ hàng trăm file lịch sử theo tuần trong `Design/`. File lịch sử (`week16_break`, v.v.) mô tả trạng thái TẠI THỜI ĐIỂM đó được giữ nguyên, không sửa thành hiện tại.

