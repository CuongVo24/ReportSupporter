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

`DONE (2026-07-25):`
- **S1 Enforced Production CSP & Security Headers**: Thắt chặt CSP trong `next.config.ts` ở môi trường production (bỏ `script-src 'unsafe-inline'` broad, thắt chặt `img-src 'self' data: blob:`, bổ sung `Strict-Transport-Security: max-age=63072000`, `base-uri 'none'`, `object-src 'none'`).
- **S2 Remote Asset Privacy Classifier**: Cập nhật `resolve-assets.ts` bổ sung `isRemoteImage`. Ảnh từ URL `http(s)` mặc định được chuyển hóa thành placeholder bảo mật `ws-preview-image-remote` với nhãn `🛡️ [Ảnh từ nguồn ngoài — Chưa tải]`, phát 0 request trước consent.
- **S3 Explicit Load Consent**: Thêm sự kiện click handler trong `PreviewPane.tsx` khi người dùng bấm "Tải ảnh này" sẽ render ảnh với `referrerPolicy="no-referrer"` và `crossOrigin="anonymous"`.
- **S4 Export Parity**: Cập nhật pipeline `prepare-export.ts` không tự động fetch ngầm ảnh remote, giữ nguyên tính riêng tư local-first.
- Bổ sung bộ kiểm thử bảo mật `src/modules/write/__security__/remote-image-privacy.fuzz.test.ts`.
