# W25 — Kế hoạch vá toàn bộ lỗi sau review implementation lần 2

> **Trạng thái:** `IMPLEMENTED LOCALLY — RELEASE EVIDENCE PENDING`
> **Baseline review:** nhánh `main`, commit `a3a4634`, ngày 2026-07-26
> **Plan trước:** `w25_fix-all-bugs.md`
> **Phạm vi:** các lỗi còn lại sau khi thực thi plan lần 1; không làm lại các control đã được chứng minh đúng.
> **Release rule:** chỉ gỡ release block khi toàn bộ P0/P1, H/K partial và evidence trong §12 đạt trên code/commit sẽ phát hành.

> **Kết quả review triển khai 2026-07-26:** các lỗi code tái hiện được trong Wave 1–6 đã được vá, gồm renderer lifecycle/deadline/output/shutdown, AI request/provider/client bounds, PDF ticket/gateway, ingress identity, remote-image CSP/validation, import arithmetic/worker/ZIP và CI waiver/evidence checks. Các gate local khả dụng phải xanh trước commit. Release vẫn bị chặn vì Docker/browser/Redis/CI target evidence chưa chạy trên commit này; H/K còn các mục kiến trúc được ghi rõ trong index. Không dùng nhãn `DONE` cho phần chỉ mới có code/unit test.

---

## 1. Kết luận điều hành

Implementation W25 đã tiến bộ rõ: dependency audit sạch, sanitize boundary tốt hơn, phần lớn unit test và production build đều xanh. Tuy nhiên chưa thể coi Week 25 hoàn tất vì:

1. Renderer có lỗi P0 ở đường chạy bình thường: `request.close` có thể abort một request hợp lệ ngay sau khi body hoàn tất.
2. Flow consent ảnh remote không thể hoạt động dưới CSP hiện tại.
3. AI server/client vẫn có các đường buffer không giới hạn và thiếu runtime protocol boundary.
4. PDF gateway/ticket còn đọc body không giới hạn, claim nonce sai thứ tự và thiếu validation renderer response.
5. Production-config gate không thật sự chạy ở production mode/target environment.
6. H và K vẫn được chính contract/index ghi `KEEP OPEN — PARTIAL`.
7. Docker isolation, SBOM, Trivy, Redis replay và target-deployment evidence chưa được chạy thật.
8. M/ThreatModel đang mô tả một số control là hoàn tất sớm hơn implementation/evidence.

**Quyết định:** reopen C, D, E, G, J, L và M; B/F giữ `PARTIAL`; H/K tiếp tục `KEEP OPEN — PARTIAL`; A/I chỉ cần regression guard.

---

## 2. Evidence baseline đã chạy

| Gate | Kết quả baseline | Diễn giải |
|---|---:|---|
| Root `npm audit --omit=dev` | PASS — 0 vulnerability | A không cần reopen nếu dependency tree không đổi |
| Renderer `npm audit --omit=dev` | PASS — 0 vulnerability | Phải chạy lại nếu thêm dependency |
| Encoding | PASS | 847 files |
| Lint | PASS | Có warning từ generated coverage file; không phải release blocker |
| Typecheck | PASS |  |
| PDF renderer unit | PASS | 10/10 |
| Full unit/subsystem suite | PASS | 163 files, 835 tests |
| Coverage gate | PASS | statements 65.98%, branches 58.99%, functions 55.05%, lines 68.37% |
| Production build | PASS | Next.js production build thành công |
| Production config checker | FALSE-GREEN | Chạy khi `NODE_ENV`/target env chưa được chọn nên không exercise production branch |
| Docker/Redis/PDF integration | NOT RUN | Docker daemon không hoạt động |
| SBOM/Trivy/effective sandbox/egress | NOT RUN | Chỉ có workflow/config, chưa có runtime evidence |
| Browser CSP/remote-image E2E | NOT RUN | Unit test hiện không chứng minh browser behavior |

Baseline này chỉ chứng minh repo có nền tảng ổn định để vá tiếp. Nó không phủ nhận các finding runtime/contract bên dưới.

---

## 3. Ma trận trạng thái thật sau review lần 2

| Contract | Trạng thái quyết định | Mức | Lý do |
|---|---|---:|---|
| A — dependency vulnerabilities | `DONE — REGRESSION ONLY` | Gate | Root/renderer audit sạch |
| B — rate-limit/trusted ingress | `REOPEN PARTIAL` | P1 | Runtime env vẫn fallback; Forwarded/hop/IP canonicalization chưa fail-closed |
| C — PDF gateway access | `REOPEN` | P1 | Ticket body unbounded; claim nonce trước config; response renderer validation thiếu |
| D — AI streaming | `REOPEN` | P0 | Request/fallback response unbounded; parser/schema/cancel/terminal semantics thiếu |
| E — renderer isolation | `REOPEN` | P0 | Normal request có thể bị abort; token/deadline/output/shutdown chưa đạt |
| F — reproducible renderer | `KEEP OPEN — EVIDENCE PARTIAL` | P1 gate | Chưa có clean build/runtime/SBOM/scan proof |
| G — CSP/remote image | `REOPEN` | P0 deploy | CSP chặn chính URL ảnh đã consent; middleware test false-green |
| H — import budgets | `KEEP OPEN — PARTIAL` | P1 availability | Main-thread fallback/deadline/pre-allocation budgets còn thiếu |
| I — sanitized HTML/sinks | `DONE — REGRESSION ONLY` | Gate | Các fix chính đã nối vào production path; cần giữ regression khi sửa G |
| J — readiness/config | `REOPEN` | P1 dependency | CI không chọn production target; config vẫn bị đọc/phân tích rải rác |
| K — coverage/fuzz/flake | `KEEP OPEN — PARTIAL` | P1 gate | Chưa có đủ lane/soak/integration và còn test false-green |
| L — CI/supply chain | `REOPEN PARTIAL` | P1 gate | Scanner ignore unfixed; waiver date lexical; retention/evidence thiếu |
| M — docs/threat model | `REOPEN — DO LAST` | P2 closure | Tài liệu và trạng thái đang khẳng định vượt evidence |

Quy tắc trạng thái:

- Mỗi contract chỉ được chuyển `DONE` khi code, negative test, integration/evidence và contract/index đồng bộ.
- CI workflow tồn tại không được tính là evidence nếu workflow chưa chạy thành công trên đúng commit/digest.
- Test mô phỏng sai browser/Node semantics không được dùng làm bằng chứng.
- A/I không bị refactor ngoài phạm vi; nếu thay đổi dependency hoặc sink thì phải chạy lại toàn bộ regression tương ứng.

---

## 4. Nguyên tắc triển khai bắt buộc

### 4.1 Reproduce trước, fix sau

Mỗi bug P0/P1 phải có test đỏ hoặc runtime probe chứng minh lỗi trước khi sửa. Commit fix phải làm chính test đó xanh. Không viết test chỉ assert implementation detail.

### 4.2 Bounded từ lúc đọc byte đầu tiên

Không dùng `request.text()`, `request.json()`, `response.text()` hoặc `response.json()` cho dữ liệu không tin cậy nếu chưa có byte cap ở stream. Mọi boundary mạng/file phải có:

- actual byte cap, không chỉ `Content-Length`;
- total deadline;
- idle/progress deadline nếu input có thể stream;
- cancellation truyền xuyên suốt;
- cleanup trong `finally`;
- typed public error ổn định, log không chứa payload/secret.

### 4.3 Deadline là timer thật

Việc tính `remainingMs()` rồi truyền vào một vài API không phải overall deadline. Phải có timer/abort watchdog bắt đầu tại handler entry, bao phủ body, dependency acquisition, render/parse và response.

### 4.4 Production config chỉ parse một lần

Routes/readiness/checker dùng cùng runtime schema và cùng typed config object. Test có thể gọi pure parser với env fixture, nhưng production process phải cache kết quả parse hợp lệ hoặc fail boot.

### 4.5 Evidence gắn với artifact phát hành

Commit SHA, lockfile hash, image digest, SBOM digest, scanner result, integration result và config-safe fingerprint phải trỏ tới cùng một artifact. Không rebuild image sau scan rồi phát hành digest khác.

---

## 5. Thứ tự triển khai

| Wave | Phạm vi | Điều kiện thoát |
|---|---|---|
| 0 | Reopen trạng thái + thêm regression tái hiện | Test đỏ đúng lỗi; release vẫn blocked |
| 1 | E — renderer P0 | Normal request render được; disconnect/deadline/output/auth/shutdown tests xanh |
| 2 | G — CSP/remote image P0 | Browser production E2E chứng minh zero request trước consent và load được sau consent |
| 3 | D — AI P0 | Server/client bounded, typed protocol, terminal/cancel/backpressure tests xanh |
| 4 | J + B, sau đó C | Canonical config fail-closed; gateway ordering/body/response/replay đạt |
| 5 | H | Không main-thread hostile fallback; ZIP/XML/XLSX/PPTX/PDF/OCR budgets trước allocation |
| 6 | F + L + K | Docker/SBOM/Trivy/Redis/browser/flake/soak/evidence chạy thật |
| 7 | M + contract/index sync | Docs khớp đúng behavior và evidence cuối |

Không bắt đầu Wave 7 khi còn bất kỳ checkbox runtime/evidence nào ở Wave 1–6.

---

## 6. Kế hoạch chi tiết

### Wave 0 — Reopen và khóa regression

**Files:**

- `Design/ContractForAI/Core/break_task/week25_break/w25_break_index.md`
- các contract C/D/E/G/J/L/M;
- test files tương ứng trong các mục dưới.

**Tasks:**

- [ ] Đổi trạng thái C/D/E/G/J/L/M thành `REOPEN` hoặc `PARTIAL` theo §3.
- [ ] Giữ H/K là `KEEP OPEN — PARTIAL`; bỏ mọi câu ngụ ý “không còn contract reopen”.
- [ ] Thêm issue/task ID ổn định `W25-2-*` cho từng work item.
- [ ] Ghi baseline commit và evidence vào từng PR; không nhúng secret hoặc dữ liệu report.
- [ ] Giữ remote PDF/public deploy bị disable cho tới khi C/J evidence đạt.

**Exit:**

- Contract/index không còn mâu thuẫn với implementation.
- Test tái hiện các P0 quan trọng đã đỏ trước fix hoặc được lưu làm commit/test evidence.

---

### Wave 1 — E: sửa PDF renderer P0

**Files chính:**

- `services/pdf-renderer/server.mjs`
- `services/pdf-renderer/server.test.mjs`
- `services/pdf-renderer/package.json`
- `docker-compose.pdf.yml`
- script PDF integration/sandbox/egress hiện có.

#### E1 — Sửa semantics client disconnect

- [ ] Bỏ `request.on("close")` khỏi vai trò “client aborted”.
- [ ] Dùng `request.on("aborted")` cho upload bị ngắt.
- [ ] Theo dõi `response.on("close")` và chỉ abort khi response chưa hoàn tất (`!response.writableEnded`/state tương đương).
- [ ] Cleanup toàn bộ listener/timer ở một `finally`, kể cả admission reject và lỗi body.
- [ ] Không đặt cờ `completed` rải rác theo từng branch; tạo lifecycle state rõ `reading → rendering → responding → completed`.

**Regression bắt buộc:**

- Request POST hợp lệ phát `end` rồi `close` theo semantics Node thật vẫn render PDF 200.
- Client cắt upload giữa body làm body reader abort và giải phóng body admission.
- Client disconnect trong render đóng page/context và trả render slot.
- Listener count/timer không tăng sau nhiều request.

#### E2 — Auth và media type fail-closed

- [ ] Token bắt buộc cho mọi environment ngoài explicit `NODE_ENV=test`.
- [ ] Không có nhánh `if (!TOKEN) return true`; token rỗng/default làm process fail boot.
- [ ] Validate `Content-Type: text/html` với charset cho phép; reject missing/wrong media type trước body.
- [ ] Giới hạn độ dài Authorization/header trước compare.
- [ ] Giữ constant-time compare cho token có cùng normalized length.

#### E3 — Numeric config schema

- [ ] Thay `Number.parseInt` permissive bằng parser yêu cầu chuỗi số nguyên đầy đủ.
- [ ] Reject `1.5`, `2abc`, whitespace-only, NaN, Infinity, âm, zero ngoài range và overflow.
- [ ] Kiểm hierarchy: idle body timeout < total deadline; concurrency/upload capacity/output cap nằm trong range.
- [ ] Production không được silently fallback khi env được khai báo nhưng invalid.

#### E4 — Body idle/total deadline

- [ ] Timer tổng bắt đầu tại handler entry.
- [ ] Body reader có idle timer reset chỉ khi nhận progress hợp lệ.
- [ ] `Content-Length` chỉ là early reject; actual chunk bytes là authority.
- [ ] Khi cap/deadline/abort xảy ra: destroy/cancel stream, release body admission đúng một lần.

#### E5 — Overall render deadline thật

- [ ] Tạo một deadline context/watchdog dùng chung cho `getBrowser`, context, page, `setContent`, `pdf` và response.
- [ ] Race/cancel những API Puppeteer không nhận `AbortSignal`; khi deadline hết phải chủ động đóng page/context.
- [ ] Không cho browser launch/restart treo vượt overall deadline.
- [ ] Phân biệt stable cause code: `body_idle`, `body_total`, `browser_deadline`, `render_deadline`, `output_limit`, `client_abort`.

#### E6 — Output cap và isolation

- [ ] Kiểm `pdf.byteLength` trước `response.writeHead`; vượt cap trả 413/typed error và không ghi partial PDF.
- [ ] Giữ mỗi job một BrowserContext; context/page đóng trong `finally`.
- [ ] Verify JS/navigation/popup/download/service worker/network interception tiếp tục fail-closed.
- [ ] Shutdown ngừng nhận cả upload và render admission, abort active uploads/contexts sau grace period, rồi đóng browser.

**Unit/integration DoD E:**

- [ ] Normal Node request regression xanh.
- [ ] Test mọi deadline phase và output cap.
- [ ] Token empty/default/malformed integer/wrong content-type negative tests xanh.
- [ ] `rtk npm run test:pdf-unit` xanh.
- [ ] Docker integration bằng token non-default xanh.
- [ ] Effective sandbox và network canary xanh; không chỉ đọc compose.

**Rollback:** rollback an toàn là disable remote PDF hoặc dùng last-known-good image digest; không khôi phục auth fail-open hay bỏ deadline.

---

### Wave 2 — G: sửa CSP và remote-image consent

**Files chính:**

- `src/middleware.ts`
- `src/middleware.test.ts`
- `src/components/PreviewPane.tsx`
- markdown/image classifier liên quan;
- Playwright CSP/privacy tests.

#### G1 — Chọn policy ảnh remote rõ ràng

Quyết định mặc định của plan này:

- Không tạo server image proxy vì chưa có SSRF contract.
- Trước consent, sanitizer/classifier phải thay mọi `http(s)` image bằng placeholder, không để remote URL ở thuộc tính có thể tự fetch.
- Sau explicit “Tải một lần”, client tạo `<img>` với `crossOrigin="anonymous"` và `referrerPolicy="no-referrer"`.
- CSP cho phép đúng direct HTTPS image flow sau consent, nhưng privacy boundary chính là placeholder state machine + test zero-request trước consent.

**Tasks:**

- [ ] Cập nhật `img-src` để không chặn flow HTTPS đã consent; không mở `script-src`, `connect-src`, `frame-src` hoặc `object-src` ngoài nhu cầu.
- [ ] Validate URL ngay trước load: chỉ `https:`, không credential, không fragment cần thiết, giới hạn URL length.
- [ ] Không persist trust mặc định; consent là per-image/per-session “load once”.
- [ ] Loading state có timeout, cancel, retry và cleanup handler/object.
- [ ] Error/CORS/timeout giữ placeholder, không fallback credentialed request.
- [ ] Export HTML/PDF không tự fetch remote URL; giữ placeholder hoặc yêu cầu asset local/data.

#### G2 — Sửa middleware test false-green

- [ ] Không fallback từ `x-nonce` request-forwarding assertion sang nonce đọc từ CSP response.
- [ ] Assert riêng:
  - CSP response có nonce đúng format;
  - request forwarded vào Next có cùng nonce;
  - hai request sinh nonce khác nhau;
  - production hydration/theme/RSC hoạt động dưới CSP enforce.
- [ ] Thêm negative test: inline script không nonce bị browser block.

**Browser DoD G:**

- [ ] Mở document có 100 ảnh remote tạo 0 request trước consent.
- [ ] Click một placeholder tạo tối đa request dự kiến và browser không báo CSP block.
- [ ] Request không có cookie/referrer; lỗi/timeout không tạo broken image.
- [ ] Reload không tự tải lại ảnh đã consent “một lần”.
- [ ] Production build + Playwright không có hydration/theme/RSC CSP violation.
- [ ] Offline/PWA vẫn hoạt động.

**Rollback:** đưa CSP đích về Report-Only có deadline xử lý; không thêm permanent `'unsafe-inline'` và không bỏ placeholder privacy boundary.

---

### Wave 3 — D: đóng toàn bộ AI streaming boundary

**Files chính:**

- `src/app/api/ai/route.ts`
- `src/app/api/ai/providers/openai.ts`
- `src/app/api/ai/providers/anthropic.ts`
- `src/app/api/ai/providers/gemini.ts`
- `src/modules/write/ai/adapters/http-adapter.ts`
- shared stream/body/schema helpers và tests.

#### D1 — Bounded request reader

- [ ] Thay `req.text()` bằng reader đọc stream theo actual UTF-8 bytes.
- [ ] Enforce content type, Content-Length early cap, actual byte cap, total deadline và idle deadline.
- [ ] Decoder dùng fatal/incomplete UTF-8 policy rõ; flush tại EOF.
- [ ] Parse JSON sau khi body đã nằm trong cap; validate bằng runtime schema, không cast.
- [ ] Client abort phải abort provider request trước khi gọi provider.

#### D2 — Provider protocol parsers fail-closed

- [ ] Oversized OpenAI/Anthropic/Gemini line/object không được trả `null` rồi bỏ qua; trả typed `protocol_limit`.
- [ ] Malformed frame, wrong upstream Content-Type, invalid JSON, depth quá lớn và trailing incomplete frame đều terminal error.
- [ ] Đếm tất cả parsed frames/events, kể cả usage/no-op, không chỉ delta.
- [ ] Có cap riêng cho upstream bytes, undecoded tail, current frame, event count, output chars/bytes và suggestion count.
- [ ] Vượt cap abort upstream ngay; không truncate rồi emit `done`.

#### D3 — Backpressure và terminal exactly-once

- [ ] Mỗi downstream `pull()` chỉ đọc bounded số upstream chunk/frame.
- [ ] Tôn trọng `desiredSize`; không dùng internal loop có thể hút toàn bộ upstream trong một pull.
- [ ] Mọi terminal path đi qua một state machine duy nhất.
- [ ] Nếu kết nối còn ghi được, limit/timeout/protocol error phát đúng một terminal NDJSON event rồi close.
- [ ] Client disconnect/stream error phải cancel reader và abort provider; không cố emit terminal lên socket đã đóng.
- [ ] Overall timeout trong lúc stream không gọi `controller.error()` trước khi xử lý terminal/cleanup state.

#### D4 — Client adapter bounded và typed

- [ ] Không dùng unbounded `response.json()` cho HTTP error.
- [ ] Không dùng unbounded `response.text()` cho fallback.
- [ ] Dùng chung bounded reader cho NDJSON và fallback body.
- [ ] Runtime-validate mỗi `AiStreamEvent` và error envelope.
- [ ] Decoder fatal + flush EOF; reject incomplete line/event.
- [ ] Giới hạn total response bytes, line bytes, event count, output/suggestion count.
- [ ] Trong `finally`, cancel reader khi parse/onEvent/cap lỗi; chỉ `releaseLock()` sau cleanup.
- [ ] Redact error body và không log prompt/output/API key.

**DoD D:**

- [ ] Tests: chunked oversized request, wrong media type, split UTF-8, no newline, huge frame, malformed JSON, wrong provider content-type.
- [ ] Tests: too many no-op/usage frames, output cap, overall/idle timeout, client abort.
- [ ] Slow-consumer test chứng minh upstream reads/pending memory bị bounded.
- [ ] Parser/callback error làm reader cancel và provider abort.
- [ ] Terminal exactly-once cho success, provider error, protocol error và limit.
- [ ] Existing AI positive flows và UI suggestion rendering không regression.

**Rollback:** disable AI feature/provider có lỗi; không quay lại unbounded `.text()`/`.json()` hoặc silent parser skip.

---

### Wave 4A — J + B: canonical production config và ingress identity

**Files chính:**

- `src/lib/server/production-config.ts`
- `scripts/check-production-config.mjs`
- `src/lib/server/rate-limit.ts`
- `src/app/api/ready/route.ts`
- AI/PDF routes và CI/deployment config.

#### J1 — Parse-once typed config

- [ ] Tách pure `parseServerConfig(env, target)` để test và singleton `getServerConfig()` để production dùng.
- [ ] Production process parse một lần; invalid config fail boot hoặc route fail-closed nhất quán.
- [ ] Routes/readiness không đọc lại `process.env` cho các biến đã thuộc schema.
- [ ] Phân loại biến `always required`, `feature-gated`, `optional bounded`, `test/dev only`.
- [ ] Mọi integer/url/secret/version/hierarchy dùng cùng validator với predeploy checker.

#### J2 — Production checker không còn false-green

- [ ] PR CI chạy fixture production hợp lệ và một ma trận invalid fixture.
- [ ] Deployment/pre-release job chạy checker với chính target environment/secrets injection.
- [ ] CI đặt target rõ (`NODE_ENV=production` và deployment target), không dựa vào default shell env.
- [ ] Checker xuất safe fingerprint/tên biến/trạng thái, không xuất secret value.
- [ ] Thiếu target env làm gate fail, không skip production branch.

#### J3 — Readiness cleanup

- [ ] Renderer/Redis probe có timeout, manual redirect và host policy.
- [ ] Cancel hoặc drain response body ở cả success/error trước khi kết thúc probe.
- [ ] Public readiness chỉ `{ready}` + `no-store`; diagnostics giữ operator auth timing-safe.

#### B1 — Trusted proxy/hop fail-closed

- [ ] Invalid `TRUSTED_PROXY_HOPS` không fallback về `1`; production config fail.
- [ ] Parser `Forwarded` giữ nguyên vị trí hop, reject empty/malformed/duplicate `for`, không `filter()` làm thay đổi chain.
- [ ] Mỗi ingress mode chỉ đọc header được platform đó bảo đảm.
- [ ] Direct mode bỏ qua toàn bộ forwarded headers.

#### B2 — Canonical IP

- [ ] Validate bằng `node:net.isIP`, sau đó canonicalize IPv4/IPv6 bằng một primitive chuẩn đã test.
- [ ] Các textual IPv6 tương đương phải tạo cùng HMAC bucket.
- [ ] Reject zone ID, port suffix, bracket/quote sai và whitespace bất thường.
- [ ] Không thêm dependency IP parser mới nếu chưa audit/đánh giá; nếu thêm phải reopen A regression gate.

**DoD J/B:**

- [ ] Production fixture checker chạy thật trong CI.
- [ ] Missing/invalid secret, URL, integer, hierarchy và target đều fail.
- [ ] Table/fuzz test Forwarded/XFF/IPv4/IPv6/hop chains xanh.
- [ ] Readiness response body được drain/cancel và không lộ topology.
- [ ] Root/renderer audit vẫn sạch.

---

### Wave 4B — C: PDF ticket/gateway

**Files chính:**

- `src/app/api/pdf/ticket/route.ts`
- `src/app/api/pdf/route.ts`
- `src/lib/server/pdf-access.ts`
- Redis/config helpers và integration tests.

#### C1 — Ticket issuer body và identity

- [ ] Thay `req.json()` bằng bounded JSON body reader dùng chung.
- [ ] Enforce content type, actual byte cap, total/idle deadline và runtime schema.
- [ ] `x-verified-identity` chỉ được tin khi deployment mode có topology proof; direct/public origin không được tự đặt.
- [ ] Remote PDF mặc định OFF nếu trusted issuer chưa có evidence.

#### C2 — Canonical capability và claims

- [ ] Chỉ nhận một transport canonical (`Authorization: Bearer` hoặc `x-pdf-ticket`, chọn một); bỏ alias còn lại.
- [ ] Runtime-validate payload đầy đủ:
  - `htmlHash` đúng 64 hex;
  - `sub` non-empty/bounded;
  - `jobId`/nonce bounded;
  - `sizeClass` enum;
  - `iat/nbf/exp` integer;
  - TTL/skew/temporal relationship hợp lệ;
  - `ver/iss/aud` exact.
- [ ] Header/base64/JSON/token length malformed phải fail generic trước body/renderer.

#### C3 — Sửa thứ tự claim nonce

Thứ tự bắt buộc:

1. feature/config/renderer URL/media/origin/header validation;
2. signature + static claims;
3. quota/backend availability;
4. bounded body;
5. hash/job/size comparison;
6. renderer request configuration sẵn sàng;
7. atomic claim nonce;
8. gửi renderer ngay sau claim.

- [ ] Không claim nonce khi renderer URL/config thiếu.
- [ ] Public replay/denied response dùng generic code; không thêm chuỗi `(anti-replay)` hoặc leak cause.
- [ ] Internal metrics có stable cause code nhưng không log ticket/hash/HTML/PDF.

#### C4 — Renderer response boundary

- [ ] `fetch` manual redirect, timeout và client-disconnect abort.
- [ ] Validate status và exact/allowed PDF Content-Type trước đọc body.
- [ ] Đọc PDF response bằng bounded stream; `%PDF-` chỉ là defense-in-depth sau media type.
- [ ] Cancel upstream body khi cap/content-type/client abort/error.
- [ ] Readiness/config URL allowlist dùng canonical J config.

**DoD C:**

- [ ] Oversized/slow chunked ticket body bị chặn trước JSON parse.
- [ ] Config failure không tiêu thụ ticket.
- [ ] Replay đồng thời trên hai app instance chỉ một request thành công.
- [ ] Wrong renderer content-type/redirect/oversized PDF bị reject và upstream canceled.
- [ ] Invalid claims có negative table tests.
- [ ] Docker Redis/renderer integration xanh; remote OFF vẫn giữ Print Preview.

**Rollback:** set `PDF_REMOTE_ENABLED=false`; không mở anonymous issuer hoặc process-local replay.

---

### Wave 5 — H: hoàn tất import resource budgets

**Files chính:**

- `src/modules/import/resource-policy.ts`
- `src/modules/import/zip-central-directory.ts`
- `src/modules/import/registry.ts`
- `src/modules/import/worker-client.ts`
- DOCX/PPTX/XLSX/PDF/OCR converters và security corpus/tests.

#### H1 — Validator arithmetic fail-closed

- [ ] `createInflationTracker` reject NaN, Infinity, âm, float và overflow.
- [ ] Theo dõi per-entry actual bytes và total actual bytes; không chỉ total.
- [ ] `validateCanvasPixels` yêu cầu width/height/cumulative là finite, positive/non-negative theo field, integer và multiplication không overflow.
- [ ] Negative/NaN/Infinity không được đi qua vì phép so sánh trả false.

#### H2 — Budget trước allocation

- [ ] Không gọi `entry.async("string")` rồi mới ghi nhận bytes.
- [ ] Dùng streaming/progressive inflate hook; abort ngay khi per-entry/total cap vượt trước khi join/materialize toàn output.
- [ ] Raw central-directory preflight vẫn là lớp đầu; actual streamed byte ledger là lớp thứ hai chống metadata giả.
- [ ] DOCX/PPTX/XLSX áp XML/sharedStrings/styles/relationship/media budgets trước parser/library materialization.

#### H3 — XLSX/PPTX parse ordering

- [ ] Không gọi `XLSX.read(buffer)` trước ZIP/XML/worksheet dimension/cell budgets.
- [ ] Preflight worksheet XML để chặn row/column/cell/shared-string/style bomb trước full workbook parse.
- [ ] PPTX slide/relationship/media counts và XML bytes được kiểm trước DOM/tree creation.
- [ ] Valid fixture trong budget vẫn giữ fidelity.

#### H4 — ZIP parser consistency

- [ ] Sau khi parse đúng `entryCount`, cursor phải bằng `centralDirEnd`; mismatch fail-closed.
- [ ] Kiểm entry count/central-directory-size/offset consistency, truncated/overlap/trailing differential.
- [ ] Corpus có ZIP64 supported/unsupported behavior explicit; không để low coverage che nhánh quan trọng.

#### H5 — Không hostile main-thread fallback

- [ ] Bỏ `FALLBACK_TO_MAIN_THREAD` cho PPTX/hostile converter path.
- [ ] Dùng worker-safe XML parser hoặc trả structured unsupported error; không tự chạy converter nặng trên UI thread.
- [ ] `registry.ts` chỉ cho main-thread fallback với định dạng/operation đã chứng minh bounded và được allowlist rõ; mặc định fail-closed.

#### H6 — Worker/OCR deadlines

- [ ] Worker client có total + idle/progress deadline và AbortSignal.
- [ ] OCR có deadline bao phủ PDF render, canvas allocation, recognition và worker termination.
- [ ] Timeout terminate worker; recreation có rate/concurrency cap.
- [ ] PDF loading/render/document/OCR resources cleanup trong `finally`.

**DoD H:**

- [ ] Bomb/fake metadata/NaN/negative/overflow tests fail trước allocation lớn.
- [ ] ZIP entry count/central-directory mismatch tests xanh.
- [ ] Huge sharedStrings/styles/worksheet/slide/media corpus bị chặn trước `XLSX.read`/DOM materialization.
- [ ] Không test hostile/large input nào thực thi converter trên main thread.
- [ ] OCR/worker idle/total timeout và abort race tests xanh.
- [ ] Constrained-browser test chứng minh UI vẫn responsive.

**Rollback:** reject định dạng/path chưa an toàn với thông báo rõ; không fallback sang parser main-thread hoặc nuốt lỗi.

---

### Wave 6A — K: security gates không false-green

**Files chính:**

- `vitest.config.ts`
- `.github/workflows/ci.yml`
- Playwright/security tests;
- renderer/stream/import fuzz/flake scripts.

#### K1 — Per-file coverage

- [ ] Đặt branch/function/line thresholds có ý nghĩa cho:
  - renderer lifecycle helpers;
  - AI route/provider/client adapter;
  - PDF ticket/gateway/pdf-access;
  - production config/rate-limit;
  - import resource policy/ZIP parser/worker;
  - middleware/CSP/remote image state machine.
- [ ] Threshold file critical không được bù bằng aggregate coverage.
- [ ] ZIP64 success/failure và disconnect/deadline branches có test thật.

#### K2 — Flake/constrained lanes

- [ ] Flake gate không chỉ chạy `pipeline-client`; thêm AI abort/backpressure, worker abort, PDF admission/deadline và remote-image state.
- [ ] Chạy nhiều seed/repetition với failure seed được in và lưu.
- [ ] Có constrained lane `maxWorkers=1`, slow body/consumer và resource budget hợp lý.
- [ ] PR lane bounded; scheduled/manual soak chạy dài hơn cho queue/worker/stream.

#### K3 — Browser/Docker regression

- [ ] Middleware nonce test không dùng fallback CSP nonce để chứng minh forwarded nonce.
- [ ] Browser test production CSP/hydration/remote-image.
- [ ] Renderer integration dùng Node HTTP thật để bắt `end/close/aborted` semantics.
- [ ] Docker canary kiểm script marker, egress, sandbox, slow-body admission và valid PDF.
- [ ] Failure artifacts upload kể cả job fail, có seed/reproducer nhưng không có user payload.

**DoD K:**

- [ ] Cố tình tháo từng critical cap/caller làm đúng test đỏ.
- [ ] Flake lane lặp ổn định; failure tái hiện được từ seed.
- [ ] Schedule/manual soak tồn tại, có timeout/owner/artifact.
- [ ] Coverage command và full suite xanh trên clean checkout.

---

### Wave 6B — F + L: image, supply chain và release evidence

**Files chính:**

- `services/pdf-renderer/Dockerfile`
- `docker-compose.pdf.yml`
- `.github/workflows/ci.yml`
- supply-chain waiver/evidence scripts;
- Dependabot config.

#### F1 — Runtime image proof

- [ ] Build renderer từ clean checkout bằng pinned base digest và `npm ci --omit=dev`.
- [ ] Chạy image non-root, read-only, `cap_drop: ALL`, `no-new-privileges`, bounded tmpfs/pids/memory/cpu.
- [ ] Verify Chromium sandbox effective; nếu `--no-sandbox` bắt buộc phải có ADR/profile proof riêng.
- [ ] Internal network + deployment policy chứng minh egress deny; request interception chỉ defense-in-depth.
- [ ] Dùng chính built digest cho integration, scan và evidence.

#### L1 — Scanner/waiver policy

- [ ] Không dùng `ignore-unfixed: true` để bỏ qua High/Critical.
- [ ] Scanner finding High/Critical làm gate fail trừ khi đi qua waiver registry hợp lệ.
- [ ] Waiver schema strict về field/type/enum/date/path/owner/exit condition.
- [ ] So sánh `reviewBy`/`expiresAt` bằng parsed timestamp, không lexical string.
- [ ] Reject non-zero-padded/invalid timezone/date, duplicate waiver và affectedPaths sai type.

#### L2 — Artifact/evidence

- [ ] Mọi `upload-artifact` có explicit `retention-days`.
- [ ] Audit/SBOM/scan/test evidence upload cả khi gate fail bằng `if: always()` phù hợp.
- [ ] Evidence manifest liên kết:
  - commit SHA;
  - root/renderer lockfile hashes;
  - image/base digests;
  - SBOM hash;
  - scanner version/database timestamp/result;
  - audit result;
  - unit/coverage/browser/Docker/Redis result;
  - production-config safe fingerprint.
- [ ] Strict evidence verifier fail nếu thiếu/mismatch artifact.
- [ ] Release consume đúng tested digest; không rebuild sau gate.

#### L3 — CI lane topology

- [ ] Tách lane tối thiểu: static/unit, coverage/security, production build/browser, Docker isolation/integration, supply-chain/evidence.
- [ ] Không để một giant job 45 phút làm mất toàn bộ evidence khi bước cuối timeout.
- [ ] Cache không thay thế clean `npm ci`.
- [ ] Full-SHA action pins và least privilege tiếp tục được static checker enforce.

**DoD F/L:**

- [ ] Root + renderer audit sạch trên clean install.
- [ ] SBOM và Trivy scan đúng image digest; High/Critical không-waiver làm đỏ.
- [ ] Docker isolation/Redis replay/browser production lanes xanh.
- [ ] Artifact retention và strict evidence manifest được kiểm tự động.
- [ ] GitHub Actions run trên commit phát hành xanh; local config review không đủ để đóng.

---

### Wave 7 — M: đồng bộ tài liệu và trạng thái cuối

**Chỉ bắt đầu sau khi Wave 1–6 có evidence.**

**Files chính:**

- `Design/Security/ThreatModel.md`
- `Design/Deployment.md`
- `Design/ProductPRD.md`
- `README.md`
- `.env.example`
- từng contract A–M;
- `w25_break_index.md`;
- file plan này.

**Tasks:**

- [ ] Sửa ThreatModel T3/T8/T11 theo behavior/evidence cuối:
  - không nói renderer canary/sandbox/egress đã chứng minh nếu CI chưa xanh;
  - mô tả đúng preflight + actual streamed inflation ledger;
  - mô tả cả AI server request boundary và client schema/caps/cancellation.
- [ ] `.env.example` ghi API key memory-only rõ, không dùng từ “stores locally” mơ hồ.
- [ ] ProductPRD/README/Deployment phân biệt local-first mặc định với AI/PDF/remote-image egress có consent.
- [ ] Contract F/L chỉ `DONE` khi có URL/run ID/digest evidence thật.
- [ ] Contract H/K chỉ `DONE` khi toàn bộ remaining items đã đóng.
- [ ] C/D/E/G/J chỉ `DONE` khi regression/integration tương ứng xanh.
- [ ] Cập nhật A–M và index trong cùng commit; không có nhãn mâu thuẫn.
- [ ] Ghi residual risk, owner, review cadence và rollback cho mỗi boundary.

**DoD M:**

- [ ] Repo-wide parity search không còn claim stale đã liệt kê.
- [ ] Mọi `DONE` có evidence path/run/digest kiểm lại được.
- [ ] Không đưa secret/user payload vào docs/artifacts.
- [ ] Có security review độc lập của người ngoài người thực thi fix.

---

## 7. Test matrix bắt buộc

| Boundary | Positive | Negative/adversarial | Gate |
|---|---|---|---|
| Renderer HTTP lifecycle | POST HTML → PDF 200 | normal `close`, aborted upload, response disconnect | Unit + Node HTTP integration |
| Renderer deadline/output | bounded render | hung browser/page/pdf, slow body, oversized PDF | Unit + Docker |
| Renderer isolation | two isolated jobs | script/popup/navigation/egress canary | Docker |
| Remote image/CSP | click loads HTTPS image | zero pre-consent request, CSP block, timeout/CORS | Production Playwright |
| AI request | valid bounded JSON | chunked oversize, idle, malformed UTF-8/schema | Route integration |
| AI upstream stream | valid provider frames | huge/no-op/malformed/wrong content-type/timeout | Parser + stream tests |
| AI client | valid NDJSON | huge fallback, invalid event, callback throw | Adapter tests |
| Runtime config | valid production target | missing target/secret, invalid number/url/hierarchy | CI matrix + deploy gate |
| Trusted ingress | canonical IP/hop | forged/empty/quoted/malformed/equivalent IPv6 | Property/fuzz |
| PDF ticket | valid identity/capability | anonymous, oversize body, invalid claims | Route integration |
| PDF replay/renderer | one-time valid render | two-instance replay, config failure, wrong PDF type/cap | Redis + Docker |
| Import ZIP/XML | valid office fixtures | fake metadata, count mismatch, bomb/sharedStrings/styles | Corpus/fuzz |
| Import worker/OCR | bounded worker success | main-thread fallback, idle/total timeout, abort race | Browser/constrained |
| Supply chain | clean pinned digest | expired waiver, tag action, High/Critical scan | CI/evidence verifier |

Mọi negative test phải assert:

- phase bị chặn;
- stable cause/status;
- dependency đắt tiền phía sau chưa được gọi nếu lỗi xảy ra trước boundary;
- admission/reader/context/worker/timer được cleanup;
- log/artifact không chứa payload hoặc secret.

---

## 8. Commands/gates tối thiểu

Chạy trên clean checkout và dùng RTK theo quy ước repo:

```text
rtk npm ci
rtk npm audit --omit=dev --json
rtk npm audit --omit=dev --json --workspace services/pdf-renderer
rtk npm run check:encoding
rtk npm run lint
rtk npm run typecheck
rtk npm run test:pdf-unit
rtk npm run test
rtk npm run test:coverage
rtk npm run build
rtk node scripts/check-ci-actions.mjs
rtk node scripts/check-supply-chain.mjs
```

Ngoài các lệnh trên, release bắt buộc có:

- production-config checker trong CI/deployment với target production env rõ;
- production Playwright CSP/remote-image suite;
- Docker renderer integration với token non-default;
- Redis multi-instance replay test;
- SBOM + Trivy scan cùng image digest;
- strict release-evidence verification;
- scheduled/manual soak K.

Không thay Docker/browser/Redis evidence bằng unit mock.

---

## 9. Observability và privacy

Được phép log:

- server-generated correlation ID;
- stable cause code;
- phase;
- aggregate byte/event/count/duration;
- outcome/admission metrics;
- image/commit digest công khai.

Cấm log hoặc upload:

- API/PDF/rate-limit/operator secret;
- ticket/capability;
- raw IP hoặc API key;
- prompt/AI output;
- report HTML/PDF;
- imported document/image/OCR text;
- Redis payload chứa identity;
- full production env.

Test failure artifacts phải dùng synthetic fixture và redaction.

---

## 10. Rollback strategy

| Scope | Rollback an toàn |
|---|---|
| E/C/F | `PDF_REMOTE_ENABLED=false` hoặc last-known-good tested image digest |
| G | CSP Report-Only có thời hạn + policy enforce cuối đã chứng minh; vẫn giữ placeholder |
| D | Disable provider/AI feature; không quay lại unbounded reader |
| J/B | Roll back deployment config version có kiểm soát; không dùng default secret/hop |
| H | Reject định dạng/path chưa an toàn với UX message; không main-thread fallback |
| K/L | Giữ release blocked khi CI/evidence hỏng; không bypass scanner/threshold |
| M | Docs phải phản ánh trạng thái rollback thực, không giữ claim `DONE` cũ |

Mọi rollback phải tạo incident/evidence note và cập nhật contract status nếu control không còn hiệu lực.

---

## 11. Chia PR/commit

Không gom toàn bộ thành một PR:

1. `w25-2/e-renderer-lifecycle-deadlines`
2. `w25-2/g-csp-remote-image`
3. `w25-2/d-ai-stream-boundaries`
4. `w25-2/j-b-config-ingress`
5. `w25-2/c-pdf-gateway-ordering`
6. `w25-2/h-import-preallocation-budgets`
7. `w25-2/k-security-regression-lanes`
8. `w25-2/f-l-release-evidence`
9. `w25-2/m-docs-status-sync`

Mỗi PR phải có:

- threat/bug ID được đóng;
- before/after behavior;
- positive + negative tests;
- config/migration/rollback;
- gate/evidence URL hoặc artifact digest;
- contract/index status update phù hợp;
- ghi rõ phần còn lại nếu chưa đủ `DONE`.

---

## 12. Definition of Done toàn bộ W25 pass 2

Release chỉ được mở khi tất cả checkbox sau xanh:

- [ ] E: normal request không bị `close` abort; disconnect semantics đúng.
- [ ] E: auth/media/numeric/body/overall deadline/output/shutdown fail-closed.
- [ ] G: zero remote request trước consent; HTTPS load sau consent không bị CSP chặn.
- [ ] G: production hydration/theme/RSC/PWA CSP browser tests xanh.
- [ ] D: server request, provider parser và client adapter đều bounded/typed/cancellable.
- [ ] D: backpressure và terminal exactly-once tests xanh.
- [ ] J: routes/readiness/checker dùng canonical parsed config.
- [ ] J: checker chạy với target production env thật.
- [ ] B: hop/header/IP canonicalization fail-closed và fuzz xanh.
- [ ] C: bounded issuer/gateway body, full claim schema, canonical ticket transport.
- [ ] C: config failure không đốt nonce; renderer response bounded/typed.
- [ ] C: Redis multi-instance replay integration xanh.
- [ ] H: actual inflation/per-entry/total/pixel arithmetic fail-closed trước allocation.
- [ ] H: XLSX/PPTX/ZIP consistency budgets trước materialization.
- [ ] H: không hostile main-thread fallback; worker/OCR deadlines xanh.
- [ ] K: per-file critical coverage, meaningful flake/constrained lane và scheduled soak xanh.
- [ ] F: clean image build + effective runtime sandbox/egress probe xanh.
- [ ] L: scanner High/Critical không-waiver fail; waiver timestamp/schema strict.
- [ ] L: retention + strict evidence manifest gắn cùng commit/image digest.
- [ ] Root và renderer production audit vẫn đạt policy.
- [ ] Encoding, lint, typecheck, full tests, PDF unit, coverage và production build xanh trên clean checkout.
- [ ] Production Playwright, Docker renderer, Redis replay, SBOM/Trivy và evidence verifier xanh trên commit phát hành.
- [ ] A/I regression suites xanh; không phát sinh dependency/sink regression.
- [ ] M/ThreatModel/PRD/README/Deployment/env example khớp implementation/evidence cuối.
- [ ] Tất cả contract A–M và `w25_break_index.md` có trạng thái nhất quán.
- [ ] Security review độc lập xác nhận không có secret/user-data trong log/artifact.

Nếu còn một checkbox `[ ]`, trạng thái tổng vẫn là:

```text
W25 PASS 2 — NOT DONE / RELEASE BLOCKED
```

Chỉ sau khi toàn bộ checkbox đạt mới đổi thành:

```text
W25 PASS 2 — DONE / RELEASE CANDIDATE
```
