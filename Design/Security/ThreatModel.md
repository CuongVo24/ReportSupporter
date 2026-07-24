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
- **Primary control:** `remark-rehype` không bật `allowDangerousHtml`, không có `rehype-raw` → raw HTML bị loại trước khi tới sanitize (`Security.md` §1.2).
- **Defense-in-depth:** `rehype-sanitize` với schema mở rộng tối thiểu (`markdown-pipeline.ts`); ranh giới `dangerouslySetInnerHTML` chỉ một chỗ (preview pane) dùng output đã sanitize (`Security.md` §2).
- **Residual risk:** DOM-clobbering qua `clobberPrefix: ""` trong schema (`markdown-pipeline.ts:18`) — id trùng tên với DOM API global có thể can thiệp script hợp lệ khác đọc `document.getElementById`/named property access. Chưa có adversarial test riêng.
- **Test/Owner:** Fuzz suite mới (W25-K, `src/**/__security__/*`) phải cover ID/URL clobbering cases. Owner: chủ dự án, review mỗi khi đổi schema.

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
- **Entry point:** npm dependency compromise, PDF renderer container image compromise.
- **Primary control:** Pin exact version mọi runtime dep (`TechnicalStack.md` §8d), lockfile commit, `npm ci`. `npm audit` chạy trong CI (không chặn cứng — advisory).
- **Residual risk:** Không có SBOM/signature verification cho container image; không auto-bump/dependabot review process được ghi cụ thể ở đây.
- **Owner:** chủ dự án review trước mỗi version bump qua Contract.

### T6 — Lộ AI provider key
- **Entry point:** XSS trong origin trong lúc tab đang mở, đọc biến `volatileApiKey`.
- **Primary control:** Key **không** persist bất kỳ đâu — chỉ sống trong bộ nhớ tab, mất khi reload. Giảm mạnh cửa sổ tấn công so với localStorage persistent (attacker cần XSS *trong khi* tab đang mở và key đã nhập, không thể "quay lại sau" đọc storage).
- **Defense-in-depth:** Sanitize Markdown (T1) là control chính ngăn XSS xảy ra từ đầu.
- **Residual risk:** Nếu XSS xảy ra trong phiên đang mở AI, key vẫn đọc được — không có gì tuyệt đối ngăn việc này ngoài ngăn XSS xảy ra.
- **Owner/Test:** regression test xác nhận `saveAiConfig`/`loadAiConfig` không bao giờ ghi `apiKey` vào bất kỳ `localStorage.setItem` payload nào (khuyến nghị thêm ở W25-K nếu chưa có).

### T7 — Rate-limit identity spoofing (server surface)
- **Entry point:** `TRUSTED_PROXY_MODE=none` ở production, hoặc mode không khớp host thật → `x-forwarded-for` giả mạo được.
- **Primary control:** `production-config.ts` `validateProductionConfig()` fail-closed nếu thiếu Redis pairing hay proxy mode sai (dòng ~49-129).
- **Residual risk:** Nếu vận hành viên set sai `TRUSTED_PROXY_MODE` cho hosting thật (vd chọn `none` trên môi trường có public traffic), quota dùng chung bucket `direct` — không phải lỗi code, là lỗi cấu hình. Config-value fuzzing (W25-K) nên cover case chuỗi rỗng/whitespace/case-variant cho biến này.
- **Owner:** ops/chủ dự án tại deploy time; `/api/ready` báo cause code rõ.

### T8 — Import resource exhaustion (zip bomb / oversized input)
- **Entry point:** File import docx/xlsx/pptx/pdf/markdown, đặc biệt ZIP-based format (pptx/xlsx/docx).
- **Primary control:** `maxBytes = 50MiB` cap trên **compressed** input size mỗi converter (`docx.ts`, `xlsx.ts`, `pptx.ts`, `pdf.ts`, `markdown.ts`).
- **Residual risk (mở, chưa fix trong W25-K):** Không cap **decompressed size / entry count / compression ratio** cho ZIP-based converters (`pptx.ts` dùng `JSZip.loadAsync` không giới hạn entry count) → zip-bomb classic (file nén nhỏ, giải nén khổng lồ) không bị chặn bởi cap hiện tại. W25-K bổ sung fuzz test để **chứng minh** gap này tồn tại (regression case), fix thật thuộc contract implementation riêng (không sửa trong docs/test contract này).
- **Owner:** mở issue/contract riêng cho ZIP expansion cap (không thuộc scope M/K).

### T9 — Directory import file-count / dropped assets
- **Primary control:** `MAX_DROPPED_FILES = 500` (`directory-reader.ts:1`), `MAX_IMAGE_SIZE_BYTES = 5MiB` mỗi ảnh (`extract-assets.ts:9`).
- **Residual risk:** Không thấy cap tổng byte-size khi kéo thả cả thư mục (500 file × kích thước lớn vẫn có thể nặng). Cần fuzz/adversarial case.

### T10 — Abort/race trong worker & pipeline
- **Entry point:** Abort trước/trong/sau khi gửi postMessage tới worker (`worker-client.ts`), circuit breaker + main-thread fallback trong `pipeline-client.ts`.
- **Primary control:** `AbortSignal` listener + immediate-aborted check (`worker-client.ts` dòng ~20,38,60-65); circuit breaker mở khi worker liên tục lỗi, fallback về main-thread qua dynamic `import("./pipeline-core")`.
- **Residual risk:** Trước W25-K, test không deterministic hoá dynamic import này → không chứng minh được race an toàn dưới tải thật; chỉ chứng minh dưới điều kiện máy rảnh. W25-K thêm inject/mock cho dynamic import để test race deterministic mọi điều kiện tải.

### T11 — AI streaming buffer không giới hạn
- **Entry point:** NDJSON response từ AI provider (qua proxy) không có `\n` hoặc cực lớn.
- **Current gap:** `http-adapter.ts` buffer NDJSON không có max size/max line count (dòng ~42-108) — attacker-controlled hoặc lỗi provider có thể grow buffer vô hạn trong phiên đó (memory exhaustion phía client, không phải server).
- **Mitigation kế hoạch:** `options.signal` cho phép abort; nhưng không tự động cap buffer. W25-K thêm fuzz test chứng minh gap (oversized/no-newline case) làm regression baseline; cap thật (nếu cần) là contract riêng.

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
