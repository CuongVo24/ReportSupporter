# Contract For AI — W13 Fix: Toast Error Tự Tắt, Gallery Chưa Gate Prod, Toast A11y & Evidence Overstated

> **Lane:** Core / break_task / week13_break.
> **Branch:** `feature/W13-ui-foundation` (hoặc `fix/w13-ui-foundation`).
> **Type:** Correctness + a11y + evidence-fidelity — findings **S1** (High, Toast `error` vẫn auto-dismiss → vi phạm Locked C140), **S2** (Med-High, gallery không thật sự gate khỏi production trái w13d "dev-only, gated"), **S3** (High, `W13_QA_Report.md` claim "zero px" sai sự thật — overstated evidence), **S4** (Medium, Toast a11y: mọi toast announce assertive + stack ≤3 chưa enforce/chứng minh) — review nhánh W13 (session 2026-06-25).
> **Builds on:** Group C (`src/components/ui/Toast.tsx`), Group D (`src/app/(dev)/ui-gallery/page.tsx`), Group E (`Design/Reports/Month4/W13/W13_QA_Report.md`).
> **Sources:** Review nhánh W13 (2026-06-25); `month4/W13/w13c` (Locked C140/C141), `w13d` (dev-only gated), `w13e` (DoD/evidence); `Frontend/2.Components/Toast.md §3`; `Frontend/Other/Accessibility.md`; `break_task/week12_break/w12_fix_*` (overstated-evidence pattern); Radix `@radix-ui/react-toast@1.2.6`.

---

## 1. Micro-task Target

Sửa các điểm **sai/đáng tin** của W13 — không đổi shape/public surface: (a) Toast `error` thực tế **vẫn tự tắt** vì truyền `duration={undefined}` (Radix rơi về default Provider 5000ms) thay vì `Infinity`; (b) gallery đặt trong route group `(dev)` **không** ẩn route nên `/ui-gallery` vẫn truy cập được ở production; (c) QA report khẳng định "zero px" trong khi có 52 px ngữ nghĩa; (d) toast announce sai mức (mọi toast assertive) + stack ≤3 chưa enforce/chứng minh. Mục tiêu: error toast **bền**, gallery **thật sự dev-only**, evidence **trung thực**, a11y toast đúng — **không** đổi happy-path, **không** đổi `ui/index.ts` / props public.

- **S1 — Toast `error` vẫn auto-dismiss (vi phạm Locked C140 "error không tự tắt").** [Toast.tsx:35](src/components/ui/Toast.tsx) đặt `defaultDuration = variant === "error" ? Infinity : 4000`, nhưng [Toast.tsx:53](src/components/ui/Toast.tsx) truyền `duration={toastDuration === Infinity ? undefined : toastDuration}`. Trong Radix Toast, `duration={undefined}` **không** = vô hạn — Root **kế thừa `duration` của `ToastProvider`** (mặc định **5000ms**). Hệ quả: error toast **tự tắt ~5s**, mất thông tin lỗi — đúng điều `w13c` Locked + `Toast.md §3` cấm. Gallery chỉ bật 1 toast/lần nên lỗi **không lộ bằng mắt**. **Fix:** truyền thẳng `duration={toastDuration}` (để `Infinity` xuống Radix — Radix chấp nhận `Infinity` để vô hiệu auto-dismiss); bỏ map `Infinity → undefined`.

- **S2 — Gallery không thật sự gate khỏi production (`(dev)` chỉ là route group).** [src/app/(dev)/ui-gallery/page.tsx](src/app/(dev)/ui-gallery/page.tsx) nằm trong group `(dev)`, nhưng Next.js App Router coi `(folder)` **chỉ là tổ chức cây thư mục — không đổi URL, không loại khỏi bundle** → route `/ui-gallery` **vẫn build & truy cập công khai ở production**. Đã kiểm: `(dev)` chỉ chứa đúng `ui-gallery/page.tsx`, **không** `(dev)/layout.tsx` guard, không `NODE_ENV` check, không `middleware`. w13d Scope ghi "Dev-only, **gated**" + checklist "không lộ `/` / nav production". Hiện chỉ thoả "không ở `/`, không trong nav", **chưa** thoả "gated" (vẫn vào được ở prod). **Fix:** thêm `src/app/(dev)/layout.tsx` (server component) `if (process.env.NODE_ENV === "production") notFound();` rồi render `children` (hoặc cờ `NEXT_PUBLIC_ENABLE_DEV_GALLERY`).

- **S3 — QA report khẳng định "zero px" trái sự thật (overstated evidence).** [W13_QA_Report.md §2](Design/Reports/Month4/W13/W13_QA_Report.md) ghi "Verified zero hardcoded hex colors **or direct px values**". Thực tế `grep "[0-9]px" src/components/ui/*.css` = **52 lần / 8 file**, gồm px ngữ nghĩa **đáng tokenize**: control height `36px`/`28px` ([Button.css:84,91](src/components/ui/Button.css); Input/Select/Tabs tương tự), dialog `max-width: 520px/400px/460px` ([Dialog.css:30,42,54](src/components/ui/Dialog.css)), toast `width: 380px` ([Toast.css:11](src/components/ui/Toast.css)), count-badge `font-size: 10px` ([Tabs.css:121](src/components/ui/Tabs.css)). (Hex **đúng** = 0 — phần đó chính xác.) Đúng dạng "overstated evidence" mà `week12_break/w12_fix_*` đã chốt phải tránh. **Fix (chọn 1, nhất quán):** **(A)** tokenize px ngữ nghĩa — thêm `--rs-control-height-{md,sm}`, `--rs-overlay-width-{sm,md,lg}` vào `DesignSystem_Tokens.md` **trước** rồi thay, dùng `--rs-font-size-*` cho count badge (giữ `1px` border / `2px` outline-offset là hairline được phép); **hoặc (B)** sửa claim report cho trung thực: "0 hardcoded hex; px **chỉ** dùng cho border-width/outline-offset/kích thước control, không cho màu/spacing token-hoá" + liệt kê phạm vi px còn lại. Khuyến nghị (A) cho control-height + count font, (B) khai báo phần border/offset.

- **S4 — Toast a11y: mọi toast announce assertive; stack ≤3 chưa enforce/chứng minh.** (a) [Toast.tsx:54](src/components/ui/Toast.tsx) đặt `type="foreground"` cho **mọi** variant; trong Radix Toast `type` điều khiển mức announce của vùng live (foreground = ngắt/assertive, background = polite) — **không phải** `role` thủ công ở [Toast.tsx:55](src/components/ui/Toast.tsx). Hệ quả: success/info cũng announce **assertive**, trong khi `w13c` muốn error `assertive`, còn lại `status`/polite. **Fix:** `type={variant === "error" ? "foreground" : "background"}`. (b) `w13c`/C141 "stack ≤3" **không** enforce ở Toast/Provider và gallery chỉ render 1 toast → **chưa có evidence** stacking. **Fix:** enforce giới hạn ở tầng quản lý toast (nếu thuộc tuần này) **hoặc** khai báo rõ trong w13c + report "stack-limit là việc Provider/W14, primitive không tự giới hạn".

> 🔒 **Không đổi happy-path / public surface (W13 Locked #2/#3).** S1/S4 chỉ sửa prop truyền xuống Radix (duration/type), không đổi `ToastProps`; S2 chỉ thêm route guard, không đụng `ui/`; không đổi shape primitive / CanonicalTypes / `ui/index.ts`.
> 🔒 **Token-only (Locked #1).** Token mới phải bổ sung `DesignSystem_Tokens.md` trước khi dùng; cấm hex mới; px chỉ còn ở border-width/outline-offset (khai báo rõ).
> 🔒 **Giữ a11y Radix.** S4 chỉ chỉnh `type`; không override focus-trap/keyboard/announce của Radix.
> 🔒 **Evidence trung thực (w12_fix_* pattern).** Sau fix, `W13_QA_Report.md` khớp đúng code thật — không claim "zero px" nếu còn px; cập nhật coverage stack/announce nếu khai báo baseline.

## 2. Scope

### In scope
- **S1/S4** [src/components/ui/Toast.tsx](src/components/ui/Toast.tsx) (MODIFY): `duration={toastDuration}` (Infinity xuống Radix); `type` theo variant; khai báo/enforce stack-limit.
- **S2** `src/app/(dev)/layout.tsx` (**NEW**): server component guard `notFound()` ở production.
- **S3** `Design/Modules/Other/DesignSystem_Tokens.md` (MODIFY nếu chọn A) + `src/components/ui/*.css` (MODIFY): px ngữ nghĩa → token. **Và/hoặc** [W13_QA_Report.md](Design/Reports/Month4/W13/W13_QA_Report.md) (MODIFY): claim trung thực + coverage announce/stack.

### Out of scope
- ❌ Mount ToastProvider/Dialog vào layout/panel thật (→ **W14** C146).
- ❌ Tabs count reuse `Badge`, Dialog Esc, field error icon, gallery inline-style (→ contract **w13_polish_***).
- ❌ Thêm primitive/feature; đổi shape primitive / CanonicalTypes / `ui/index.ts`; full axe (→ **W15**).

## 3. Checklist
- [ ] **S1** error toast **không** auto-dismiss (mở error, chờ >5s vẫn còn); success/info tắt 4s.
- [ ] **S2** build `NODE_ENV=production` → `/ui-gallery` trả 404; dev vẫn vào; `/` vẫn workspace.
- [ ] **S3** px ngữ nghĩa đã tokenize (token thêm vào `DesignSystem_Tokens.md` trước) **hoặc** report sửa claim + liệt kê px còn lại; không còn câu "zero px" nếu còn px.
- [ ] **S4** error announce assertive, success/info polite (`type` theo variant); stack ≤3 enforce **hoặc** khai báo baseline Provider/W14.
- [ ] 4 gate (lint/typecheck/test/build) xanh; `build_output.txt` cập nhật thật.

## 4. Expected Interfaces / Files

> Happy-path + public surface giữ nguyên. Chỉ sửa prop nội bộ, thêm route guard, tokenize px, đồng bộ evidence.

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/ui/Toast.tsx` | MODIFY | S1 duration=Infinity; S4 type theo variant |
| `src/app/(dev)/layout.tsx` | NEW | S2 guard `notFound()` ở production |
| `Design/Modules/Other/DesignSystem_Tokens.md` | MODIFY (S3-A) | token control-height/overlay-width/count |
| `src/components/ui/{Button,Input,Select,Tabs,Dialog,Toast}.css` | MODIFY (S3-A) | px ngữ nghĩa → token |
| `Design/Reports/Month4/W13/W13_QA_Report.md` | MODIFY | S3/S4 claim trung thực + coverage |

> **Import boundary:** không lib mới; `(dev)/layout.tsx` dùng `next/navigation` `notFound`. Offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Sửa duration làm success/info cũng không tắt | Medium | Chỉ error = `Infinity`; giữ 4000ms cho success/info; test cả hai. |
| Guard `(dev)` chặn nhầm dev | Low | Chỉ `notFound()` khi `NODE_ENV==="production"`; verify dev vẫn vào. |
| Tokenize px lỡ đổi kích thước hiển thị | Medium | Token = đúng px cũ; so screenshot trước/sau. |
| Report vẫn lệch sau fix | Medium | Re-grep px/hex + cập nhật report khớp code (DoD trung thực). |

## 6. Verification Plan
- Gallery (dev): error toast còn sau >5s; success/info tắt 4s; nhiều toast → quan sát stack hoặc xác nhận baseline.
- `next build` (`NODE_ENV=production`) → `/ui-gallery` = 404; `/` workspace.
- `grep -n "[0-9]px" src/components/ui/*.css` → chỉ còn border-width/outline-offset (hoặc rỗng); report khớp.
- 4 gate xanh; `build_output.txt` mới; screenshots cập nhật nếu kích thước đổi.

## 7. Status

`OPEN — chờ Approve (VibeCode Step 2: chưa chạm src/ tới khi duyệt).`

> Ưu tiên **S1 → S2 → S3 → S4** trước khi chốt W13. Đề xuất commit: `fix(ui): toast error stays (duration=Infinity)`; `fix(ui): gate dev gallery out of production`; `refactor(ui): tokenize control/overlay px`; `fix(ui): toast announce by variant`; `docs(reports): correct W13 QA claims`.
