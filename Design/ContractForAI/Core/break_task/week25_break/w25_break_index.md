# W25 Break — Index Contract (Security Closure · Dependency Hygiene · Abuse/Resource Boundaries)

> **Lane:** Core / break_task / week25_break.
> **Branch (chung cả tuần):** `main`. Mỗi contract = **1 commit logic riêng**; docs contract được review/approve trước khi thi công code.
> **Nguồn:** security/code-health audit ngày **2026-07-22** trên workspace hiện tại; `npm audit --omit=dev --json`; source review các route AI/PDF, renderer, import pipeline, markdown/CSP, CI và deployment contract.
> **Cách viết:** giữ format W24 (Lane/Branch/Type · Findings S-mã · Micro-task · Locked · Scope · Checklist · Files · Risks · Verification · Status).
> **Chủ đề tuần:** đóng các lỗ hổng còn lại theo defense-in-depth, với quota/parser/stream/container đều **hữu hạn**, identity chỉ lấy từ ingress đáng tin, dependency/build có thể tái lập, và security claim phải có test thật.

## Kết luận audit đã hiệu chỉnh

- `npm audit --omit=dev` hiện báo **13 node bị ảnh hưởng**: **1 critical, 8 high, 2 moderate, 2 low**; con số “6 lỗ hổng” trong review ban đầu đã cũ/đếm theo advisory thay vì affected package nodes.
- Đường `tar` thực tế là `pdfjs-dist -> canvas -> @mapbox/node-pre-gyp -> tar`, **không phải** `sharp -> node-pre-gyp -> tar`. Override `tar: 7.5.16` vẫn nằm trong vùng lỗi; critical advisory bao phủ `<=7.5.18`.
- Không dùng `npm audit fix --force` vì gợi ý downgrade Next không phù hợp. Vá leaf/transitive có kiểm soát và kiểm chứng lockfile/build/runtime.
- PDF renderer có SSRF defense tốt (JS off + request interception chỉ `about:blank`/`data:` + token timing-safe), nhưng vẫn còn boundary quan trọng: Chromium `--no-sandbox`, slow-body không nằm trong deadline, build container không dùng lockfile.
- Nhận định “coverage xuất sắc/test ~1:1” chưa có bằng chứng: repo có nhiều test nhưng Vitest chưa bật coverage provider/threshold; integration test PDF chưa chứng minh JS/network thực sự bị chặn.

## Nguyên nhân gốc và owner contract

| Mã | Nguyên nhân gốc | Mức | Contract owner |
|---|---|---:|---|
| **A** | Dependency tree prod còn tar/sharp/brace-expansion/DOMPurify trong range lỗi; override tar đã lỗi thời. | 🔴 | `w25_fix_production_dependency_vulnerabilities` |
| **B** | Identity quota ghép header/key do client điều khiển; PDF cho xoay `x-api-key`; proxy headers có thể spoof nếu origin nhận traffic trực tiếp. | 🔴 | `w25_fix_rate_limit_identity_trusted_ingress` |
| **C** | PDF gateway là compute surface công khai; quota đơn thuần không thay auth/authorization, Fetch Metadata hay edge admission. | 🔴 | `w25_secure_public_pdf_gateway_access_policy` |
| **D** | AI `requestId`/parser buffers/event stream không có trần đầy đủ; error message nội bộ lọt ra; downstream chậm có thể gây amplification. | 🔴 | `w25_harden_ai_stream_protocol_resource_bounds` |
| **E** | Renderer chạy Chromium `--no-sandbox`; body read ngoài tổng deadline; HTTP slowloris/egress/isolation chưa thành contract. | 🔴 | `w25_harden_pdf_renderer_sandbox_deadlines_egress` |
| **F** | Renderer image chạy `npm install` không lockfile, base image không pin digest, context chưa tối giản/scan. | 🟠 | `w25_harden_pdf_renderer_reproducible_container` |
| **G** | CSP production còn `'unsafe-inline'`; preview mặc định cho ảnh remote `https:` nên tài liệu import có thể phát tracking request. | 🟠 | `w25_harden_csp_and_remote_image_privacy` |
| **H** | Import chỉ cap kích thước file nén; chưa cap ZIP expansion/entry count/ratio và complexity/pixel/time theo định dạng. | 🔴 | `w25_harden_document_import_resource_budgets` |
| **I** | `clobberPrefix:""`; sanitize chạy trước plugin output; regex PDF sanitizer dễ bị hiểu nhầm là security boundary. | 🟠 | `w25_harden_markdown_dom_and_pdf_sanitization` |
| **J** | `/api/ready` lộ cause nội bộ; env số/URL/deadline hierarchy chưa validate toàn diện. | 🟠 | `w25_harden_readiness_and_runtime_config_contract` |
| **K** | Coverage chưa được đo; test flaky load-sensitive; PDF isolation test chỉ kiểm `%PDF-`/size. | 🟠 | `w25_add_security_coverage_fuzz_and_flake_gates` |
| **L** | GitHub Actions dùng mutable tags; audit/SBOM/container scan/supply-chain policy chưa thành release gate. | 🟠 | `w25_harden_ci_supply_chain_and_release_evidence` |
| **M** | Docs còn nói API key ở localStorage; threat model chưa nói rõ IDB plaintext/same-origin XSS/device-profile boundary. | 🟡 | `w25_align_security_docs_threat_model_data_at_rest` |

## Locked dùng chung mọi contract

- 🔒 **Không hạ Next/React** chỉ để làm `npm audit` xanh; không dùng `npm audit fix --force`; mọi override phải có lý do, owner và exit criterion.
- 🔒 **Không tin dữ liệu do client gửi để tạo quota identity.** `x-api-key`, `x-forwarded-for`, `x-real-ip`, `cf-connecting-ip` chỉ được dùng theo một ingress contract đã xác minh; direct origin phải bị chặn hoặc bỏ qua forwarded headers.
- 🔒 **Rate limit không phải authentication.** Compute PDF public phải có access policy rõ; CSRF/Origin/Fetch Metadata chỉ là defense-in-depth.
- 🔒 Mọi body, archive, parser buffer, stream event, output, queue, concurrency và deadline phải có **hard cap + cancellation + cleanup + metric**.
- 🔒 Không log API key/token, prompt/output AI, HTML/PDF, nội dung tài liệu, ảnh/OCR hoặc IndexedDB payload. Log chỉ cause code và aggregate bytes/count/duration/outcome.
- 🔒 Không bỏ sanitize, request interception, JS-off, `%PDF-` verification, input/output caps, timing-safe token hoặc fail-closed production để làm test/build xanh.
- 🔒 Browser/container/native dependency phải được xem là security boundary riêng; `npm audit` xanh không thay container scan/SBOM/runtime isolation.
- 🔒 Security gate phải kiểm **hành vi thật**, không chỉ kiểm status/size hay mock một lớp không chạm boundary.
- 🔒 Migration heading ID/CSP/import phải giữ parity TOC/export/offline; có rollback/compatibility test trước khi đổi public behavior.

## Thứ tự thi công đề xuất

1. **A + L** — chốt dependency và release evidence trước; A sửa cây hiện tại, L ngăn tái phát.
2. **B → C** — identity/trusted ingress trước, rồi access policy cho PDF; không xây auth trên identity spoofable.
3. **D** — đóng AI amplification/parser/error leak, độc lập PDF.
4. **E → F** — runtime isolation/deadline trước, rồi image reproducibility/scan; deploy cùng release renderer.
5. **H** — import resource budgets là blocker local-first vì dữ liệu attacker chạy client-side vẫn có thể làm treo tab.
6. **I → G** — ổn định DOM IDs/sanitize sinks trước khi siết CSP và remote-image policy.
7. **J** — public/internal readiness split + config validation sau khi access/deadline contracts đã chốt.
8. **K** — bổ sung canonical regression/coverage/fuzz cho tất cả boundary trên; có thể chuẩn bị song song nhưng chỉ DONE khi chạy trên code đã vá.
9. **M** — cập nhật threat model/docs cuối để phản ánh đúng implementation đã ship.

## Map phát hiện → tiêu chí đóng

| # | Phát hiện | Contract | Điều kiện đóng tối thiểu |
|---:|---|---|---|
| 1 | 13 affected prod nodes; tar override vulnerable | A | Clean install + `npm audit --omit=dev` không còn 4 advisory families; build/test/image smoke xanh |
| 2 | PDF xoay `x-api-key` để né quota | B | PDF identity không phụ thuộc client key; spoof-header integration tests xanh |
| 3 | AI bucket ghép IP+key cho phép đổi một vế né quota | B | Hai limiter độc lập per-IP và per-key fingerprint, fail-closed |
| 4 | PDF compute public/unauthenticated | C | Signed/session access policy + edge/origin protection + abuse tests |
| 5 | AI requestId/buffers/errors/backpressure chưa bounded | D | Fuzz fragmentation + oversized/no-newline/slow-client/abort tests, generic public errors |
| 6 | Chromium `--no-sandbox`, slow body, egress chưa khóa | E | Sandbox/isolation proof, total deadline từ byte đầu, canary egress test |
| 7 | Renderer build không reproducible | F | `npm ci` từ lock, digest pin, minimal context, SBOM/scan artifact |
| 8 | CSP inline + remote image tracking | G | nonce/hash CSP production; remote image default-block/explicit consent; no-referrer test |
| 9 | ZIP/document/OCR bombs | H | Per-format resource matrix + adversarial fixtures fail nhanh, worker/tab còn responsive |
| 10 | DOM clobber/final plugin output/regex sanitizer | I | Prefixed IDs + final allowlist sanitize + sink/fuzz parity tests |
| 11 | Ready/config detail/range validation | J | Public generic readiness; internal authenticated diagnostics; invalid env fail predeploy |
| 12 | Coverage claim/flaky pipeline/PDF false-positive test | K | Coverage thresholds + deterministic test + actual isolation proof |
| 13 | Mutable Actions/audit-only supply chain | L | SHA-pinned Actions + root/service audit + SBOM/container/native scan release gate |
| 14 | Stale key-storage docs + local-at-rest boundary thiếu | M | Threat model/data lifecycle/docs/code comments thống nhất |

## Trạng thái

| Contract | Trạng thái |
|---|---|
| A — Production dependency vulnerabilities | `DONE` |
| B — Rate-limit identity & trusted ingress | `DONE` |
| C — Public PDF access policy | `PROPOSED` |
| D — AI stream protocol resource bounds | `DONE` |
| E — Renderer sandbox/deadline/egress | `PROPOSED` |
| F — Reproducible renderer container | `PROPOSED` |
| G — CSP & remote-image privacy | `DONE` |
| H — Document import resource budgets | `DONE` |
| I — Markdown/DOM/PDF sanitization | `PROPOSED` |
| J — Readiness/runtime config | `PROPOSED` |
| K — Coverage/fuzz/flake/security gates | `PROPOSED` |
| L — CI supply chain/release evidence | `DONE` |
| M — Security docs/threat model/data at rest | `PROPOSED` |

