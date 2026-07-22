# 🚢 DEPLOYMENT & BUILD — ReportSupporter (V1.0)

## W27–W36 production topology

- Next.js serves the PWA and Serwist `/sw.js` over HTTPS. APIs are online-only.
- PDF renderer is `services/pdf-renderer`/`docker-compose.pdf.yml` behind `PDF_RENDERER_URL` + `PDF_RENDERER_TOKEN`; its failure is explicit and Print Preview remains available.
- Production requires `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` and a reviewed `TRUSTED_PROXY_MODE`.
- Rollout flags: `NEXT_PUBLIC_FF_PROJECT_MIGRATION_DUAL_READ`, `NEXT_PUBLIC_FF_PDF_SUBMISSION`, `NEXT_PUBLIC_FF_PIPELINE_WORKER`, `NEXT_PUBLIC_FF_SMART_IMPORT_AI`, `NEXT_PUBLIC_FF_TEMPLATE_CATALOG`, `NEXT_PUBLIC_FF_PWA`. `false` disables a surface without deleting data.
- Rollout order: migration dual-read → PDF/Submission → worker → Smart Import/AI → Catalog/PWA. Service-worker activation waits for autosave flush and explicit reload confirmation.
- Monitoring is aggregate errors/latency only; report bodies and API keys are not logged or persisted.

> **AI RULE:** File này là **single source of truth** cho cách **build & host** ReportSupporter.
> MVP là client-first nên deployment cố ý tối giản. Đổi cách deploy / output mode → cập nhật file này trước.

ReportSupporter chạy gần như hoàn toàn trong trình duyệt (`MasterRoadMap.md` "client-first", no backend bắt buộc). Vì vậy "deploy" ở MVP = build + host như một Next.js app thường; **không** có DB, queue, hay secret server.

---

## 1. BUILD & RUN COMMANDS

| Lệnh | Mục đích |
| :-- | :-- |
| `npm ci` | Cài đúng lockfile (deterministic — `TechnicalStack.md` §8d) |
| `npm run dev` | Dev server local (`http://localhost:3000`) |
| `npm run build` | Production build (`next build`) |
| `npm run start` | Chạy production build local để kiểm thử trước khi host |
| `npm run lint` / `typecheck` / `test` | Gate chất lượng (xem `WorkFlow.md` DoD) |

---

## 2. NEXT OUTPUT MODE (quyết định khoá)

- **Giữ Next build mặc định (Node-capable). KHÔNG khoá `output: 'export'` (static-only).**
- Lý do: con đường hardening sau dùng **Puppeteer trong Node API route** (`4.Export.md` §5.3, `TechnicalStack.md` §8c "Export hardening later"). Khoá static export thuần sẽ **chặn mất** khả năng thêm route server đó về sau.
- MVP **không** dùng tới route server nào (PDF = browser print client-side), nhưng để ngỏ build Node để không phải refactor khi bật Puppeteer.
- Nếu một bản demo cần host tĩnh tuyệt đối (vd GitHub Pages), có thể export tĩnh **tạm** vì MVP chưa có route server — nhưng đó là quyết định theo Contract, **mặc định không chọn**.

---

## 3. ENVIRONMENT

> **Cập nhật W24-H (2026-07-21):** Đoạn cũ "MVP không cần biến môi trường bắt buộc" **đã lỗi thời** và mâu thuẫn với thực tế production (rate limiter fail-closed cần Redis). Nguồn sự thật env giờ là **`.env.example`** + validator `npm run check:production-config` (fail predeploy) + readiness `/api/ready`. Xem ma trận dưới đây.

- **Dev/local:** không cần biến bắt buộc — rate limiter dùng bộ nhớ (`BoundedMemorySlidingWindow`), PDF dùng Print Preview client-side. `TRUSTED_PROXY_MODE=none` chấp nhận được ở dev.
- **Production (fail-closed, BẮT BUỘC trước khi có traffic):**

  | Biến | Bắt buộc khi | Ràng buộc | Nếu sai |
  |---|---|---|---|
  | `UPSTASH_REDIS_REST_URL` + `_TOKEN` | production | đi cặp, URL `https://` | limiter `available:false` → `/api/ai` & `/api/pdf` trả 503 cho mọi user |
  | `TRUSTED_PROXY_MODE` | production | `vercel`/`forwarded`/`cloudflare`/`x-real-ip` theo host (không `none`) | `none` ⇒ quota dùng chung bucket `direct`; mode sai host ⇒ spoof `x-forwarded-for` |
  | `PDF_RENDERER_URL` + `PDF_RENDERER_TOKEN` | khi bật PDF (URL set) | đi cặp; token **không** rỗng/không phải default local | token rỗng ⇒ renderer mở cho mọi request; thiếu ⇒ PDF 503 |
  | `PDF_MAX_CONCURRENCY` | tuỳ chọn | server clamp 1..4 (default 2) | vượt biên bị clamp |

- **Hosting matrix** cho `TRUSTED_PROXY_MODE`: Vercel → `vercel`; Cloudflare (Workers/Pages) → `cloudflare`; Node sau nginx bạn kiểm soát → `x-real-ip`; single-instance nội bộ không proxy → chỉ `none` ở môi trường không public.
- AI route `/api/ai` vẫn **client-key strategy**: người dùng nhập provider key trong UI, browser lưu cục bộ và gửi qua `x-api-key` mỗi request. Route **không** dùng biến môi trường server làm fallback (tránh biến endpoint thành proxy tiêu credit). Không đặt `GEMINI_API_KEY`/`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` server-side.
- **Ownership/rotation/rollback:** secret quản ở dashboard host (Vercel/Cloudflare env). Rotate `PDF_RENDERER_TOKEN` bằng cách set token mới ở cả renderer service và app env rồi redeploy; token cũ → renderer trả 401. Rollback = redeploy commit trước với cùng bộ env đã validate.
- Chạy `npm run check:production-config` với env của target **trước** deploy; `/api/ready` xác nhận limiter + renderer sau deploy (cause code an toàn: `config_missing`/`redis_unreachable`/`renderer_unready`, không lộ secret).

---

## 4. HOSTING (public demo — W12)

- W12 cần "public demo + README evidence" (`MasterRoadMap.md`). Host bằng bất kỳ nền tảng chạy Next.js: Vercel (zero-config, khớp Next) hoặc Node host tương đương.
- Dữ liệu người dùng **không** rời máy họ (IndexedDB local) — host chỉ phục vụ static assets + app shell.
- Không cần DB / storage provider / object storage.

---

## 5. RELEASE & ROLLBACK

- **Release** = deploy một build đã qua DoD (lint / typecheck / build / test xanh — `WorkFlow.md`).
- **Rollback** = redeploy build trước đó. Không có server DB → rollback **không** mất dữ liệu server (dữ liệu nằm ở client).
- Mỗi release nên ghi evidence vào `Design/Reports/Month<X>/W<N>/` (build log, export mẫu).

### 5.1 IndexedDB legacy draft — retire window (W24-L, 2026-07-21)

- **Thay đổi:** autosave ngừng dual-write bản `drafts/current` (legacy); source of truth là `project-bundles` + `project-summaries`. `drafts` store **vẫn tồn tại** (schema v4) và được import **một lần** khi project store thiếu (sentinel `legacy-imported:<projectId>` trong `settings`).
- **Rollback boundary (đọc kỹ):** build cũ ở chế độ **single-draft không projectId** đọc `drafts/current` qua `loadBundle()`. Sau khi release này ngừng dual-write, các edit mới **không** phản chiếu vào `drafts/current` nữa → rollback về build cũ ở chế độ đó **sẽ không thấy edit mới**. Chế độ multi-project (có projectId → `project-bundles`) **không** bị ảnh hưởng vì store đó vẫn được ghi. Không hứa tương thích hai chiều cho single-draft; nếu cần, export project trước khi rollback.
- **Exit criterion để xóa `drafts` store:** chỉ xóa ở một **release + schema bump sau** khi (a) đã qua ≥1 support window (đề xuất 1 tháng kể từ 2026-07-21, tức từ ~2026-08-21) không còn client mở bản pre-v4, và (b) matrix upgrade/rollback đã chạy. **Owner:** chủ dự án (CuongVo24). **M dùng schema version kế tiếp**, không bump cùng lúc với việc xóa `drafts` — hai migration tách release.

---

## 6. WHAT'S NOT DEPLOYED (Non-goals)

- Không backend DB, không auth server, không cloud storage, không cron/queue.
- Không CDN cấu hình đặc biệt ngoài mặc định của host.
- Puppeteer service (nếu có sau) là **service/worker riêng, behind feature flag**, deploy tách — **không** bật trong MVP.

---

## 7. CROSS-REFERENCES

- `Design/Modules/Other/TechnicalStack.md` — runtime posture, install matrix, Puppeteer later.
- `Design/Modules/4.Export.md` — §5.3 PDF routes (browser print vs Puppeteer).
- `Design/Modules/Other/Security.md` — AI client-key posture, localStorage XSS risk, proxy boundary.
- `Design/RoadMap/MasterRoadMap.md` — W12 public demo.
- `Design/Conventions/WorkFlow.md` — DoD gate trước release.
