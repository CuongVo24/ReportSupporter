# Index & Rule — Week 25 Security & Reliability Break

> **Context:** Tuần 25 tạm dừng tính năng mới để khắc phục toàn bộ lỗ hổng bảo mật, rủi ro cạn kiệt tài nguyên, lỗ hổng supply-chain và nợ kỹ thuật từ đợt kiểm thử độc lập ngày 2026-07-22.
> **Mục tiêu:** 100% contract trong đợt break được thực thi có thứ tự, có bằng chứng verification, không rò rỉ dữ liệu, không có đường vây hãm tài nguyên (DDoS/bomb), và không có suy giảm trải nghiệm offline-first của ReportSupporter.

---

## Tóm tắt phát hiện bảo mật đợt 2026-07-22

- Cây phụ thuộc sản phẩm còn rủi ro CVE công khai (`tar`, `sharp`, `brace-expansion`, `DOMPurify` range cũ).
- Rate limit identity có thể bị qua mặt qua `x-api-key` hoặc IP/forwarded headers nếu không nằm sau trusted ingress.
- Renderer PDF công khai chạy `--no-sandbox`, thiếu strict network isolation và deadline thống nhất từ byte đọc đầu tiên.
- Import nén/tài liệu chưa có trần đa tầng (ZIP ratio, entry count, OCR image canvas, memory allocation budget).
- CSP sản phẩm còn rủi ro inline; remote image chưa có cơ chế bảo vệ quyền riêng tư người dùng.
- AI stream protocol chưa bounded triệt để đối với buffer fragmentation, stream amplification và rò rỉ lỗi hệ thống ra response.
- CI/supply-chain dùng mutable Actions tags, thiếu SBOM/container scan tự động và chưa khóa release evidence.
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

> **Cập nhật 2026-07-25 (re-verification pass sau `w25_fix-all-bugs.md`):** review cùng ngày phát hiện A–M đều có gap thật giữa nhãn `DONE`/`PROPOSED` cũ và implementation (chi tiết § Kết luận trong `w25_fix-all-bugs.md`). Toàn bộ đã được REOPEN và vá lại trong cùng ngày, commit riêng từng contract (`w25/*` branch naming theo `w25_fix-all-bugs.md` §10). Trạng thái dưới đây phản ánh kết quả SAU re-fix, không phải trạng thái tại thời điểm review ban đầu.

| Contract | Trạng thái |
|---|---|
| A — Production dependency vulnerabilities | `DONE` (re-verified 2026-07-25) |
| B — Rate-limit identity & trusted ingress | `DONE` (re-verified 2026-07-25) |
| C — Public PDF access policy | `DONE` (re-verified 2026-07-25) |
| D — AI stream protocol resource bounds | `DONE` (re-verified 2026-07-25) |
| E — Renderer sandbox/deadline/egress | `DONE` (re-verified 2026-07-25; SBOM/scan/container probe chưa chạy thật — không có Docker daemon trong sandbox, CI job `verify` là lần chạy thật đầu tiên) |
| F — Reproducible renderer container | `DONE` (re-verified 2026-07-25; cùng ghi chú "chưa verify Docker thật" như E) |
| G — CSP & remote-image privacy | `DONE` (re-verified 2026-07-25; verify thật bằng production build + browser, xem file contract §7) |
| H — Document import resource budgets | `KEEP OPEN — PARTIAL` (re-verified 2026-07-25; ZIP bomb/inflation/pixel budget đã đóng thật, PPTX DOMParser worker-fallback + OCR idle-deadline còn mở — xem file contract §7 "Còn lại") |
| I — Markdown/DOM/PDF sanitization | `DONE` (re-verified 2026-07-25; đồng thời sửa mismatch file `PROPOSED` vs index `DONE` cũ) |
| J — Readiness/runtime config | `DONE` (re-verified 2026-07-25, 2 lần trong cùng ngày — lần đầu buổi sáng còn thiếu secret/URL validation) |
| K — Coverage/fuzz/flake/security gates | `KEEP OPEN — PARTIAL` (2026-07-25; coverage threshold + fuzz mở rộng cho file mới, nhưng `ci.yml` chưa phân lane unit/browser/Docker/soak rõ ràng hơn) |
| L — CI supply chain/release evidence | `DONE` (re-verified 2026-07-25; SBOM/scan/evidence-manifest mới, cùng ghi chú "chưa chạy thật" như E/F) |
| M — Security docs/threat model/data at rest | `DONE` (2026-07-25 — pass này) |
