# 🛡️ THREAT MODEL — ReportSupporter (canonical, W25-M)

> **AI RULE:** File này là **single source of truth** cho threat model tổng thể. `Design/Modules/Other/Security.md` giữ chi tiết sanitize/pipeline; file này là bản đồ đầy đủ asset/actor/boundary/threat/mitigation/residual/owner cho toàn bộ A–L implementation. Xung đột → file này thắng cho threat model, `Security.md` thắng cho chi tiết sanitize pipeline; cả hai phải khớp nhau, không tự mâu thuẫn.
>
> **Không tuyệt đối hoá:** "local-first" nghĩa là dữ liệu **mặc định** không rời máy người dùng khi họ không chủ động dùng AI/PDF/remote image. Nó **không** nghĩa là "encrypted" hay "không ai đọc được" — xem §2 Data Classification và ADR-028.

---

## 1. Assets (cái cần bảo vệ)

| Asset | Mô tả | Nơi lưu |
|---|---|---|
| Report content | Markdown/text người dùng viết | IndexedDB (`project-bundles`) |
| Report metadata | Tên thành viên/trường/lớp/GV | IndexedDB (`project-bundles.metadata`) |
| Assets (ảnh) | Ảnh nhúng base64 | IndexedDB (`project-bundles`), export file |
| Project snapshots/history | Bản chụp trước đó cho undo/restore | IndexedDB (`project-summaries`, snapshot store) |
| AI provider API key | Key người dùng nhập để gọi AI | **Chỉ** biến in-memory của tab (`volatileApiKey`), không persist |
| Exported files | `.html`/`.docx`/`.pdf` | Tải về máy người dùng, ngoài kiểm soát app sau export |
| App code/dependencies | Bundle, npm deps, PDF renderer container image | Build pipeline, lockfile, container registry |

## 2. Actors & Trust Boundaries

| Actor | Trust | Boundary chạm asset nào |
|---|---|---|
| Người dùng chính chủ (thiết bị của họ) | Trusted | Toàn bộ — họ tự chủ dữ liệu của mình |
| Người khác dùng chung máy/profile trình duyệt | Untrusted với dữ liệu người dùng chính | Đọc được IndexedDB/localStorage cùng origin, cùng profile |
| Trình duyệt extension độc hại/compromised trong cùng profile | Untrusted | Có thể đọc DOM, storage, network của mọi tab cùng origin |
| Script injected qua stored XSS (Markdown/paste) | Untrusted, chạy trong origin nếu sanitize thất bại | DOM, in-memory API key, IndexedDB, mọi network call app có thể gọi |
| Nội dung Markdown/import từ file lạ (docx/xlsx/pptx/pdf/zip) | Untrusted input | Parser/converter, extract-assets, sanitize pipeline |
| `/api/ai` proxy (first-party server) | Trusted boundary nhưng chuyển tiếp tới provider | AI key trong header, request/response text |
| AI provider (bên thứ ba, qua proxy) | Untrusted ngoài kiểm soát | Nhận content người dùng gửi để "AI hoá", nhận key qua header (không log ở app) |
| PDF renderer service (`services/pdf-renderer`, Docker) | Semi-trusted, cô lập | Nhận HTML để render, chạy trong container/network namespace riêng |
| Remote image URL (do người dùng dán vào Markdown) | Untrusted | Request egress khi preview/export render `<img src="https://...">` |
| npm dependency / CI supply chain | Semi-trusted, pin exact + lockfile | Build output, PDF renderer image |

## 3. Data Classification (khớp implementation hiện tại)

- **IndexedDB (project-bundles/project-summaries/snapshot store): plaintext, không mã hoá tại rest.** Đọc được bởi: bất kỳ code chạy trong origin (kể cả extension/XSS), hoặc người có quyền truy cập hồ sơ trình duyệt/thiết bị (file hệ thống của trình duyệt). Xem ADR-028 cho quyết định có mã hoá optional hay không.
- **Service Worker cache:** `/api/*` là NetworkOnly (không cache). Cache Storage không giữ report content hay API response (`Security.md` §W25 addendum). Precache chỉ giữ static app shell assets.
- **AI API key:** in-memory only (`volatileApiKey` trong `src/modules/write/ai/ai-config.ts`), sống trong tab, mất khi reload. Legacy giá trị từng bị ghi ở localStorage được scrub một lần khi phát hiện (`loadAiConfig()` dòng ~64-73).
- **AiConfig còn lại (enabled/provider/model):** persist ở `localStorage` key `rs:ai-config` — không nhạy cảm bằng key nhưng vẫn tiết lộ "user has AI configured".
- **Export files (`.html`/`.docx`/`.pdf`):** rời khỏi kiểm soát app ngay khi tải về; không có gì ngăn người dùng gửi file đó đi (đó là hành vi chủ ý của họ, ngoài threat model).
- **Network egress chủ động do người dùng:** AI request (khi bật + có key), PDF render request tới renderer service, ảnh remote trong Markdown (khi preview/export tải ảnh đó). App **không** hứa "zero network" khi người dùng chủ động dùng các tính năng này — chỉ hứa không có network ngầm/telemetry/analytics.

## 4. Threats, Boundaries, Mitigations, Residuals

Mỗi threat: **Entry point → Primary control → Defense-in-depth → Residual risk → Owner/Test**.

### T1 — Stored XSS qua Markdown/import
- **Entry point:** Người dùng gõ/paste Markdown, hoặc import docx/xlsx/pptx/pdf chứa nội dung độc.
- **Primary control:** `remark-rehype` không bật `allowDangerousHtml`, không có `rehype-raw` → raw HTML gõ trực tiếp trong markdown source bị coi là text trơ, không bao giờ thành element thật (`Security.md` §1.2 — xác nhận lại 2026-07-25 khi viết test cho W25-I, xem ghi chú trong `markdown-pipeline.fuzz.test.ts`).
- **Defense-in-depth:** `rehype-sanitize` với schema mở rộng tối thiểu (`markdown-pipeline.ts`) áp dụng cho HTML do KaTeX/rehype-highlight/Mermaid tự sinh (không phải raw markdown HTML — xem control trên). `clobberPrefix: HEADING_DOM_CLOBBER_PREFIX` (`"user-content-"`, KHÔNG rỗng — đã fix trước phiên này) chống DOM-clobbering cho heading ID. Ranh giới `dangerouslySetInnerHTML`: `asSanitizedHtml` không còn export công khai (W25-I, 2026-07-25) — chỉ `markdown-pipeline.ts` tự gọi được sau khi chạy full sanitize pipeline; TOC (`toc-renderer.ts`) và Mermaid SVG (`sanitizeSvgMarkup()`, mới) có boundary/brand type riêng, không cast raw string. Pass thu hẹp `style`/`className` mới (`sink-style-narrowing.ts`) chạy sau `rehypeSanitize`, chặn `url()`/`expression()`/`javascript:`/`@import` trong style bất kể property.
- **Residual risk:** Đã đóng gap DOM-clobbering/forge-brand chính; còn lại là rủi ro chung của mọi allowlist sanitizer (schema có thể sai sót chưa phát hiện). `<use>` SVG không còn nhận `href`/`xlink:href` (chặn hẳn thay vì cố allowlist pattern giá trị).
- **Test/Owner:** `src/lib/__security__/markdown-pipeline.fuzz.test.ts` (mở rộng W25-I: asSanitizedHtml không export, style/className narrowing, Mermaid script/onload/use-href stripped). Owner: chủ dự án, review mỗi khi đổi schema.

### T2 — XSS qua URI scheme
- **Entry point:** `[x](javascript:…)`, `data:text/html` cho link, `vbscript:`.
- **Primary control:** schema sanitize chỉ cho `a[href]` là `http`/`https`/`mailto` (`Security.md` §1.3).
- **Residual risk:** thấp nếu schema không đổi; regression test cần giữ khi thêm protocol mới.

### T3 — Regex-based PDF HTML sanitizer bị hiểu nhầm là boundary tuyệt đối
- **Entry point:** HTML gửi tới PDF renderer (`sanitize-pdf-html.ts`).
- **Primary control thực tế:** **không phải** regex sanitize — primary control là renderer chạy **JS disabled + network egress chặn** ở tầng renderer/container (Docker network namespace). Regex strip (`sanitize-pdf-html.ts` — strip `<script>`, `on*=`, rewrite `http(s)` src/href) chỉ là lớp lọc bổ sung, **không** parse HTML thật (không dùng DOM parser) → có thể bị bypass bằng obfuscation/nested tag/case variant.
- **Defense-in-depth:** renderer JS off + network intercept + input size/time cap (25 MiB / 30s, `Security.md` §W25 addendum).
- **Residual risk cũ (đã fix ở W25-K):** integration test trước đây chỉ assert `%PDF-` + size, không chứng minh script không chạy hay canary có bị gọi hay không — nghĩa là claim "isolation" thiếu bằng chứng. W25-K bổ sung canary HTTP listener + kiểm tra text nội dung PDF không chứa marker script.
- **🔒 Docs rule:** Không được gọi regex sanitizer này là "security boundary" — nó là filter phụ; renderer isolation (JS off + network block) mới là primary control.
- **Owner/Test:** `scripts/test-pdf-integration.mjs` (updated), CI docker lane. Next review: khi đổi renderer runtime.

### T4 — Lộ dữ liệu cá nhân trong draft (privacy, không phải exploit)
- **Entry point:** Thiết bị bị truy cập vật lý, hoặc profile trình duyệt dùng chung.
- **Primary control:** Dữ liệu chỉ ở IndexedDB local, không cloud sync — giảm bề mặt lộ so với server lưu trữ tập trung.
- **Residual risk:** Plaintext tại rest — bất kỳ ai có quyền đọc file hệ thống của trình duyệt (hoặc cùng profile) đọc được. **Chưa có encryption tại rest.** Xem ADR-028 cho quyết định.
- **Mitigation control cho user:** cần đường "xoá dữ liệu" (xoá project/clear store) — đã có theo `Security.md` §3, soft-delete + hard clear theo `Rule.md` §6.
- **Owner:** chủ dự án; review lại khi có yêu cầu multi-user/shared-device use case.

### T5 — Supply-chain (dependency/container)
- **Entry point:** npm dependency compromise, PDF renderer container image compromise, GitHub Actions supply chain (CI runner).
- **Primary control:** Pin exact version mọi runtime dep (`TechnicalStack.md` §8d), lockfile commit, `npm ci`. `npm audit --omit=dev` chạy trong CI (root + `services/pdf-renderer` workspace riêng) **chặn cứng** (không `|| true` trên lệnh audit chính — chỉ JSON artifact upload dùng `|| true` để vẫn có bằng chứng khi audit đỏ). Deviation khỏi advisory mới nhất phải qua registry `dependency-overrides.json` có `owner`/`reviewBy`/`exitCondition`, enforce bởi `scripts/check-supply-chain.mjs`. GitHub Actions pin full commit SHA, enforce bởi `scripts/check-ci-actions.mjs`.
- **Defense-in-depth (W25-F/L, 2026-07-25):** Renderer image build một lần trong CI, SBOM (SPDX, `anchore/sbom-action`) và vulnerability scan (`aquasecurity/trivy-action`, fail trên Critical/High) chạy trên đúng digest đó; `docker compose` tái sử dụng cùng image (không rebuild) cho integration test. `scripts/generate-release-evidence.mjs` liên kết commit/lockfile hash/image digest/SBOM hash/scan result/audit vào một manifest kiểm được offline.
- **Residual risk:** SBOM/scan chưa được xác nhận chạy thật trên CI (viết trong sandbox không có Docker daemon — xem ghi chú "chưa verify" ở `w25_harden_pdf_renderer_reproducible_container.md`); chưa có image signing (cosign/sigstore) hay provenance attestation (SLSA). Base image Chromium update cadence phụ thuộc Dependabot `docker` ecosystem entry (mới thêm W25-L), chưa có SLA cụ thể.
- **Owner:** chủ dự án review trước mỗi version bump qua Contract; theo dõi CI job `verify` (SBOM/scan lane) cho lần chạy thật đầu tiên sau merge.

### T6 — Lộ AI provider key
- **Entry point:** XSS trong origin trong lúc tab đang mở, đọc biến `volatileApiKey`.
- **Primary control:** Key **không** persist bất kỳ đâu — chỉ sống trong bộ nhớ tab, mất khi reload. Giảm mạnh cửa sổ tấn công so với localStorage persistent (attacker cần XSS *trong khi* tab đang mở và key đã nhập, không thể "quay lại sau" đọc storage).
- **Defense-in-depth:** Sanitize Markdown (T1) là control chính ngăn XSS xảy ra từ đầu.
- **Residual risk:** Nếu XSS xảy ra trong phiên đang mở AI, key vẫn đọc được — không có gì tuyệt đối ngăn việc này ngoài ngăn XSS xảy ra.
- **Owner/Test:** regression test xác nhận `saveAiConfig`/`loadAiConfig` không bao giờ ghi `apiKey` vào bất kỳ `localStorage.setItem` payload nào (khuyến nghị thêm ở W25-K nếu chưa có).

### T7 — Rate-limit identity spoofing (server surface)
- **Entry point:** `TRUSTED_PROXY_MODE=none` ở production, hoặc mode không khớp host thật → `x-forwarded-for`/`Forwarded` giả mạo được; client tự thêm entry giả ở đầu chain XFF.
- **Primary control:** `production-config.ts` `validateProductionConfig()` fail-closed nếu thiếu Redis pairing, proxy mode sai, hoặc thiếu `TRUSTED_PROXY_HOPS` (W25-B, 2026-07-25). `rate-limit.ts` `trustedClientAddress()` chỉ đọc phần tử được proxy tin cậy ĐẦU TIÊN append (đếm từ phải theo `TRUSTED_PROXY_HOPS`, qua `node:net.isIP` validate) — không bao giờ đọc phần client tự thêm ở đầu chain. Mode `forwarded` parse thật RFC 7239 (trước đây chỉ alias đọc `x-forwarded-for`, đã sửa). Fingerprint (địa chỉ + API key) dùng HMAC versioned với secret riêng `RATE_LIMIT_SECRET` (không còn fallback `UPSTASH_REDIS_REST_TOKEN`/hardcoded string).
- **Residual risk:** Nếu vận hành viên set sai `TRUSTED_PROXY_MODE`/`TRUSTED_PROXY_HOPS` cho hosting thật (vd chọn `none` hoặc đếm sai số hop trên môi trường có public traffic), quota dùng chung bucket `direct` hoặc đọc nhầm địa chỉ — không phải lỗi code, là lỗi cấu hình; code không tự chứng minh được topology thật (cần proof triển khai riêng, xem `w25_fix_rate_limit_identity_trusted_ingress.md` §6).
- **Owner:** ops/chủ dự án tại deploy time; `/api/ready` báo cause code rõ.

### T8 — Import resource exhaustion (zip bomb / oversized input)
- **Entry point:** File import docx/xlsx/pptx/pdf/markdown, đặc biệt ZIP-based format (pptx/xlsx/docx).
- **Primary control (W25-H, 2026-07-25 — đã fix, không còn là gap mở):** `maxBytes = 50MiB` cap trên compressed input size mỗi converter, CỘNG `src/modules/import/zip-central-directory.ts` (parser Central Directory nhị phân tự viết, đọc trực tiếp từ ZIP spec công khai, không qua JSZip private API) preflight TRƯỚC khi bất kỳ converter nào inflate: entry count (≤5,000), tổng uncompressed (≤250MiB), single-entry uncompressed (≤100MiB), tỷ lệ nén (>100x bị từ chối, kể cả compressed size gần 0), path traversal/absolute path/NUL byte, tên trùng lặp sau chuẩn hoá, entry mã hoá, compression method không hỗ trợ. `pptx.ts` (converter duy nhất tự gọi `.async()` trực tiếp) còn có `createInflationTracker` đếm byte giải nén THẬT, phòng trường hợp Central Directory khai man kích thước khai báo.
- **Residual risk còn lại:** DOCX (dùng Mammoth) và XLSX (dùng SheetJS) không tự gọi `.async()` nên không có runtime inflation tracking cho riêng chúng — chỉ có preflight declared-size check (đã đủ mạnh vì đọc metadata thật từ Central Directory, nhưng không phải runtime-observed). XML text/shared-strings/styles/relationships bên trong archive (sau khi qua ZIP-level check) chưa có budget riêng trước khi materialize toàn bộ workbook/deck.
- **Owner/Test:** `src/modules/import/__security__/resource-policy-bombs.fuzz.test.ts`, `src/modules/import/zip-central-directory.test.ts`. Xem `w25_harden_document_import_resource_budgets.md` §7 cho danh sách đầy đủ đã đóng/còn mở.

### T9 — Directory import file-count / dropped assets
- **Primary control:** `MAX_DROPPED_FILES = 500` và (W25-H, 2026-07-25) `MAX_DROPPED_TOTAL_BYTES = 500MiB` cộng dồn `File.size` khi duyệt cây thư mục (`directory-reader.ts`, `resource-policy.ts` — trước đây chỉ có cap số lượng file, không có cap tổng dung lượng), `MAX_IMAGE_SIZE_BYTES = 5MiB` mỗi ảnh (`extract-assets.ts:9`).
- **Residual risk:** `File.size` là metadata OS/browser cung cấp, không phải nội dung đã đọc — vẫn hợp lý làm cap sớm trước khi đọc file, nhưng nếu OS báo sai kích thước (hiếm) thì cap này không chính xác 100%.
- **Owner/Test:** `src/modules/import/directory-reader.test.ts`.

### T10 — Abort/race trong worker & pipeline
- **Entry point:** Abort trước/trong/sau khi gửi postMessage tới worker (`worker-client.ts`), circuit breaker + main-thread fallback trong `pipeline-client.ts`.
- **Primary control:** `AbortSignal` listener + immediate-aborted check (`worker-client.ts` dòng ~20,38,60-65); circuit breaker mở khi worker liên tục lỗi, fallback về main-thread qua dynamic `import("./pipeline-core")`.
- **Residual risk:** Trước W25-K, test không deterministic hoá dynamic import này → không chứng minh được race an toàn dưới tải thật; chỉ chứng minh dưới điều kiện máy rảnh. W25-K thêm inject/mock cho dynamic import để test race deterministic mọi điều kiện tải.

### T11 — AI streaming buffer không giới hạn
- **Entry point:** NDJSON response từ `/api/ai` (giữa app server và LLM provider) hoặc từ `/api/ai` tới client browser, không có `\n` hoặc cực lớn, hoặc frame JSON hỏng.
- **Primary control server-side (W25-D, 2026-07-25 — đã fix, không còn là gap mở):** `src/app/api/ai/route.ts` bridge giờ **pull-aware** thật (không còn greedy `while(true)` đọc hết upstream bất kể client có đọc hay không); cap `MAX_UPSTREAM_BYTES` (2MiB), `MAX_TOTAL_DELTA_CHARS` (50,000), `MAX_EVENTS` (2,000), `MAX_SINGLE_DELTA_CHARS` (16,000 — vượt thì abort với lỗi, không còn truncate-rồi-emit-như-thành-công); idle deadline 20s + total 60s; parser malformed JSON giờ trả typed protocol error thay vì bỏ qua âm thầm; decoder UTF-8 `fatal:true` + flush cuối stream.
- **Primary control client-side (đã có từ trước, xác nhận lại):** `http-adapter.ts` có `MAX_CLIENT_BUFFER_BYTES = 128 KiB` cap cho buffer dòng chưa kết thúc (`\n`).
- **Residual risk:** Client's `response.text()`/`response.json()` fallback path (dùng khi runtime không hỗ trợ streaming `response.body`) chưa có cap kích thước riêng — path này hiếm khi chạy (chỉ môi trường thiếu streaming body support).
- **Owner/Test:** `src/app/api/ai/route.test.ts`, `src/app/api/ai/__security__/ai-stream-bounds.fuzz.test.ts` (mở rộng W25-D: no-echo correlation ID, pull-aware backpressure, malformed-frame/no-newline-tail/single-delta-overflow).

## 5. Non-goals (không trong threat model này)
- AuthN/AuthZ, CSRF — không có login/session/cookie.
- SQLi/NoSQLi — không có server DB.
- Link-liveness / network reachability check trong Checker — cấm theo `3.Check.md`.
- Legal/compliance certification (GDPR formal audit, v.v.) — ngoài scope kỹ thuật.

## 6. Review cadence
- Threat model này review lại khi: (a) thêm boundary mới (server route, worker, external service), (b) sau mỗi incident, (c) tối thiểu mỗi quý.
- Owner tổng: chủ dự án (CuongVo24). Mỗi threat item ở trên có owner/test method riêng — không có "chủ sở hữu chung chung".

## 7. Cross-references
- `Design/Modules/Other/Security.md` — sanitize pipeline chi tiết, dangerouslySetInnerHTML boundary, QC checklist.
- `Design/Modules/Other/Deployment.md` — env/production config, proxy mode matrix, rotation/rollback.
- `Design/Decisions/ADR-028-data-at-rest-encryption.md` — quyết định mã hoá IndexedDB tại rest.
- `Design/ContractForAI/Core/break_task/week25_break/w25_add_security_coverage_fuzz_and_flake_gates.md` — fuzz/coverage evidence cho các residual risk ở trên.
