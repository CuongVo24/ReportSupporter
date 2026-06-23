# 🔒 SECURITY & PRIVACY — ReportSupporter (V1.0)

> **AI RULE:** File này là **single source of truth** cho security & privacy posture của ReportSupporter.
> Mọi quyết định về sanitize HTML, ranh giới `dangerouslySetInnerHTML`, và phân loại dữ liệu draft phải bám file này.
> Đổi posture → cập nhật file này trước, rồi mới đụng code (Golden Rule "Single Source of Truth", `Design/VibeCode.md`).

ReportSupporter là **client-first, no-login, no-cloud** workspace (`ProductPRD.md` §6 Non-goals). Vì gần như không có server và không có tài khoản, **bề mặt tấn công truyền thống (authn/authz, SQLi, SSRF server) gần như bằng 0**. Nhưng đúng vì app render **Markdown do người dùng nhập** thành HTML trong chính DOM của họ, rủi ro số 1 là **stored XSS qua nội dung báo cáo**. File này khoá cách phòng thủ.

---

## 0. THREAT MODEL (mối đe doạ thực tế)

| # | Mối đe doạ | Vector | Mức | Trong scope? |
| :-- | :-- | :-- | :-- | :-- |
| T1 | Stored XSS qua Markdown | User gõ/paste raw HTML `<script>`, `<img onerror>`, `<iframe>` → preview / HTML export thực thi JS | Cao | ✅ |
| T2 | XSS qua URI scheme | `[x](javascript:…)`, `<a href="vbscript:…">`, `data:text/html` | Cao | ✅ |
| T3 | XSS khi mở `report.html` đã export | File self-contained chứa script độc | Trung bình | ✅ |
| T4 | Lộ dữ liệu cá nhân trong draft | metadata (tên thành viên, trường, lớp, GV) + nội dung + ảnh lưu IndexedDB | Trung bình | ✅ (privacy) |
| T5 | Supply-chain | dependency pipeline bị tamper | Trung bình | ✅ (cross-ref pinning) |
| — | AuthN/AuthZ, server injection, CSRF | không có server / login / cookie | — | ❌ N/A (Non-goals) |
| — | Network / link-liveness trong Checker | Checker offline tuyệt đối (`3.Check.md`) | — | ❌ đã cấm |

---

## 1. MARKDOWN → HTML SANITIZATION (phòng thủ chính)

> Quyết định khoá cứng: thêm **`rehype-sanitize`** vào pipeline (`TechnicalStack.md` §3, install **W2**). Đây là thay đổi stack có chủ đích — pin exact theo §8d.

### 1.1 Vị trí trong pipeline (bắt buộc)

```text
remark-parse (+gfm +math)
  → remark-rehype            (KHÔNG bật allowDangerousHtml, KHÔNG dùng rehype-raw)
  → rehype-sanitize          (schema mở rộng — §1.3)
  → rehype-katex             (chạy SAU sanitize → markup KaTeX là trusted)
  → rehype-highlight         (chạy SAU sanitize → span highlight là trusted)
  → rehype-stringify
```

### 1.2 Raw HTML bị bỏ mặc định

- `remark-rehype` **mặc định bỏ raw HTML** trong Markdown. MVP **không** bật `allowDangerousHtml` và **không** cài `rehype-raw`. Hệ quả: `<script>` / `<iframe>` người dùng gõ bị loại ngay ở bước `remark-rehype`, trước cả sanitize.
- Nếu sau này cần cho phép một tập HTML nhỏ (vd `<sub>`/`<sup>`), PHẢI qua Contract: bật `rehype-raw` + thắt schema sanitize. **Không bao giờ** bật `allowDangerousHtml` trần.

### 1.3 Sanitize schema (mở rộng từ default GitHub schema)

`rehype-sanitize` mặc định dùng schema kiểu GitHub (an toàn). Mở rộng **tối thiểu** để pipeline không vỡ:

- Giữ class `math`, `math-inline`, `math-display` trên `span`/`div` → để `rehype-katex` tìm & render. *(Mất class này = math không hiện — lý do **correctness**, không phải bảo mật.)*
- Giữ class `language-*` trên `code`/`pre` → để `rehype-highlight` hoạt động.
- **Ảnh:** cho phép `data:` URI cho `img[src]` (ảnh base64 offline-safe theo `CanonicalTypes.md` `ReportAsset.data`). `asset:<id>` được resolve → `data:` URL ở bước dựng preview (`1.Write.md` §5.3) **trước** sanitize.
- **Link:** `a[href]` chỉ cho `http`, `https`, `mailto`. **Chặn** `javascript:`, `vbscript:`, và `data:` cho link.
- **Không** cho `style` attribute tuỳ ý (tránh CSS injection) — layout do token `--rs-report-*` lo (`DesignSystem_Tokens.md`).

### 1.4 Bất biến

- Cùng input → cùng output sanitize (deterministic, không phụ thuộc thời gian/mạng) → khớp triết lý determinism của Format/Export.
- Sanitize chạy trong cùng Web Worker với pipeline (`OptimizePerformance.md` §2) — không block main thread.

---

## 2. RANH GIỚI `dangerouslySetInnerHTML`

- Chỉ **một** chỗ được phép inject HTML vào DOM: **preview pane**, và **chỉ** với chuỗi HTML đã qua `rehype-sanitize` ở §1.
- Cấm `dangerouslySetInnerHTML` / gán `innerHTML` ở mọi component khác với dữ liệu chưa sanitize.
- Review gate: PR có `dangerouslySetInnerHTML` mà nguồn **không** phải output pipeline sanitize → reject.

> W1 hiện **chưa** có injection nào — preview là raw Markdown text (`src/app/page.tsx`). Pipeline thật + ranh giới này bắt đầu **W2**; vì vậy chốt security trước W2 là đúng thời điểm.

---

## 3. DỮ LIỆU & PRIVACY (IndexedDB)

- **Phân loại:** draft chứa dữ liệu cá nhân nhẹ (tên thành viên / trường / lớp / GV trong `metadata`) + nội dung báo cáo + ảnh base64. Coi là **personal, local-only**.
- **Lưu trú:** chỉ IndexedDB trên máy người dùng (`idb`). **Không** gửi đi đâu — no cloud, no telemetry, no analytics call (khớp Non-goals).
- **Đọc lại an toàn:** mọi dữ liệu từ IndexedDB qua `storedBundleSchema.parse()` (`1.Write.md` §3.4) — `unknown` + zod, không tin dữ liệu thô (chống shape poisoning).
- **Quyền kiểm soát:** cần đường "xoá dữ liệu" (xoá project / clear store) để người dùng tự dọn dữ liệu cá nhân. Soft-delete theo `Rule.md` §6 cho draft đang dùng; hard clear khi người dùng chủ động yêu cầu.
- **Không secret ở client:** không nhúng API key/secret vào bundle (MVP không có dịch vụ ngoài; AI Phase 3 nếu có phải qua route server, không lộ key client — `Deployment.md` §3).

---

## 4. EXPORT SURFACE

- `report.html` self-contained: body đã sanitize ở §1 → file export không mang script độc.
- Ảnh nhúng `data:` (base64) — an toàn cho `img`.
- DOCX (`docx` lib) sinh từ mdast, **không** nhúng HTML thô → không mang vector script.
- Không upload / không email (no cloud Non-goal) — file chỉ tải về máy.

---

## 5. SUPPLY CHAIN

- Pin **exact** mọi runtime dep (`TechnicalStack.md` §8d), commit lockfile, cài bằng `npm ci`.
- Không auto-bump bot ở MVP; nâng version pipeline đi qua Contract + chạy lại evidence export.
- (Light) cân nhắc `npm audit` mức cảnh báo trong CI (`TestStrategy.md` §6) — không chặn cứng MVP.

---

## 6. OUT OF SCOPE (theo Non-goals)

- Không authn/authz (no login). Không session/cookie → không CSRF.
- Không server data store → không SQLi/NoSQLi.
- Không kiểm link sống / không network trong Checker (`3.Check.md`).
- Không chống abuse hạ tầng (MVP không có state public phía server).

---

## 7. QC CHECKLIST

| Test scenario | Expected |
| :-- | :-- |
| Paste `<script>alert(1)</script>` vào Markdown | Không thực thi; bị loại ở remark-rehype/sanitize |
| `<img src=x onerror=alert(1)>` | Bị loại; preview không chạy JS |
| `[x](javascript:alert(1))` | href bị strip/neutralize; click không chạy JS |
| Math `$$…$$` sau sanitize | KaTeX vẫn render (class `math-*` được giữ) |
| Code block ` ```ts ` | highlight vẫn chạy (class `language-*` được giữ) |
| Ảnh `asset:<id>` | resolve → `data:` URL, hiển thị; không bị sanitize xoá |
| Export `report.html` rồi mở lại | Không có script lạ; render đúng |
| Đọc bundle hỏng từ IndexedDB | `storedBundleSchema.parse()` ném lỗi rõ, không nuốt |

---

## 8. CROSS-REFERENCES

- `Design/Modules/Other/TechnicalStack.md` — §3 pipeline (`rehype-sanitize`), §8c install (W2), §8d pinning.
- `Design/Modules/1.Write.md` — §5.2/§5.3 preview & asset resolve; §3.4 `storedBundleSchema`.
- `Design/Modules/4.Export.md` — HTML self-contained dùng output đã sanitize.
- `Design/Modules/Other/OptimizePerformance.md` — §2 sanitize chạy trong worker.
- `Design/Modules/Other/Deployment.md` — không secret ở client; env ở server route.
- `Design/Conventions/Rule.md` — §6 soft-delete posture & boundaries.
- `Design/Conventions/Coding & Git Standard.md` — §6c error handling (zod ở I/O).
