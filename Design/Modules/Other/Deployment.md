# 🚢 DEPLOYMENT & BUILD — ReportSupporter (V1.0)

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

- **MVP không cần biến môi trường bắt buộc** (no API key, no DB URL, no secret).
- Nếu Phase 3 (AI) thêm dịch vụ ngoài, key đặt ở **server route env** (`.env.local`, không commit) — **không bao giờ** ở client bundle (`Security.md` §3).
- Không có "environment matrix" phức tạp: chỉ `dev` (local) và `production` (build host).

---

## 4. HOSTING (public demo — W12)

- W12 cần "public demo + README evidence" (`MasterRoadMap.md`). Host bằng bất kỳ nền tảng chạy Next.js: Vercel (zero-config, khớp Next) hoặc Node host tương đương.
- Dữ liệu người dùng **không** rời máy họ (IndexedDB local) — host chỉ phục vụ static assets + app shell.
- Không cần DB / storage provider / object storage.

---

## 5. RELEASE & ROLLBACK

- **Release** = deploy một build đã qua DoD (lint / typecheck / build / test xanh — `WorkFlow.md`).
- **Rollback** = redeploy build trước đó. Không có migration DB → rollback **không** mất dữ liệu (dữ liệu nằm ở client; schema migration là `ReportProjectBundle.schemaVersion` phía client, độc lập với release).
- Mỗi release nên ghi evidence vào `Design/Reports/Month<X>/W<N>/` (build log, export mẫu).

---

## 6. WHAT'S NOT DEPLOYED (Non-goals)

- Không backend DB, không auth server, không cloud storage, không cron/queue.
- Không CDN cấu hình đặc biệt ngoài mặc định của host.
- Puppeteer service (nếu có sau) là **service/worker riêng, behind feature flag**, deploy tách — **không** bật trong MVP.

---

## 7. CROSS-REFERENCES

- `Design/Modules/Other/TechnicalStack.md` — runtime posture, install matrix, Puppeteer later.
- `Design/Modules/4.Export.md` — §5.3 PDF routes (browser print vs Puppeteer).
- `Design/Modules/Other/Security.md` — không secret ở client; env ở server route.
- `Design/RoadMap/MasterRoadMap.md` — W12 public demo.
- `Design/Conventions/WorkFlow.md` — DoD gate trước release.
