# Contract For AI — W25 Fix (A): Vá Sạch Dependency Prod Mà Không Downgrade Next

> **Lane:** Core / break_task / week25_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Dependency security / compatibility — **P0 release gate**.
> **Findings:**
> - **S1** (🔴) — `npm audit --omit=dev` ngày 2026-07-22 báo **13 affected nodes** (1 critical, 8 high, 2 moderate, 2 low). Root advisory families cần xử lý: `tar`, `sharp`, `brace-expansion`, `dompurify`.
> - **S2** (🔴) — `package.json` pin `overrides.tar: 7.5.16`, trong khi critical DoS áp tới `<=7.5.18`; đường thật là `pdfjs-dist -> canvas -> @mapbox/node-pre-gyp -> tar`.
> - **S3** (🟠) — Next 15.5.19 kéo `sharp 0.34.5`; advisory libvips áp `<0.35.0`. Audit không có fix tự động và có thể gợi ý downgrade Next sai mục tiêu.
> - **S4** (🟠/🟡) — `brace-expansion 1.1.15` cần nhánh fix `1.1.16`; Mermaid kéo DOMPurify `3.4.11`, fix tối thiểu `3.4.12`. Mermaid đã `securityLevel: strict`, nhưng mitigation không thay bản vá.
> **Builds on:** root `package.json`/`package-lock.json`, Next image optimizer, PDF.js import, Mermaid rendering.
> **Sources:** audit 2026-07-22 + lockfile/source verification.

---

## 1. Micro-task Target

Regenerate cây dependency prod để **không còn các advisory families đã biết**, giữ Next 15.5.x/React 19, và chứng minh native/image/PDF/Mermaid paths vẫn hoạt động. Không chấp nhận “audit xanh” bằng downgrade framework hoặc bỏ package chức năng.

- **S1 — Pin leaf đã vá.** `tar >=7.5.19`; `sharp >=0.35.0` (chọn patch ổn định đã kiểm với Next); `brace-expansion 1.1.16` cho nhánh 1.x; DOMPurify `>=3.4.12` qua range/override phù hợp.
- **S2 — Lockfile clean install.** Chỉnh `package.json`, regenerate lock bằng npm version CI, chạy `npm ci`, `npm explain` cho từng leaf và lưu cây resolved vào evidence.
- **S3 — Compatibility proof.** Build production, PDF.js import, Mermaid render strict, Next image route/smoke và postinstall assets phải xanh trên Linux CI — đặc biệt `sharp` native binary/libvips.
- **S4 — Override lifecycle.** Mỗi override ghi advisory, lý do, owner, ngày review và exit criterion; bỏ override khi upstream parent range nhận bản fix.

> 🔒 Không `npm audit fix --force`, không downgrade Next 14, không bỏ lockfile và không coi “không import `next/image`” là lý do giữ native package lỗi.

## 2. Scope

### In scope
- `package.json`, `package-lock.json` (MODIFY): leaf overrides/resolutions đã vá.
- Unit/build/E2E smoke liên quan PDF.js, Mermaid, Next image optimizer (UPDATE/NEW tối thiểu).
- Dependency evidence script/report (NEW/UPDATE): `npm audit --omit=dev`, `npm explain`, exact resolved versions.

### Out of scope
- ❌ Container/Chrome CVE của PDF renderer (F/L).
- ❌ Nâng major Next/React hoặc refactor feature.
- ❌ Bỏ `pdfjs-dist`, Mermaid hay image optimization để né audit.

## 3. Checklist

- [x] Lockfile resolve `tar >=7.5.19`, `sharp >=0.35.0`, `brace-expansion 1.1.16`, DOMPurify `>=3.4.12` ở mọi prod path liên quan.
- [x] `npm ci` sạch trên Linux và Windows; postinstall assets đúng.
- [x] `npm audit --omit=dev` trên clean install báo **0 known production vulnerabilities** tại thời điểm chốt release; tối thiểu không còn advisory families S1–S4 và không suppress/waive các finding hiện tại.
- [x] `npm run build`, unit, E2E smoke PDF.js/Mermaid/image đều xanh.
- [x] Không downgrade Next/React; override có exit criterion.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `package.json` | MODIFY | overrides exact, Next 15.5.21 / eslint-config-next 15.5.21 |
| `package-lock.json` | MODIFY | resolved/integrity mới |
| `src/lib/mermaid*.test.ts` hoặc test hiện hữu | UPDATE | strict render + sanitized output |
| `src/modules/import/*.test.ts` | UPDATE | PDF.js smoke |
| `.github/workflows/ci.yml` | UPDATE qua L | clean-install/audit evidence |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Sharp 0.35 không tương thích optional peer/range của Next | High | Test clean Linux build + image endpoint; nếu incompatible, nâng patch Next hỗ trợ thay vì downgrade framework. |
| Override global ép package không tương thích | High | Dùng scoped/nested override khi cần; inspect `npm explain`; smoke đúng consumer path. |
| Audit count thay đổi theo advisory DB | Med | Gate theo advisory/package+fixed range và lưu timestamp/audit JSON, không hard-code duy nhất tổng số. |
| Native binary khác platform | Med | Matrix Windows/Linux; cache không được che clean install. |

## 6. Verification Plan

- Xóa môi trường cài đặt trong CI, `npm ci`, lưu `npm ls tar sharp brace-expansion dompurify` và audit JSON.
- Production build/start; gọi image optimizer với ảnh fixture; import PDF; render Mermaid có payload XSS corpus và xác nhận strict/sanitize.
- So sánh bundle/API behavior trước-sau; không có downgrade framework hay regression PWA.

## 7. Status

`DONE (2026-07-24):`
- Đã nâng `next` và `eslint-config-next` lên `15.5.21` (vá các CVE DoS/SSRF/Cache confusion của Next.js và PostCSS).
- Đã cấu hình `overrides` trong `package.json` vá sạch các thư viện prod: `tar 7.5.19`, `sharp 0.35.0`, `brace-expansion 1.1.16`, `dompurify 3.4.12`, `postcss ^8.5.12`.
- `npm audit --omit=dev` báo **0 vulnerabilities** đối với production dependencies.
- `npm run build` và toàn bộ test suite/typecheck/lint đều thông qua 100%.
