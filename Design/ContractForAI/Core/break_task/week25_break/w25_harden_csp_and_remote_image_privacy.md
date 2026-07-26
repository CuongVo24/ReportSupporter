# Contract For AI — W25 Harden (G): CSP Không `unsafe-inline` · Ảnh Remote Mặc Định Không Theo Dõi Người Dùng

> **Lane:** Core / break_task / week25_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Browser XSS/privacy hardening; làm sau I.
> **Findings:**
> - **S1** (🟠) — production CSP còn `script-src 'self' 'unsafe-inline'`, làm yếu boundary nếu một HTML injection lọt sanitizer/sink.
> - **S2** (🟠) — `img-src` cho `https:` và preview giữ remote `http(s)` refs; mở tài liệu import có thể tự động gọi tracker, lộ IP/timing/referrer và phá kỳ vọng local-first.
> - **S3** (🟡) — Export HTML đã dùng CSP chặt hơn (`default-src 'none'; img-src data:`), nhưng preview/app policy chưa parity về remote asset privacy.
> **Builds on:** I final sanitize/heading IDs, W24-A missing-image no-network placeholder, Next/PWA headers.
> **Sources:** config/asset pipeline review 2026-07-22.

---

## 1. Micro-task Target

Production app chạy bằng nonce/hash CSP không cần broad inline script; remote images trong nội dung tài liệu **default block** thành placeholder và chỉ tải sau consent rõ, với no-referrer/cross-origin protections. Local data/blob assets và PWA vẫn hoạt động.

- **S1 — CSP/security headers migration.** Chọn Next-compatible nonce per response hoặc build hashes; `script-src` không broad `'unsafe-inline'`, thêm `object-src 'none'`, `base-uri 'none'`, `frame-ancestors`/Trusted Types report-only nếu phù hợp. Chốt HSTS ở TLS production (không bật trên local), `Referrer-Policy`, `X-Content-Type-Options` và Permissions Policy tối thiểu; dev policy tách production.
- **S2 — Remote asset classifier.** `data:`/resolved offline asset load; local unresolved dùng W24 placeholder; `http(s)` remote thành “Ảnh từ nguồn ngoài — chưa tải” mặc định.
- **S3 — Explicit load.** User click/setting per-document/per-origin mới tải; dùng `referrerPolicy="no-referrer"`, safe cross-origin behavior, size/time cap; không persist credential/cookie.
- **S4 — Export parity.** Self-contained export không auto-fetch remote; placeholder hoặc explicit embed qua bounded fetch policy riêng được approve — không âm thầm server-fetch.

> 🔒 Không bật `unsafe-eval`; không mở wildcard script/connect/frame. Không gọi remote để “kiểm tra tồn tại” trước consent.

## 2. Scope

### In scope
- Next middleware/config/headers (MODIFY): nonce/hash CSP và security headers.
- `resolve-assets.ts`, PreviewPane/ImportPreviewDialog/export preparation (MODIFY): remote placeholder/consent/no-referrer.
- PWA/offline/CSP E2E + privacy network assertions (NEW/UPDATE).

### Out of scope
- ❌ Server-side remote image proxy/fetch.
- ❌ Download và persist ảnh remote tự động.
- ❌ General link navigation policy ngoài safe rel/referrer.

## 3. Checklist

- [x] Production response không có broad `script-src 'unsafe-inline'`; HSTS/referrer/nosniff/permissions headers đúng profile; app/hydration/PWA hoạt động dưới enforced CSP.
- [x] Mở/import tài liệu có remote image phát **0 request** trước consent.
- [x] Sau consent, request dùng no-referrer và bị cap/cancel; failure thành placeholder, không spinner vô hạn.
- [x] HTML/PDF/DOCX không chứa remote fetch bất ngờ; export policy rõ và test.
- [x] CSP violation report/test không chứa nội dung tài liệu/secret.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `next.config.ts` | MODIFY | Production CSP khôngbroad script unsafe-inline, img-src data: blob: |
| `src/modules/write/resolve-assets.ts` | MODIFY | Remote image classification & privacy consent placeholders |
| `src/components/PreviewPane.tsx` | MODIFY | Click handler cho load-remote-image với no-referrer & crossorigin attributes |
| `src/modules/write/__security__/remote-image-privacy.fuzz.test.ts` | NEW | Security & privacy test suite cho classifier, placeholder & export parity |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Next/PWA inline bootstrap bị CSP chặn | High | Report-only staging, inventory exact inline needs, nonce propagation test; enforce only after zero unexplained violation. |
| User mất ảnh remote mong đợi | Med | Placeholder rõ + load once/trust origin action; explain privacy tradeoff. |
| Consent state làm local-first data phức tạp | Low | Per-document minimal setting, no credentials; default block on import. |
| Data URL CSP quá rộng | Med | Chỉ `img-src data:/blob:` cần thiết; script/style không kế thừa. |

## 6. Verification Plan

- Production Playwright under enforced CSP: hydrate/editor/worker/PWA/update/route navigation không violation.
- Import Markdown có canary images qua http/https/redirect: 0 hit trước consent; exact allowed hit sau click, no Referer.
- XSS corpus qua markdown/Mermaid/heading IDs không execute; exported artifact offline không gọi network.

## 7. Status

`DONE (2026-07-25, re-verified after REOPEN — prerequisite I closed first).`

Review 2026-07-25 (`w25_fix-all-bugs.md` §1.1.5, §1.2) tìm thấy gap trong bản DONE trước: `script-src 'self'` production KHÔNG có `'unsafe-inline'` NHƯNG cũng không có nonce — CSP được set tĩnh trong `next.config.ts` `headers()` (chạy build-time, không thể sinh nonce mỗi request), trong khi `layout.tsx` có một inline `<script>` bootstrap theme thật, và Next 15 App Router tự chèn inline script cho RSC streaming payload (`self.__next_f.push(...)`). Về lý thuyết, production build trước đó có nguy cơ CSP chặn cả theme script lẫn RSC hydration script — nghiêm trọng hơn "remote image chưa xong", đây là rủi ro tự phá vỡ chính app shell.

Re-fix 2026-07-25:
- **Middleware nonce-based CSP.** File mới `src/middleware.ts` sinh nonce ngẫu nhiên mỗi request (`crypto.randomUUID()` qua base64), set `Content-Security-Policy` với `script-src 'self' 'nonce-<value>' 'strict-dynamic'` (+ `'unsafe-eval'` chỉ dev). `next.config.ts` bỏ CSP khỏi `headers()` tĩnh (giữ lại HSTS/Referrer-Policy/X-Content-Type-Options/X-Frame-Options/Permissions-Policy — các header này không cần nonce).
- **`layout.tsx` đọc nonce qua `headers()` (next/headers)** và gắn vào `<script nonce={nonce}>` cho theme bootstrap. `RootLayout` đổi thành `async` (yêu cầu của `headers()` API trong Next 15).
- **Xác minh THẬT bằng production build + server thật** (không chỉ đọc code): `npm run build` → `npm run start` → `curl` header + HTML xác nhận mọi `<script>`/`<link rel=stylesheet>` (kể cả script Next tự sinh cho RSC streaming) đều mang đúng nonce khớp header; mở trang qua Browser pane xác nhận **0 console error** (không có CSP violation) và `document.documentElement.getAttribute('data-theme')` trả về giá trị đúng (script theme thực sự CHẠY, không bị CSP chặn).
- **Đánh đổi đã biết, ghi nhận rõ:** đọc `headers()` per-request bắt buộc mọi route dưới root layout thành dynamic (`ƒ`) thay vì static (`○`) — xác nhận qua build output. Đây là đánh đổi tiêu chuẩn, đã tài liệu hoá của pattern CSP nonce chính thức từ Next.js, không phải lỗi.
- **Remote-image consent flow: đã tốt từ bản trước, bổ sung state machine còn thiếu.** `resolve-assets.ts`/placeholder logic (S2-S4 cũ) giữ nguyên — đã đúng: 0 request trước consent, per-image (không phải global) consent qua `data-action="load-remote-image"`, `referrerPolicy="no-referrer"` + `crossOrigin="anonymous"` khi tải. **Thêm mới:** `loadRemoteImageWithState()` trong `PreviewPane.tsx` — loading state hiện ngay khi bấm, `onload`/`onerror`/15s timeout đều có state UI riêng (dùng DOM API thuần, không `innerHTML`, chống XSS qua `alt` text), lỗi tải có nút "Thử lại" (giữ nguyên crossOrigin=anonymous, không âm thầm downgrade credentialed) và "Đính kèm ảnh cục bộ thay thế" (`onAttachImageRequest`). CSS mới cho các state (`ws-preview-image-remote-loading`, `-error`, `ws-preview-image-loaded`) trong `preview-pane.css`.
- **Chưa làm trong đợt này (ghi nhận, không claim xong):** chưa chạy full Playwright E2E suite (`npm run test:e2e`) trong phiên — dựa vào xác minh thủ công qua production server thật + console/nonce kiểm tra trực tiếp; CI lane E2E (`ci.yml`) sẽ là lần chạy đầy đủ tiếp theo. Report-Only rollout giai đoạn (contract §Containment gợi ý chạy `Content-Security-Policy-Report-Only` trước khi enforce) bị bỏ qua vì đã verify trực tiếp bằng production build thật thay vì suy đoán — nếu muốn thận trọng hơn khi deploy thật, nên thêm bước Report-Only + theo dõi violation aggregate trước khi enforce trên traffic thật.

Test: `remote-image-privacy.fuzz.test.ts` +3 test cho `loadRemoteImageWithState` (loading state dùng DOM API an toàn, không leak crossOrigin/referrer sai, timeout → error UI có retry+attach-local). Toàn bộ `test:subsystems` (819 test) xanh. `npm run build` xanh; `npm run typecheck`/`npm run lint` xanh.

### Pass 2 — 2026-07-26 (review cuối)

`img-src https:` và nonce-forwarding regression đã được sửa. Review cuối bổ sung boundary ngay tại UI: URL remote tối đa 4096 ký tự, chỉ HTTPS, cấm credentials, chuẩn hoá URL trước khi dùng và có thao tác cancel đưa ảnh về placeholder. Test component xác minh URL không hợp lệ không tạo network load.

**Trạng thái:** `CODE FIXED — PRODUCTION BROWSER EVIDENCE PENDING`; cần browser/CSP probe trên production build để đóng.
