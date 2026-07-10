# Contract For AI — W21 Fix (D): Toggle Dark Mode Toàn Cục (Gỡ Hardcode · Persist · Chống FOUC · Tôn Trọng OS)

> **Lane:** Core / break_task / week21_break.
> **Branch:** `feature/W25-ui-redesign` (nhánh chung cả tuần).
> **Type:** Feature nhỏ + kích hoạt token dark sẵn có. **Chạy sau C** để dark ra mắt không lộ editor chói.
> **Findings:**
> - **S1** (🟠) — **`data-theme` khoá cứng "light".** `layout.tsx` render `<html lang="vi" data-theme="light" …>` cố định ([layout.tsx:27](src/app/layout.tsx#L27)) ⇒ nhánh `[data-theme="dark"]` + `@media prefers-color-scheme` (đã định nghĩa đủ ở [globals.css:3344](src/app/globals.css#L3344)-L3394) **không bao giờ** kích hoạt. Dark mode chết dù token sẵn sàng.
> - **S2** (🟠) — **Không có control + không persist + không theo OS.** Người dùng không có nơi bật/tắt; không đọc `prefers-color-scheme`; không nhớ lựa chọn giữa các phiên.
> **Builds on:** `layout.tsx`, token dark ở `globals.css`, mẫu persist `localStorage` (`ocr-settings.ts`, `ai-config.ts`), theme editor đã token hoá (contract C).
> **Sources:** Redesign session 2026-07-10, "việc còn dở" #4 [[w25-ui-redesign]].

---

## 1. Micro-task Target

Bật đường tới token dark đã có sẵn: gỡ hardcode, thêm toggle 3 trạng thái (Sáng / Tối / Theo hệ thống), persist lựa chọn, áp theme **trước paint** để không nháy sáng (FOUC).

- **S1 — Gỡ hardcode + nguồn theme.** Bỏ `data-theme="light"` cứng; theme quyết định bởi: (1) lựa chọn đã lưu (`localStorage`), else (2) `prefers-color-scheme` của OS. Áp `data-theme` lên `<html>` bằng inline script chạy **trước** hydrate để chống FOUC.
- **S2 — Control + persist.** Thêm toggle theme trong topbar/app shell (icon mặt trời/mặt trăng, theo `§7` microcopy), 3 lựa chọn Light/Dark/System; lưu `localStorage` (mẫu `ocr-settings.ts`); "System" bám realtime `matchMedia('(prefers-color-scheme: dark)')`.

> 🔒 **Tờ báo cáo bất biến trắng-đen** ở mọi theme — chỉ chrome UI đổi. Đây là gate hạng nặng: rà **mọi** màn hình chính ở dark (checker/evidence/export/present/submission/health/snapshot) không "cháy trắng" hay chữ chìm.
> 🔒 Không lib theme; state React + `localStorage`. Token-only, không token "ma".

## 2. Scope

### In scope
- [src/app/layout.tsx](src/app/layout.tsx) (MODIFY): gỡ `data-theme="light"`; chèn inline script áp theme sớm (đọc `localStorage`/`matchMedia`).
- Theme toggle control (NEW): component nhỏ trong topbar/app shell (nơi Save/Export sống — `Workspace.tsx`/`WorkspaceLayout.tsx`).
- Theme store/hook (NEW): đọc/ghi `localStorage`, đăng ký `matchMedia`, set `document.documentElement.dataset.theme` (mẫu `ocr-settings.ts`).
- [src/app/globals.css](src/app/globals.css) (MODIFY nhẹ nếu cần): vá vùng dark còn chói phát hiện khi rà (theo token, không hex).

### Out of scope
- ❌ Đổi bảng token dark (đã định nghĩa; chỉ vá vùng lỗi cụ thể).
- ❌ Dark cho **tờ báo cáo/PDF** — vĩnh viễn trắng-đen (kế thừa W20-E "dark chỉ ở screen").
- ❌ Theme tuỳ biến/accent picker (backlog).

## 3. Checklist
- [x] **S1** Gỡ hardcode; theme = lưu → else OS; áp trước paint, không FOUC.
- [x] **S2** Toggle Light/Dark/System trong topbar; persist qua reload; "System" đổi realtime theo OS.
- [x] Rà dark: các màn hình chính không cháy trắng/chữ chìm; editor không chói (nhờ C); tờ báo cáo + TOC vẫn trắng-đen.
- [x] Light mode không hồi quy. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/app/layout.tsx` | MODIFY | gỡ hardcode + inline anti-FOUC script |
| `src/modules/write/use-theme.ts` | NEW | đọc/ghi localStorage + matchMedia |
| `src/components/ThemeToggle.tsx` | NEW | control Light/Dark/System trong topbar |
| `src/components/Workspace.tsx` | MODIFY | gắn toggle |
| `src/app/globals.css` | MODIFY nhẹ | vá vùng dark chói (token-only) |

> **Import boundary:** không lib mới.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| FOUC nháy sáng khi tải dark | Med | Inline script set `data-theme` trước paint (trước body/hydrate). |
| Hydration mismatch (server ≠ client theme) | Med | Set qua script client-side + `suppressHydrationWarning` trên `<html>`; state đọc sau mount. |
| Màn hình dark lần đầu lộ vùng chói/chìm | Med | Gate rà toàn bộ màn hình chính; vá theo token. |
| Tờ báo cáo bị nhuộm tối | High→mitigated | `--rs-report-*` cứng trắng-đen; verify preview+PDF ở dark. |

## 6. Verification Plan
- Toggle Light↔Dark↔System: UI đổi ngay, chọn "System" đổi theo OS realtime (`matchMedia`).
- Reload: theme được nhớ; không thấy nháy sáng lúc tải (dark bền qua reload).
- Đi qua các màn hình chính ở dark: khởi tạo, editor (không chói), checker, evidence, export, submission, present, health, snapshot — không vùng cháy trắng/chữ chìm.
- Preview + xuất PDF ở dark: tờ báo cáo + TOC vẫn đen-trên-trắng. 4 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `feat(ui): align screen table of contents with print art direction`; `docs(w21): close w21 toc print contract`.
