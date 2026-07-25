# W25 — Kế hoạch vá toàn bộ lỗi sau review contract A–M

> **Trạng thái:** `DRAFT FOR EXECUTION`  
> **Baseline kiểm tra:** nhánh `main`, commit `82b15e2`, ngày 2026-07-25  
> **Mục tiêu:** sửa đúng implementation, test/evidence và tài liệu; không công nhận `DONE` chỉ vì có file hoặc có test mô tả gap.  
> **Release rule:** giữ release ở trạng thái **blocked** cho tới khi toàn bộ P0 và các release gate trong §9 đạt.

---

## 1. Kết luận sau khi đối chiếu review với code

Review ban đầu nhìn chung đúng hướng: nhiều contract đã được đánh dấu `DONE` theo checklist nhưng implementation chỉ mới có một phần của control, hoặc control tồn tại nhưng không được nối vào execution path. Tuy nhiên cần sửa và bổ sung các điểm sau.

### 1.1 Các kết luận cần sửa

1. **A — số liệu audit đã thay đổi.** Tại baseline hiện tại, `npm audit --omit=dev --json` ở root báo **11 package nodes** bị ảnh hưởng, gồm **8 high + 3 moderate**, không còn là “6 (5 high + 1 moderate)”. Có hai họ advisory chính:
   - `brace-expansion` theo `GHSA-mh99-v99m-4gvg`; đường phụ thuộc đi qua `@serwist/next → glob → minimatch → brace-expansion` và qua `pdfjs-dist → canvas → @mapbox/node-pre-gyp → rimraf/glob/minimatch`.
   - `tar` theo `GHSA-r292-9mhp-454m`; root đang override `tar: 7.5.19`, trong khi bản vá bắt đầu từ `7.5.21`.
   - Workspace `services/pdf-renderer` hiện audit riêng là `0`.
2. **B và D không nên xếp là P1 thông thường.** Contract gốc của cả hai là **P0**. B bảo vệ trusted-ingress/quota; D bảo vệ API streaming khỏi memory/backpressure amplification.
3. **J là dependency P0 của B/C/E**, dù bản thân contract ghi operational security. Nếu config không fail-closed và không được kiểm bằng env thật của target, các control P0 phía sau có thể bị vô hiệu chỉ bằng cấu hình.
4. **I chưa thể coi là “phần lớn đã xong”.** Thứ tự KaTeX/highlight → sanitize và heading prefix đã có, nhưng brand có thể forge, schema cho phép `style`/`className` quá rộng, Mermaid/TOC vẫn là các HTML sink riêng, và comment PDF mô tả isolation không tồn tại.
5. **K và M không chỉ là lệch nhãn trạng thái.** K đã có một số fuzz/coverage config nhưng chưa cover đúng critical paths, flake gate quá hẹp và một số test đang “chứng minh gap” thay vì đóng gap. M đã có ThreatModel/ADR nhưng nội dung đang khẳng định sai trạng thái A–L.
6. **C không thể “verify toàn bộ ticket trước khi đọc body”** nếu `htmlHash` nằm trong ticket. Luồng đúng phải tách:
   - kiểm chữ ký và static claims trước body;
   - đọc body bằng bounded stream;
   - so hash;
   - claim nonce atomically ngay trước khi gửi renderer.
7. **F và L có phần giao nhau nhưng không thay thế nhau.** F chịu trách nhiệm image/runtime reproducibility; L chịu trách nhiệm CI gate, SBOM, scanner và evidence gắn với image digest.

### 1.2 Các thiếu sót bổ sung tìm thấy

- PDF ticket đang được chấp nhận cả từ query string, làm token có thể lọt vào URL/log/referrer.
- Ticket issuer là public endpoint, không có session/attestation đáng tin; vì vậy “có signed ticket” chưa tạo ra authorization boundary.
- Replay cache dùng `Map` trong process, không an toàn khi chạy nhiều instance.
- `nbf` có trong payload nhưng không được verify; payload thiếu `aud`, `iss`, version và runtime schema chặt.
- PDF route đọc toàn bộ `request.text()` trước khi verify và trước khi thực thi size limit thực sự cho chunked body.
- AI route nhận rồi echo client `requestId` trên mọi event; parser có thể giữ tail/no-newline tới giới hạn upstream và im lặng bỏ malformed event.
- PDF renderer lấy render slot và browser trước khi đọc xong body; slow client giữ tài nguyên đắt tiền.
- Compose dùng `PDF_RENDERER_TOKEN` default `local-render-token` trong khi image đặt `NODE_ENV=production` và startup guard cấm default token; Docker lane có nguy cơ không boot đúng.
- `createInflationTracker` và `validateCanvasPixels` không có caller; các control tồn tại trên giấy nhưng không nằm trong đường chạy.
- DOCX/XLSX catch lỗi theo substring tiếng Việt, có thể fail-open với archive malformed/encrypted.
- PPTX có main-thread fallback; hostile input có thể quay lại block UI dù contract yêu cầu worker isolation.
- CSP production bỏ `'unsafe-inline'` nhưng Next build vẫn có inline RSC/theme scripts không nonce; có nguy cơ hydration/theme bị chặn.
- Sau khi user bấm tải ảnh remote, `img-src 'self' data: blob:` vẫn chặn URL `https:`, không có load/error/timeout state.
- `asSanitizedHtml()` là exported cast, nên bất kỳ raw string nào cũng có thể được gắn brand.
- `ThreatModel.md` nói renderer đã có container egress deny, audit chỉ advisory và chưa có control ZIP expansion; cả ba đều lệch code hiện tại.
- `ProductPRD.md` vẫn nói API key persist trong `localStorage`; `README.md` nói tuyệt đối rằng report không gửi lên server, mâu thuẫn với AI/PDF opt-in.
- Nhiều runtime dependency trong `package.json` vẫn dùng range `^`, trong khi threat model/stack docs tuyên bố pin exact.
- Dependabot chưa theo dõi Docker base-image digest; CI chưa tạo SBOM hoặc scan image.

---

## 2. Ma trận trạng thái thật

| Contract | Nhãn hiện tại | Đánh giá thực tế | Mức xử lý | Quyết định |
|---|---|---|---:|---|
| A — dependency vulnerabilities | `DONE` | Regression do advisory mới + override đang trỏ bản vulnerable | P0 release gate | **REOPEN** |
| B — rate-limit/trusted ingress | `DONE` | Parser IP/header và secret fallback chưa đạt boundary | P0 | **REOPEN** |
| C — PDF gateway access | `DONE` | Issuer public, secret fallback, replay local, body đọc sớm | P0 | **REOPEN** |
| D — AI streaming | `DONE` | Không backpressure, parser/tail/client caps thiếu, requestId sai contract | P0 | **REOPEN** |
| E — renderer isolation | `DONE` | Slot ordering, deadline, context, network/container isolation thiếu | P0 | **REOPEN** |
| F — reproducible container | `DONE` | Digest/`npm ci` có; SBOM/scan/runtime proof chưa có | P0 release gate cùng L | **REOPEN PARTIAL** |
| G — CSP/remote image | `DONE` | CSP có thể làm hỏng hydration; consent image vẫn bị CSP chặn | P0 deploy correctness | **REOPEN** |
| H — import budgets | `DONE` | Control quan trọng dead code/fail-open/main-thread fallback | P0 local availability | **REOPEN** |
| I — Markdown/DOM/PDF sanitize | file `PROPOSED`, index `DONE` | Có final sanitize + prefix; schema/brand/sinks/comment chưa đạt | P1, prerequisite G | **KEEP OPEN** |
| J — readiness/config | `DONE` | Validator/URL/operator/target-env coverage thiếu | P0 dependency | **REOPEN** |
| K — coverage/fuzz/flake | `PROPOSED`, index `DONE` | Có nền tảng nhưng chưa là canonical evidence | P1 release evidence | **KEEP OPEN** |
| L — CI/supply chain | `DONE` | Action/audit có; SBOM/image scan/evidence binding thiếu | P0 release gate | **REOPEN** |
| M — docs/threat model | `PROPOSED` | ADR/ThreatModel đã tạo nhưng stale và chưa khớp A–L | P1 closure | **KEEP OPEN; làm cuối** |

**Kết quả cuối ngày 2026-07-25 (cùng phiên vá):** A, B, C, D, E, G, I, J, L, M → `DONE` (re-verified, evidence trong từng file contract). F → `DONE` (SBOM/scan giờ có trong CI, nhưng chưa chạy thật vì phiên vá không có Docker daemon — xem ghi chú "chưa verify" trong file F). H → `KEEP OPEN — PARTIAL` (ZIP bomb/inflation/pixel budget đã đóng; PPTX DOMParser worker-fallback + OCR idle-deadline còn mở, không phải P0 theo đánh giá lại). K → `KEEP OPEN — PARTIAL` (coverage/fuzz mở rộng; `ci.yml` lane labeling chưa làm). Không có contract nào còn ở trạng thái `REOPEN` treo — mọi contract có ít nhất một commit re-fix + evidence trong cùng ngày. Chi tiết đầy đủ ở §9 Definition of Done và từng file `w25_*` riêng.

Quy tắc cập nhật trạng thái:

- Không đổi contract sang `DONE` trước khi code, negative tests, integration evidence và docs cùng đạt.
- Index và file contract phải đổi trong cùng commit.
- Với contract partial, checklist đã đạt được giữ evidence; checklist sai phải bỏ dấu hoàn thành, không viết thêm một đoạn “known limitation” để giữ `DONE`.

---

## 3. Containment trước khi vá

Thực hiện trước mọi refactor để giảm rủi ro trong thời gian sửa:

1. **Giữ release/deploy promotion ở trạng thái blocked.**
2. **Remote PDF mặc định OFF ở public production** cho tới khi có issuer thực sự đáng tin. Print Preview vẫn hoạt động.
3. Nếu strict CSP đang được deploy và có violation/hydration failure:
   - rollback header enforce về policy cuối cùng đã chứng minh hoạt động;
   - chạy policy đích ở `Content-Security-Policy-Report-Only`;
   - đặt deadline loại bỏ policy tạm, không biến `'unsafe-inline'` thành trạng thái vĩnh viễn.
4. Không publish image PDF renderer mới cho tới khi Docker integration lane boot được với token production hợp lệ và egress/sandbox probe xanh.
5. Ghi snapshot evidence baseline: root audit JSON, renderer audit JSON, lockfile, commit SHA và danh sách image/config hiện hành. Evidence không chứa env secret.

---

## 4. Các quyết định kiến trúc khóa trước khi code

### 4.1 Một nguồn config server

Tạo một module config typed, parse một lần, dùng chung cho routes, readiness và predeploy checker. Không đọc rải rác `process.env` trong từng handler.

Config phải phân loại:

- `required always in production`;
- `required only when feature enabled`;
- `optional with bounded default`;
- `dev/test only`.

Mọi integer phải kiểm `finite`, `integer`, range và hierarchy; URL phải parse bằng `new URL()`, không chỉ regex.

### 4.2 Chính sách remote PDF

Do sản phẩm không có account/session server, public `/api/pdf/ticket` không thể tự tạo authorization chỉ bằng việc ký token. Chọn policy:

- **Public deployment mặc định:** remote PDF OFF; chỉ Print Preview.
- **Private/authenticated deployment:** issuer chỉ chạy sau một upstream identity đã được xác minh ở trusted ingress; identity được bind vào capability.
- Không chấp nhận một header identity do client public tự đặt.

Capability ticket tối thiểu có `ver`, `iss`, `aud`, `sub/identity`, `jobId`, `htmlHash`, `sizeClass`, `iat`, `nbf`, `exp`, `nonce`. Chỉ nhận ticket ở header, không nhận query.

### 4.3 Luồng PDF gateway chuẩn

Thứ tự bắt buộc:

1. kiểm feature/config, method, media type, Fetch Metadata/Origin và header sizes;
2. parse + verify chữ ký/static claims nhưng **chưa claim nonce**;
3. kiểm rate-limit backend availability và quota;
4. đọc body bằng stream với byte cap + total/idle deadline;
5. so `htmlHash`, `jobId`, size class;
6. atomically `SET NX EX` nonce trong shared store;
7. gửi renderer bằng bounded request; validate status/content-type/output cap;
8. log aggregate/cause code, không log token/HTML/PDF.

### 4.4 Hai tầng admission của renderer

- Upload/body admission là budget rẻ riêng.
- Render concurrency slot chỉ được giữ sau khi auth, media type và body đã đọc/validate xong.
- Mỗi job dùng BrowserContext riêng, đóng context trong `finally`.
- Deadline bắt đầu tại handler entry, bao trùm body read, browser/context/page, `setContent`, `pdf` và response write.

### 4.5 Resource accounting là executable control

Mọi declared budget phải có caller trong production path và có test fail nếu caller bị tháo. Không dùng private metadata `_data`, string matching lỗi, hoặc helper “để dành”.

### 4.6 Sanitized HTML không forge được

Brand constructor không export công khai. Chỉ sanitizer/render pipeline được quyền tạo `SanitizedHtml`; TOC, Mermaid SVG và các builder khác phải trả type đã qua boundary riêng, không cast raw string.

---

## 5. Thứ tự triển khai

| Wave | Công việc | Điều kiện thoát |
|---|---|---|
| 0 | Containment + evidence baseline | Remote PDF public OFF; release blocked; strict CSP không làm hỏng app đang chạy |
| 1 | A + J + B | Audit path hiểu rõ; canonical config fail-closed; trusted identity/secret primitives đạt |
| 2 | C | Public issuer không còn mở; ticket/replay/body ordering đạt |
| 3 | E | Renderer admission/deadline/context/sandbox/egress đạt |
| 4 | F + L | Image digest, SBOM, scanner, CI/evidence đạt |
| 5 | D + H + I | Stream/import/HTML sinks có executable bounds; I hoàn thành trước G |
| 6 | G | Nonce/hash CSP và remote-image consent hoạt động thật |
| 7 | K | Security tests/coverage/flake/soak trở thành gate, không chỉ test mô tả |
| 8 | M + sync trạng thái | ThreatModel/ADR/PRD/README/deployment và contract index khớp code cuối |

A có thể làm song song với J/B về mặt code, nhưng release vẫn bị chặn cho tới Wave 4. Test K phải được viết cùng từng fix; Wave 7 là bước gom ngưỡng và evidence cuối, không phải đợi tới cuối mới test.

---

## 6. Kế hoạch chi tiết theo contract

### A — Vá dependency production

**Files chính:** `package.json`, `package-lock.json`, manifest renderer nếu dependency tree thay đổi, script kiểm override/evidence.

Việc cần làm:

- Xóa hoặc thay các override vulnerable:
  - không giữ `brace-expansion: 1.1.16`;
  - không giữ `tar: 7.5.19`;
  - không dùng global override major `brace-expansion: 5.0.8` nếu parent package yêu cầu API cũ.
- Ưu tiên nâng parent dependency tạo path:
  - nhánh `@serwist/next → glob/minimatch/brace-expansion`;
  - nhánh `pdfjs-dist → canvas → node-pre-gyp/rimraf/glob/tar`.
- Nếu buộc dùng scoped override, thêm registry machine-readable có:
  `package`, `advisory`, `affectedPaths`, `reason`, `owner`, `addedAt`, `reviewBy`, `exitCondition`; CI fail nếu thiếu field/hết hạn.
- Chốt policy nhất quán cho manifest ranges:
  - hoặc pin exact mọi runtime dependency theo tài liệu;
  - hoặc sửa tài liệu để nói lockfile là source reproducibility. Không được vừa dùng `^` vừa claim “manifest pin exact”.
- Chạy regression cho PWA/Serwist, PDF.js import/OCR, canvas/PDF render, build và offline asset update.
- Không downgrade Next/React và không dùng `npm audit fix --force`.

Nghiệm thu:

- Root và renderer `npm audit --omit=dev` không còn critical/high/moderate không-waiver.
- `npm ls --omit=dev --all` không có invalid/extraneous/peer break.
- Không có override advisory thiếu owner/expiry/exit.
- `lint`, `typecheck`, unit, build, PWA smoke, import PDF/OCR smoke xanh.
- Commit evidence gồm audit JSON trước/sau và resolved dependency paths.

### B — Rate-limit identity và trusted ingress

**Files chính:** `src/lib/server/rate-limit.ts`, config module, routes AI/PDF, tests, deployment docs.

Việc cần làm:

- Parse địa chỉ bằng `node:net.isIP`; normalize IPv4/IPv6; reject whitespace, port suffix sai, multiple/invalid token.
- Mỗi ingress mode có parser riêng:
  - Cloudflare: chỉ `cf-connecting-ip`;
  - Vercel/nginx: trusted hop count rõ và chọn đúng phần tử từ bên phải của XFF chain;
  - RFC 7239 `Forwarded`: parser đúng quoted/bracketed IPv6 nếu thật sự hỗ trợ;
  - direct: không tin bất kỳ forwarded header nào.
- Không gọi mode `forwarded` nếu implementation chỉ đọc `x-forwarded-for`.
- Bổ sung deployment proof rằng origin không bypass được proxy tin cậy; code validation không thể tự chứng minh topology.
- `RATE_LIMIT_SECRET` và `RATE_LIMIT_SECRET_VERSION` là secret chuyên dụng, bắt buộc ở production; bỏ fallback sang Redis token và hardcoded string.
- Fingerprint address/API key bằng versioned HMAC; document rotation có giai đoạn đọc dual-version nếu cần.
- Xóa exported legacy helper không caller (`rateLimitIdentity`) hoặc biến nó thành private adapter có test.
- Khi Redis unavailable ở production, routes trả safe `503`, không biến thành quota `429` hoặc fail-open.

Nghiệm thu:

- Fuzz header chain/IPv4/IPv6/quoted/duplicate/malformed không spoof bucket.
- Test từng platform mode và trusted-hop count.
- Secret thiếu/yếu/default/cross-purpose làm production config fail.
- Test multi-key cùng IP và multi-IP cùng key giữ đúng hai tầng quota.
- Không log raw IP/API key; log chỉ versioned pseudonymous fingerprint/cause.

### C — PDF gateway access policy

**Files chính:** `src/app/api/pdf/route.ts`, `src/app/api/pdf/ticket/route.ts`, `src/lib/server/pdf-access.ts`, shared Redis/config, tests.

Việc cần làm:

- Thêm explicit `PDF_REMOTE_ENABLED=false` mặc định; nếu issuer an toàn chưa tồn tại thì production checker từ chối bật.
- Bảo vệ issuer bằng identity đã verify từ trusted upstream. Public anonymous issuer phải bị disable, không “vá” bằng rate limit.
- Chỉ nhận capability ở `Authorization: Bearer` hoặc một header canonical; bỏ query parameter và header aliases.
- Secret ký ticket chuyên dụng, bắt buộc, đủ entropy, có version; bỏ fallback public/default/Redis token.
- Runtime-validate header/payload/base64/JSON và mọi claim; reject token quá dài, TTL quá xa, clock skew bất hợp lý, `nbf` tương lai, `exp` quá hạn, sai `aud/iss/ver`.
- Tách `verifyTicketEnvelope()` và `claimTicketNonce()` để lỗi rate limit/config/body hash không đốt nonce sớm.
- Dùng shared Redis atomic claim (`SET ... NX EX`) hoặc primitive tương đương; không dùng process-local `Map`.
- Đọc HTML bằng stream, không dùng `request.text()` trực tiếp; enforce `Content-Type`, content-length nếu có, actual bytes, idle deadline và total deadline.
- Fetch Metadata/Origin policy phải explicit cho missing headers; không coi “header vắng mặt” là mặc định trusted.
- Public errors chỉ trả stable generic code; không trả `ticketResult.reason`, token fragment, HTML hash hoặc topology.
- Validate response renderer: manual redirect, expected content-type, byte cap, timeout; cancel upstream khi client disconnect.

Nghiệm thu:

- Anonymous production không lấy được ticket; khi remote OFF vẫn dùng Print Preview.
- Cross-site/missing-origin/malformed media/oversize/chunked slow body bị chặn đúng phase.
- Replay cùng nonce trên hai app instances: chỉ một request thành công.
- Ticket ở query bị reject; logs/test snapshots không chứa token/HTML/PDF.
- `nbf/aud/iss/ver/TTL/hash/jobId/sizeClass` có negative tests.
- Rate-limit unavailable trả `503`; invalid capability không làm renderer bị gọi.

### D — AI stream protocol và resource bounds

**Files chính:** `src/app/api/ai/route.ts`, provider parsers, `src/modules/write/ai/adapters/http-adapter.ts`, schemas/tests.

Việc cần làm:

- Server luôn sinh canonical request ID; client ID nếu cần chỉ là untrusted metadata riêng và không echo.
- Chỉ gửi correlation ID ở `meta`/terminal event theo schema; không lặp trên mọi delta.
- Đổi bridge từ greedy loop trong `start()` sang pull-aware stream:
  - chỉ đọc upstream khi downstream cần;
  - kiểm `desiredSize`;
  - có max pending bytes/events.
- Mỗi provider dùng stateful decoder có byte cap cho:
  - undecoded UTF-8 tail;
  - current line/event;
  - JSON object/depth;
  - total upstream bytes;
  - total output bytes/chars;
  - event count.
- Không truncate delta rồi tiếp tục như thành công. Vượt limit phải phát đúng một terminal `output_limit` và abort upstream.
- Malformed JSON/event/content-type/trailing incomplete frame phải là typed protocol error, không im lặng bỏ.
- Flush `TextDecoder` lúc EOF và reject invalid/incomplete UTF-8 theo policy.
- Thêm total + idle deadline; reset idle clock khi có progress hợp lệ, không phải khi nhận byte rác.
- Mọi exit path error/limit/client abort phải `cancel()` reader và abort provider fetch; terminal event đúng một lần.
- Route kiểm request content-type/body bytes bằng bounded stream.
- Client adapter runtime-validate từng NDJSON event; giới hạn buffer/event/suggestion; `response.text()`/`json()` fallback cũng phải bounded.
- Error public được redact; server log chỉ provider/cause/bytes/duration/request ID server-side.

Nghiệm thu:

- Test slow consumer chứng minh upstream không được đọc greedily.
- Test no-newline, split UTF-8, malformed JSON, wrong content-type, huge single event, too many events, output cap, EOF tail.
- Test client abort/timeout/limit đều abort provider và không emit `done`.
- Test terminal exactly-once.
- Heap/pending queue không tăng theo toàn bộ upstream khi downstream dừng đọc.

### E — PDF renderer sandbox, deadlines và egress

**Files chính:** `services/pdf-renderer/server.mjs`, tests, `docker-compose.pdf.yml`, Docker/security profiles, integration scripts.

Việc cần làm:

- Token bắt buộc cho mọi non-test deployment; so sánh constant-time; tách dev compose khỏi production compose; bỏ default production token.
- Parse toàn bộ numeric env bằng schema finite/integer/range/hierarchy.
- Deadline bắt đầu ngay khi handler vào và bao trùm toàn request. Dùng `AbortController`/timer thật, không chỉ tính `remainingMs` trước `setContent`.
- Body reader có byte cap, total deadline, idle deadline; validate content-type.
- Chỉ acquire render slot sau auth + body validation. Nếu cần chống upload flood, dùng admission budget nhẹ riêng, không giữ browser/page.
- Không lấy browser trước khi body hoàn tất.
- Mỗi job tạo incognito BrowserContext riêng; page thuộc context đó; đóng page/context trong `finally`.
- Chặn JS; chặn navigation, popup, download, service worker và mọi request không thuộc explicit local/data allowlist.
- Thêm output PDF byte cap ở renderer trước khi trả app.
- Sandbox:
  - mặc định không `--no-sandbox`;
  - nếu deployment buộc disable, phải có ADR + kernel/container profile được kiểm bằng probe;
  - container `cap_drop: ALL`, `no-new-privileges`, read-only rootfs, bounded tmpfs/pids/memory/cpu và seccomp/AppArmor phù hợp.
- Network:
  - dùng internal network;
  - không nối renderer vào default/external network;
  - bổ sung policy/firewall ở môi trường deploy để renderer không thể gọi Internet hoặc service khác ngoài kênh cần thiết;
  - request interception chỉ là defense-in-depth, không phải bằng chứng container egress deny.
- Graceful shutdown: ngừng nhận job, chờ bounded grace period, abort/close context còn lại, đóng browser.

Nghiệm thu:

- Slow body không làm giảm render concurrency.
- Deadline có test ở từng phase: body, browser launch, context/page, setContent, pdf, response.
- Hai job không chia sẻ cookie/localStorage/cache/context.
- Canary script không chạy và canary network không nhận request ở cả app-interception lẫn container-policy test.
- Sandbox probe xác nhận effective Chromium mode/profile; container chạy non-root/read-only/cap drop.
- Token rỗng/default/mismatch fail boot hoặc `401` đúng policy; production compose boot xanh với secret được inject.

### F — Reproducible/minimal renderer image

**Files chính:** `services/pdf-renderer/Dockerfile`, `.dockerignore`, renderer lockfile, compose, release workflow.

Việc cần làm:

- Giữ base image bằng immutable digest và ghi human-readable tag comment.
- `npm ci --omit=dev`; chỉ copy manifest/lock trước dependency layer; không có cache/node_modules từ host.
- Multi-stage hoặc cleanup để runtime chỉ có browser/runtime cần thiết; non-root user; minimal writable tmpfs.
- Xác minh source archive không chứa `.env`, report sample nhạy cảm, git metadata hoặc test artifact không cần thiết.
- Build image từ clean checkout hai lần theo cùng toolchain; nếu byte-for-byte digest không khả thi do builder metadata, document reproducibility boundary và gắn provenance/commit/source digest rõ.
- Tạo SBOM cho image và scan chính image digest, không chỉ filesystem root.
- Thêm Docker ecosystem/update process cho base digest.

Nghiệm thu:

- Clean build thành công, renderer health/integration test xanh.
- Image chạy non-root, read-only root, bounded tmpfs.
- Image digest, base digest, SBOM digest, commit SHA và scan result liên kết được.
- Không có critical/high vulnerability không-waiver trong image.
- Checklist F không tự nhận SBOM/scan hoàn tất nếu chỉ L có placeholder.

### G — CSP và remote-image privacy

**Prerequisite:** I hoàn tất.

**Files chính:** `next.config.ts` hoặc middleware/proxy CSP, `src/app/layout.tsx`, Preview/remote-image flow, export pipeline, Playwright/security tests.

Việc cần làm:

- Chọn nonce-based CSP cho request động:
  - sinh cryptographically random nonce mỗi request;
  - đưa nonce vào `script-src` và các script hợp lệ;
  - xác minh Next 15 RSC/hydration scripts thực sự nhận nonce;
  - chuyển theme bootstrap sang external script hoặc script có nonce.
- Nếu route tĩnh/PWA không tương thích nonce, có policy/hash strategy riêng được build-time verify; không thêm lại broad `'unsafe-inline'`.
- Rollout strict policy qua Report-Only trước, ghi violation aggregate không chứa report content, sau đó mới enforce.
- Giữ `object-src 'none'`, `base-uri 'none'`, frame policy, HSTS và các directive cần cho worker/font/style theo allowlist tối thiểu.
- Remote image:
  - sanitizer/classifier luôn biến `http(s)` thành placeholder trước lần render đầu;
  - “Tải một lần” chỉ chạy sau explicit click, không persist trust mặc định;
  - request không gửi credentials/referrer (`crossOrigin="anonymous"`, `referrerPolicy="no-referrer"` hoặc primitive tương đương);
  - có loading, success, error, timeout, cancel và retry state;
  - nếu remote host không hỗ trợ CORS/credentialless mode, hiển thị lỗi + lựa chọn attach local, không âm thầm downgrade sang credentialed request.
- CSP phải cho phép đúng flow sau consent. Nếu dùng direct `https:` trong `img-src`, sanitizer/placeholder tests phải chứng minh không có remote `src` trước consent. Không tạo server proxy mới nếu chưa có thiết kế SSRF riêng.
- Export HTML/PDF không tự fetch ảnh remote; giữ placeholder hoặc yêu cầu asset local/data URL.

Nghiệm thu:

- Production E2E không có CSP violation cho app shell/theme/RSC/hydration.
- Inline script không nonce/hash bị block.
- Mở document có 100 remote images tạo **0** network request trước consent.
- Click một placeholder tạo tối đa request dự kiến, không cookie/referrer; error/timeout không để broken `<img>`.
- Reload không tự tin origin trừ khi có feature/UX riêng được phê duyệt.
- Offline/PWA/update flow vẫn hoạt động dưới CSP enforce.

### H — Import resource budgets

**Files chính:** `src/modules/import/resource-policy.ts`, DOCX/PPTX/XLSX/PDF/OCR converters, worker client/registry, tests.

Việc cần làm:

- ZIP preflight đọc metadata đáng tin từ raw central directory hoặc parser public API:
  - entry count;
  - compressed/uncompressed per entry và total;
  - ratio, kể cả zero/small compressed entries;
  - encrypted/unsupported flags;
  - duplicate normalized names;
  - absolute/UNC/drive/NUL/traversal/depth;
  - original unsafe name, không chỉ sanitized `entry.name`.
- Không dùng private `JSZip._data`; metadata thiếu phải fail-closed.
- Nối `createInflationTracker` vào từng `async()`/inflate path; validate finite, non-negative, per-entry + total actual bytes.
- Dùng structured error codes, không catch theo substring. Malformed/encrypted/unsupported archive phải dừng import an toàn, không fallback sang parser nặng khác.
- DOCX/PPTX/XLSX áp budgets cho XML text, shared strings, styles, relationships, media count/bytes và rows/cols trước khi materialize toàn workbook/deck.
- Thay PPTX DOMParser/main-thread fallback bằng worker-safe XML parser; input hostile/large không tự quay lại main thread.
- PDF:
  - page/operator/text/image counts;
  - pixel dimensions/cumulative pixel ledger trước canvas/ImageData allocation;
  - `isEvalSupported: false` khi phù hợp;
  - destroy loading task/document/render task trong `finally`.
- OCR:
  - pixel ledger trước canvas;
  - pass AbortSignal xuyên UI → PDF render → OCR worker;
  - total + idle deadline;
  - terminate/recreate worker có giới hạn khi timeout.
- `validateCanvasPixels` dùng đúng per-page + total budgets, yêu cầu finite/positive/integer và có caller thực.
- Directory import có total bytes, không chỉ file count/per-image cap.

Nghiệm thu:

- CodeGraph/caller gate hoặc static test xác nhận mọi critical budget helper có production caller.
- Corpus gồm ZIP bomb, fake metadata, zero-size ratio, encrypted, duplicate, path traversal, huge XML/sharedStrings/media, PDF huge pixels/operators và abort races.
- Rejection xảy ra trước allocation/inflate đắt tiền; lỗi có code ổn định và UI message.
- Không hostile/large input nào chạy converter trên main thread.
- Valid DOCX/PPTX/XLSX/PDF/OCR fixtures vẫn import đúng trong budget.
- Constrained-browser/worker test đo thời gian/heap proxy và chứng minh tab vẫn responsive.

### I — Markdown DOM, sink invariant và PDF best-effort filter

**Files chính:** `src/lib/markdown-pipeline.ts`, PreviewPane, TOC renderer, Mermaid renderer, PDF filter, security tests/docs.

Việc cần làm:

- Thu hẹp `customSchema`:
  - bỏ raw `style` nếu có thể;
  - nếu bắt buộc cho KaTeX/highlight, allowlist property/value bằng parser, không nhận arbitrary CSS string;
  - allowlist class bằng exact prefix/regex cho KaTeX/highlight/app-generated classes, không arbitrary class;
  - rà SVG/`use`/URL-bearing attributes và loại phần không cần.
- Giữ final sanitize sau KaTeX/highlight và heading `user-content-`; test TOC/heading parity.
- Không export `asSanitizedHtml`. Đặt constructor private; fallback HTML cũng đi qua cùng trusted builder.
- Lập sink registry và owner cho:
  - Preview content;
  - TOC HTML;
  - Mermaid SVG;
  - layout theme script;
  - export HTML;
  - PDF `setContent`.
- TOC builder escape tốt nhưng phải trả trusted type từ builder đóng; không inject plain `string`.
- Mermaid `securityLevel: "strict"` là một control nhưng chưa đủ type invariant; sanitize returned SVG bằng allowlist riêng trước sink và test malicious Mermaid payload.
- Đổi tên PDF regex helper thành `stripKnownPdfHazardsBestEffort`; bỏ/deprecate alias `sanitizePdfHtml` gây hiểu nhầm.
- Sửa comment: filter regex không phải security boundary; chỉ được gọi defense-in-depth. Không claim gVisor/container egress khi deployment chưa có proof.
- URL protocol policy phải khớp G: raw remote image không được đi thẳng tới preview sink.

Nghiệm thu:

- Raw string không compile/không thể gắn `SanitizedHtml` từ module ngoài.
- Mọi `dangerouslySetInnerHTML`/`setContent` có source invariant và test.
- Corpus CSS `url()`, `expression`, SVG link/use, DOM clobber, event attrs, URI schemes, Mermaid payload bị loại.
- KaTeX, highlight, tables, captions, TOC và Mermaid hợp lệ không regression.

### J — Readiness và runtime config

**Files chính:** `src/lib/server/production-config.ts` hoặc replacement typed config, `/api/ready`, predeploy script, env example, deployment docs/tests.

Việc cần làm:

- Validator bao phủ toàn bộ:
  - PDF remote flag, URL/token/ticket secret/version;
  - rate-limit secret/version + Redis pair;
  - trusted proxy mode/hops;
  - renderer concurrency/queue/input/output/deadlines/retries/server timeouts/shutdown;
  - AI request/stream/event/output/idle limits;
  - operator diagnostics token.
- Kiểm hierarchy: idle < total, phase timeout ≤ total, output/input/concurrency/queue trong range.
- `PDF_RENDERER_URL` production:
  - `https:` hoặc private service scheme/topology đã approve;
  - exact host/port/path allowlist;
  - không userinfo, fragment, unexpected query;
  - reject public/private mismatch và redirect.
- Predeploy checker phải chạy với **target deployment env**, không chỉ default CI env. Lưu safe summary/fingerprint, không lưu secret.
- Readiness public chỉ `{ready}` + no-store; diagnostics yêu cầu operator auth constant-time, token đủ entropy/version.
- Không gửi renderer token vào endpoint `/ready` nếu renderer readiness không cần auth; tránh phát secret tới URL misconfigured.
- Probe có timeout, manual redirect, cancel/drain response và safe cause codes.
- Tách liveness/readiness nếu browser warmup hay Redis dependency cần semantics khác.

Nghiệm thu:

- Table-driven + fuzz cho mọi env: missing, whitespace, NaN, Infinity, float, zero, negative, overflow, hierarchy sai, default secret.
- URL test cho loopback/private/public, credential, redirect, path/query/fragment.
- CI/deploy job chứng minh checker nhận target env.
- Public ready không lộ topology/cause/secret; operator comparison timing-safe và response no-store.

### K — Coverage, fuzz, flake và false-green gates

**Files chính:** `vitest.config.ts`, security test directories, Playwright, CI schedule/soak jobs, artifacts.

Việc cần làm:

- Thêm per-file thresholds cho critical paths:
  - AI/PDF routes;
  - `pdf-access`, rate-limit, config;
  - `resource-policy`;
  - provider parsers/client adapter;
  - markdown/sink boundary.
- Branch thresholds quan trọng hơn aggregate line coverage; fail nếu negative branch không được chạy.
- Fuzz/property tests dùng seed ghi vào failure output; lưu minimized reproducer/corpus cho regression.
- Không để test “known bypass/gap” pass chỉ vì nó chứng minh lỗi tồn tại. Sau fix, đổi thành assertion fail-closed.
- Flake gate chạy nhóm concurrency/abort/worker/stream/PDF admission có ý nghĩa, không chỉ một `pipeline-client` test lặp 20 lần.
- Thêm constrained mode: `maxWorkers=1`, CPU/memory pressure hợp lý, slow consumer/body, fake timers chỉ nơi deterministic.
- Thêm scheduled soak cho worker/AI stream/PDF queue; PR lane giữ bounded duration.
- Docker integration canary xác minh:
  - script marker không xuất hiện;
  - network canary không nhận request;
  - sandbox/profile probe;
  - slow body không giữ slot;
  - output đúng PDF.
- Coverage/fuzz/flake artifacts có retention và seed, kể cả khi job fail.

Nghiệm thu:

- Threshold critical files xanh và không thể được bù bởi coverage ở file không liên quan.
- Cố tình tháo một cap/caller làm test đỏ.
- Flake lane lặp nhiều seed/run không false-green; failure có reproducer.
- PR runtime trong budget; soak chạy schedule/manual và báo owner khi fail.

### L — CI supply chain và release evidence

**Files chính:** `.github/workflows/ci.yml`, Dependabot config, supply-chain/evidence scripts, waiver schema.

Việc cần làm:

- Giữ full SHA pins và least-privilege permissions; thêm static checker fail nếu action dùng tag/branch hoặc permission tăng không review.
- Audit root + renderer fail release theo policy; JSON artifact được upload ngay cả khi audit fail.
- Build renderer image một lần, lấy immutable digest, rồi:
  - tạo SPDX/CycloneDX SBOM;
  - scan digest bằng pinned scanner/database metadata;
  - dùng chính digest đó cho integration và release evidence.
- Waiver schema strict:
  `id/advisory/package/path/severity/exploitability/owner/reason/createdAt/expiresAt/exitCondition`;
  validate date thật, uniqueness và expiry, không lexical compare đơn giản.
- Evidence manifest liên kết commit, lockfile hash, image/base digest, SBOM hash, root/renderer audit, scanner version/DB timestamp, tests/coverage/canary.
- Upload artifact với explicit `retention-days`, cả success và failure; không chứa env/token/report content.
- Kiểm resolved dependency tree/SBOM thay vì chỉ top-level external URL; xác minh integrity/registry provenance theo khả năng tool.
- Thêm Docker base-image update cadence/Dependabot; rà policy ignore Next/React để security update không bị chặn vô thời hạn.

Nghiệm thu:

- PR thay action sang tag, waiver hết hạn, scanner high/critical, audit regression hoặc thiếu artifact đều làm gate đỏ.
- SBOM/image scan áp vào đúng released digest.
- Evidence manifest verify được offline và không có secret.
- Release chỉ consume artifact từ commit/digest đã test, không rebuild âm thầm.

### M — Đồng bộ security docs, privacy và data-at-rest

**Chỉ làm sau A–L chốt behavior.**

**Files chính:** `Design/Security/ThreatModel.md`, ADR-028, `Deployment.md`, `ProductPRD.md`, `README.md`, UI privacy copy, contract/index.

Việc cần làm:

- Sửa stale claims hiện có:
  - `ProductPRD.md`: API key memory-only + legacy scrub, không phải persist localStorage;
  - `README.md`: local-first mặc định nhưng AI/PDF/remote image có egress chủ động;
  - `Deployment.md`: đã có API/PDF renderer, không còn là “MVP không server route/Puppeteer chỉ tương lai”;
  - ThreatModel T3/T5/T7/T8/T11 theo implementation cuối, không claim egress/config/budget chưa có.
- Data inventory đầy đủ:
  IndexedDB stores, localStorage settings, Cache Storage/service worker, in-memory API key, snapshots/recovery/trash, export files và server-ephemeral AI/PDF bodies.
- Ghi retention/delete semantics thật:
  - soft-delete/trash giữ bao lâu;
  - hard delete/reset xóa store/cache nào;
  - export file nằm ngoài quyền app;
  - server/renderer không persist body và log chỉ aggregate.
- Map mỗi threat A–L tới asset, entry point, primary boundary, defense-in-depth, test/evidence, owner, residual risk, review cadence.
- ADR-028 có thể giữ quyết định “deferred/not implemented”, nhưng wording phải tránh hiểu nhầm encryption đã ship; giữ criteria reopen, migration/recovery impact.
- User-facing privacy copy tiếng Việt ở AI settings, PDF action và remote-image consent:
  nêu dữ liệu nào được gửi, tới đâu, khi nào, key lifecycle và local fallback.
- Thêm docs parity checker cho các claim có thể kiểm máy:
  env names, storage key, feature flags, contract status, links/evidence.
- Update A–M contract status + `w25_break_index.md` trong cùng change; không để I/K/M file và index mâu thuẫn.

Nghiệm thu:

- Repo-wide search không còn claim API key persist, zero-network tuyệt đối, renderer egress/sandbox chưa chứng minh, hoặc contract `DONE` sai.
- Walkthrough import → IDB/snapshot → preview → AI/PDF/remote image → export/delete/reset có disclosure/control rõ.
- Security owner ký xác nhận ThreatModel trỏ đúng test/evidence A–L.

---

## 7. Test và evidence bắt buộc theo boundary

| Boundary | Positive case | Negative/adversarial case | Evidence |
|---|---|---|---|
| Dependency | clean install/build | vulnerable override/advisory | audit JSON + resolved tree |
| Trusted ingress | IP thật được normalize | forged chain/malformed IPv6/wrong hops | fuzz seed + config proof |
| PDF capability | authenticated one-time job | public issuer/replay/query token/expired/nbf | multi-instance integration |
| AI stream | valid multi-chunk NDJSON | no-newline/slow consumer/invalid UTF-8/huge event | memory/pending + abort assertions |
| Renderer | bounded valid render | slow body/script/egress/hung browser/output bomb | Docker canary + sandbox probe |
| Import | valid office/PDF/OCR | zip/XML/pixel/operator bomb + abort race | corpus + worker responsiveness |
| HTML/CSP | KaTeX/highlight/TOC/Mermaid/hydration | raw HTML/CSS/SVG/inline script | sink tests + browser CSP report |
| Supply chain | pinned digest release | action tag/expired waiver/high scan | signed/hashed evidence manifest |
| Privacy/docs | intentional AI/PDF/image flow | stale absolute claim | repo parity check + walkthrough |

Logging rule cho mọi test/integration:

- Được log: stable cause code, aggregate bytes/count/duration/outcome, server-generated correlation ID.
- Cấm log/artifact: API key, PDF/operator/rate-limit secret, capability ticket, prompt/output, report HTML/PDF, imported document/image/OCR text, IndexedDB payload.

---

## 8. Rollback và migration

- A: giữ lockfile trước làm reference; rollback parent upgrade chỉ khi audit vẫn sạch hoặc remote feature bị disable. Không rollback về vulnerable override để “làm build xanh”.
- B/J: secret versioning hỗ trợ rotation có thời hạn; rollback config phải giữ cả version đang được accepted trong cửa sổ ngắn đã định.
- C: rollback an toàn là remote PDF OFF, không phải mở public issuer cũ.
- E/F: image release theo digest; giữ last-known-good digest và config schema tương thích một release.
- G: strict CSP có Report-Only staging và last-known-working policy; không dùng permanent unsafe-inline rollback.
- H: các file valid bị false-positive phải cho user message + fixture regression; không fail-open parser.
- IndexedDB schema không cần đổi cho phần lớn plan. Nếu G thêm persisted consent hoặc M đổi retention, phải mở migration/rollback contract riêng; mặc định plan này dùng per-session “load once” để tránh schema change.

---

## 9. Definition of Done toàn bộ Week 25

Chỉ gỡ release block khi tất cả điều sau đạt. **Cập nhật 2026-07-25 (cuối pass re-fix A-M):** phần lớn đạt; các mục còn `[ ]` là thật, không phải chưa kiểm — release **vẫn blocked** cho tới khi các mục đó xanh trong CI thật (sandbox phiên này không có Docker daemon nên không tự verify được).

- [x] A–L code paths đã vá; không còn P0 `REOPEN` (H còn 1 sub-item partial — DOMParser worker-fallback cho PPTX, xem file contract H §7 "Còn lại"; không phải P0 theo đánh giá lại vì chỉ ảnh hưởng môi trường worker thiếu `DOMParser`, không phải mọi trình duyệt).
- [x] Root + renderer production audit đạt policy (`npm audit --omit=dev`: 0/0/0/0 cả hai workspace, xác nhận lại cuối pass). [ ] Image scan đạt policy — **chưa verify thật**, cần CI job `verify` (lane SBOM/scan mới ở L) chạy trên Docker daemon thật.
- [x] `npm run check:encoding`, `npm run lint`, `npm run typecheck`, `npm run test` (`test:subsystems`, 819 test), `npm run test:coverage`, `npm run build` xanh — chạy xác nhận cuối pass 2026-07-25. `npm ci` chưa chạy riêng trong phiên này (đã dùng `npm install` xuyên suốt để cập nhật lockfile theo A); khuyến nghị chạy `npm ci` một lần trên checkout sạch trước khi release để xác nhận lockfile tự đủ.
- [x] `npm run test:pdf-unit` xanh (10/10, xác nhận lại cuối pass). [ ] Docker `npm run test:pdf-integration` với token non-default — **chưa chạy được** trong sandbox này (không có Docker daemon); CI lane "Docker isolation" là lần chạy thật kế tiếp.
- [ ] Target production env chạy `npm run check:production-config` xanh — chỉ chạy được với env giả lập/unit test trong phiên này, chưa chạy trên env deployment thật.
- [x] Remote PDF public mặc định OFF nếu chưa có trusted issuer (`PDF_REMOTE_ENABLED=false` mặc định, xác nhận qua test + đọc code).
- [x] AI stream, PDF slow-body/replay, import bomb, CSP hydration/remote-image consent có negative integration tests — bổ sung nhiều trong pass này (xem test count ở từng file contract A-K). CSP hydration verify bằng production build + browser thật (không chỉ code review) — xem contract G §7.
- [ ] Renderer sandbox + network egress có **effective probe**, không chỉ compose/config review — **chưa chạy được** (không có Docker daemon); `cap_drop: ALL` mới thêm có rủi ro lý thuyết chưa kiểm với Chromium sandbox, xem contract E §7.
- [~] SBOM + image digest + scanner + audit + commit + tests liên kết trong evidence manifest — generator (`scripts/generate-release-evidence.mjs`) đã viết và test cục bộ (non-strict, thiếu digest/SBOM/scan vì không có Docker), nhưng CHƯA chạy `--strict` thật trong CI để tạo manifest đầy đủ.
- [x] K coverage/flake/fuzz gates xanh (coverage threshold mới cho 8 file, `npm run test:coverage` pass); failure artifact có seed/reproducer cho các suite dùng `mulberry32` seeded fuzz (đã có từ trước, không đổi).
- [x] M docs/UI privacy copy khớp behavior cuối cho các claim tìm thấy (`ProductPRD.md`, `README.md`, `Deployment.md`, `ThreatModel.md` T1/T5/T7/T8/T9/T11) — **không khẳng định "stale claims bằng 0" tuyệt đối**, chỉ khẳng định đã sửa các claim cụ thể tìm được trong pass này; có thể còn sót ở tài liệu khác chưa quét hết (`Design/` có hàng trăm file lịch sử theo tuần).
- [x] Từng contract A–M và index (`w25_break_index.md`) được cập nhật trạng thái cùng evidence link, cùng ngày/pass.
- [ ] Security review cuối (người, không phải tự-review) xác nhận không log hoặc upload dữ liệu người dùng/secret — chưa có review độc lập ngoài chính phiên vá lỗi này.

---

## 10. Checklist thực thi theo PR/commit

Để review và rollback rõ, không gom toàn bộ thành một change khổng lồ:

1. `w25/a-j-b-config-ingress-deps`
2. `w25/c-pdf-capability-gateway`
3. `w25/e-renderer-isolation`
4. `w25/f-l-supply-chain-evidence`
5. `w25/d-ai-stream-bounds`
6. `w25/h-import-resource-bounds`
7. `w25/i-sanitized-html-sinks`
8. `w25/g-csp-remote-image`
9. `w25/k-security-gates`
10. `w25/m-docs-status-sync`

Mỗi change phải kèm:

- scope và threat được đóng;
- test positive + negative;
- config/migration/rollback note;
- evidence artifact hoặc đường dẫn CI;
- checklist contract được cập nhật nhưng chỉ đánh `DONE` khi Definition of Done của chính contract đạt.

