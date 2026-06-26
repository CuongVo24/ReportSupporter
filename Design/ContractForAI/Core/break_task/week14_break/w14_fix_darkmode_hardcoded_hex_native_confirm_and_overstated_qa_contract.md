# Contract For AI — W14 Fix: Dark Mode Hardcode Hex (Token-Only), Reset Dùng `confirm()` Native & QA Report Overstated

> **Lane:** Core / break_task / week14_break.
> **Branch:** `feature/W14-ui-adoption` (hoặc `fix/w14-ui-adoption`).
> **Type:** Token-fidelity + adoption-gap + evidence-fidelity — findings **S1** (Med-High, dark mode nhồi ~15 hex thẳng vào token semantic → vi phạm token-only/no-hex `w14d` Locked #5; `DesignSystem_Tokens.md` chỉ ghi 2/~17), **S2** (Medium, dark mode **không thể bật** trong app — không có setter `data-theme` / `prefers-color-scheme`; screenshot "Dark Mode" trong QA là state user không tới được — overstated), **S3** (Medium, `handleReset` dùng `confirm()` native thay `Dialog` primitive → lệch adoption w14a/w14c + lệch DoD QA), **S4** (Low-Med, `W14_QA_Report.md` overstated: claim "Strict Token-Only ✅", "Documented in DesignSystem_Tokens.md", liệt kê `EditorPanel`/`PreviewPane` như "migrated" dù không nằm trong diff W14) — review nhánh W14 (session 2026-06-26).
> **Builds on:** Group A (`src/app/layout.tsx`, `WorkspaceLayout.tsx`, `Workspace.tsx`), Group D (dark/motion, `globals.css`), Group E (`W14_QA_Report.md`).
> **Sources:** Review nhánh W14 (2026-06-26); `month4/W14/w14d` (Locked #5 dark token-only, no-hex), `w14a`/`w14c` (Dialog confirm adoption), `w14e` (DoD/evidence); `DesignSystem_Tokens.md §2.5`; `Frontend/Other/VoiceAndContent.md §7`; `break_task/week12_break/w12_fix_*` + `week13_break/w13_fix_*` (overstated-evidence pattern).

---

## 1. Micro-task Target

Sửa các điểm **sai/đáng tin** của W14 — không đổi happy-path / public surface: (a) khối `[data-theme="dark"]` gán **raw hex** trực tiếp vào token semantic, phá lớp primitive→semantic của light mode và vi phạm no-hex; (b) dark mode **chưa có cơ chế bật** nên không người dùng nào tới được — nhưng QA lại đính screenshot "Dark Mode" như tính năng chạy được; (c) `handleReset` vẫn gọi `confirm()` native thay vì `Dialog` primitive mà cả tuần W14 đi adopt; (d) `W14_QA_Report.md` khẳng định mạnh hơn code thật. Mục tiêu: dark **token-only & trung thực về trạng thái**, confirm **dùng design-system**, evidence **khớp code** — **không** đổi `--rs-report-*`/pipeline, **không** đổi shape/CanonicalTypes.

- **S1 — Dark mode nhồi ~15 hex thẳng vào token semantic (vi phạm token-only / no-hex — w14d Locked #5).** [globals.css:2515-2533](src/app/globals.css) định nghĩa `[data-theme="dark"]` bằng raw hex: `--rs-color-bg:#0B1120`, `--rs-color-surface:#111827`, `--rs-color-surface-muted:#1E293B`, `--rs-color-border:#334155`, `--rs-color-text:#E2E8F0`, `--rs-color-text-muted:#94A3B8`, `--rs-color-primary:#3B82F6`, `--rs-color-severity-{error,warning,info}`, `--rs-color-success`, … (≈15 màu). Light mode dùng **2 lớp**: primitive palette (`--rs-blue-600:#2563eb`, `--rs-slate-*`) → semantic (`--rs-color-* : var(--rs-…)`). Dark mode bỏ qua lớp primitive, gán hex thô → (1) lệch convention "không hex mới ngoài primitive", (2) `#3B82F6`/`#0B1120`/… **không** thuộc palette §2.1, (3) `DesignSystem_Tokens.md` chỉ thêm **2** dòng (`--rs-color-error-bg`, `--rs-color-focus-ring`) — ~13 hex dark còn lại **không** được document. **Fix (chọn 1):** **(A)** thêm **dark primitive layer** vào `:root[data-theme="dark"]` (redefine `--rs-slate-*`/`--rs-blue-*` cho dark, hoặc thêm `--rs-*-dark`) rồi map semantic qua `var(--rs-*)` như light — và document trong `DesignSystem_Tokens.md §2.5`; **hoặc (B)** nếu giữ override semantic trực tiếp, **document đủ toàn bộ bảng dark** trong `DesignSystem_Tokens.md §2.5` + khai báo rõ "dark override gán semantic trực tiếp (ngoại lệ có chủ đích, không qua primitive)". Khuyến nghị (A) để nhất quán hai chiều sáng/tối.

- **S2 — Dark mode không thể bật trong app (không setter `data-theme` / không `prefers-color-scheme`).** Grep toàn `src/` không có chỗ nào set `document.documentElement.setAttribute("data-theme","dark")`, không toggle UI, không `@media (prefers-color-scheme: dark)`. CSS dùng `[data-theme="dark"]` (attribute thủ công) nên **không bao giờ active** với người dùng thật. Trong khi đó [W14_QA_Report.md §5](Design/Reports/Month4/W14/W14_QA_Report.md) đính "Dark Mode Workspace View" như một surface đang chạy. w14d **không** yêu cầu toggle (chỉ yêu cầu override CSS tồn tại) → **không bắt buộc** thêm toggle, nhưng phải **trung thực**. **Fix (chọn 1):** **(A)** thêm cơ chế tối thiểu: hoặc `@media (prefers-color-scheme: dark)` mirror khối token (theo OS), hoặc 1 toggle nhỏ set `data-theme` (nếu trong sức tuần này); **hoặc (B)** giữ nguyên nhưng **khai báo dark-toggle = deferred (W15)** trong `w14d` + chú thích screenshot QA là "forced `data-theme=dark` để preview, chưa có lối bật cho user". Không để screenshot ngụ ý tính năng đã chạy.

- **S3 — `handleReset` dùng `confirm()` native thay `Dialog` primitive (lệch adoption W14).** [Workspace.tsx:126](src/components/Workspace.tsx) `if (!confirm("Tạo report mới? …")) return;`. Cả tuần W14 đi "adopt Dialog confirm" (w14a mount Provider, w14c "Dialog confirm 'Vẫn xuất dù còn lỗi?'") và Export **đã** dùng `Dialog`. Riêng nút "Tạo report" (phá huỷ toàn bộ nội dung — đúng loại cần confirm phá huỷ B9) vẫn bằng `window.confirm`: **không** focus-trap nhất quán Radix, **không** dark-mode styled, **không** theo giọng `VoiceAndContent §7`, lệch hẳn phần còn lại. Đây cũng là điều `W14_QA_Report.md` DoD claim "confirmation dialogs match VoiceAndContent.md" — nhưng reset thì không. **Fix:** đổi `handleReset` sang `Dialog` `variant="confirm"` (backdrop bị chặn, Esc đóng được — đã đúng ở [Dialog.tsx:30](src/components/ui/Dialog.tsx)) với copy chuẩn `VoiceAndContent §7`; **hoặc** nếu cố ý giữ native cho reset thì khai báo ngoại lệ trong w14a/QA. Khuyến nghị dùng `Dialog`.

- **S4 — `W14_QA_Report.md` overstated so với code thật (pattern w12/w13_fix_*).** (a) DoD "**Strict Token-Only Styles ✅ PASS**" — nhưng shell mới đầy inline-style + raw px (`48px/240px/320px/794px`, `box-shadow` hardcode), xem `w14_polish_*`; (b) "Overrode … **Documented in `DesignSystem_Tokens.md`**" — chỉ document 2/~17 token dark (xem S1); (c) §3 Coverage Matrix liệt kê `EditorPanel.tsx` / `PreviewPane.tsx` như artifact "migrated" của W14, nhưng **không** nằm trong diff `main...feature/W14-ui-adoption` (file có sẵn từ tuần trước). **Fix:** chỉnh report cho khớp: token-only ghi rõ "primitive/.css token-only; còn inline layout-style ở shell (tracked ở `w14_polish_*`)"; dark "documented" → document đủ hoặc nói rõ phạm vi; tách rõ "đã có sẵn / vừa adopt trong W14". (Phụ: nếu re-claim "377 tests PASS" thì chạy lại 4 gate & cập nhật `build_output.txt` cho khớp.)

> 🔒 **Không đổi happy-path / public surface (W14 Locked #1).** S1 chỉ đổi tầng token CSS; S2 chỉ thêm cơ chế bật/khai báo; S3 đổi reset từ native sang `Dialog` (cùng hành vi xác nhận); S4 chỉ sửa doc. Không đổi shape primitive / CanonicalTypes / `ui/index.ts`.
> 🔒 **Token-only / no-hex (w14d Locked #5).** Hex mới phải vào primitive palette + `DesignSystem_Tokens.md` trước khi dùng; dark không gán hex thô ngoài lớp primitive.
> 🔒 **`--rs-report-*` bất biến (Locked tuần #3).** Dark **không** override token report; tờ A4 luôn trắng-đen.
> 🔒 **Evidence trung thực (w12/w13_fix_* pattern).** Sau fix, `W14_QA_Report.md` khớp code; không claim mạnh hơn thực tế.

## 2. Scope

### In scope
- **S1** [src/app/globals.css](src/app/globals.css) (MODIFY): dark theo lớp primitive (A) hoặc giữ override + document đủ (B); [DesignSystem_Tokens.md §2.5](Design/Modules/Other/DesignSystem_Tokens.md) (MODIFY): document đủ bảng dark.
- **S2** [src/app/globals.css](src/app/globals.css) / shell (MODIFY nếu chọn A): `prefers-color-scheme` mirror hoặc toggle tối thiểu; **hoặc** [w14d](Design/ContractForAI/Core/month4/W14/w14d_microcopy_darkmode_motion_contract.md) + [W14_QA_Report.md](Design/Reports/Month4/W14/W14_QA_Report.md) (MODIFY): khai báo deferred + chú thích screenshot.
- **S3** [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY): `handleReset` dùng `Dialog` `variant="confirm"` + copy `VoiceAndContent §7`.
- **S4** [Design/Reports/Month4/W14/W14_QA_Report.md](Design/Reports/Month4/W14/W14_QA_Report.md) (MODIFY): claim khớp code; tách "có sẵn / vừa adopt"; (phụ) `build_output.txt` cập nhật nếu re-claim gate.

### Out of scope
- ❌ Inline-style + raw px shell, glyph `▾`, elevation hardcode (→ contract **w14_polish_***).
- ❌ Thêm primitive/feature; đổi shape primitive / CanonicalTypes / `ui/index.ts`; đụng `--rs-report-*`/pipeline.
- ❌ Axe automation + before/after ≥3 viewport + đóng Phase 4 (→ **W15**).

## 3. Checklist
- [ ] **S1** dark không còn hex thô ngoài primitive (chọn A) **hoặc** `DesignSystem_Tokens.md §2.5` document đủ bảng dark + khai báo ngoại lệ (B); `grep -nE "#[0-9A-Fa-f]{3,6}" globals.css` trong khối dark chỉ còn ở primitive layer (A) hoặc khớp doc (B).
- [ ] **S2** dark **bật được** (prefers-color-scheme/toggle) **hoặc** w14d + QA khai báo dark-toggle deferred + chú thích screenshot là forced-preview.
- [ ] **S3** "Tạo report" mở `Dialog` confirm (Esc đóng, backdrop chặn, focus trap); copy theo `VoiceAndContent §7`; reset vẫn xoá đúng như trước.
- [ ] **S4** QA report khớp code: token-only ghi đúng phạm vi; dark "documented" đúng; tách artifact có-sẵn/vừa-adopt; (phụ) gate re-run nếu claim số test.
- [ ] `--rs-report-*` không đổi khi dark; tờ A4 trắng-đen.
- [ ] 4 gate (lint/typecheck/test/build) xanh.

## 4. Expected Interfaces / Files

> Happy-path + public surface giữ nguyên. Chỉ đổi tầng token dark, cơ chế bật/khai báo, reset→Dialog, đồng bộ evidence.

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/app/globals.css` | MODIFY | S1 dark primitive layer / S2 prefers-color-scheme (nếu A) |
| `Design/Modules/Other/DesignSystem_Tokens.md` | MODIFY | S1 document đủ bảng dark |
| `src/components/Workspace.tsx` | MODIFY | S3 reset → `Dialog` confirm |
| `Design/ContractForAI/Core/month4/W14/w14d_*` | MODIFY (nếu S2 chọn B) | khai báo dark-toggle deferred |
| `Design/Reports/Month4/W14/W14_QA_Report.md` | MODIFY | S2/S4 claim trung thực |

> **Import boundary:** không lib mới; `Workspace.tsx` import `Dialog` từ `@/components/ui`. Offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Refactor dark token lỡ đổi màu hiển thị | Medium | Token mới = đúng hex cũ; so screenshot trước/sau hai theme. |
| `prefers-color-scheme` bật dark ngoài ý muốn user | Low | Nếu không chắc → chọn (B) khai báo deferred, không auto-dark. |
| Reset→Dialog đổi flow xoá | Medium | Giữ nguyên logic `createProjectFromTemplate`+`saveBundle`; chỉ thay lớp confirm. |
| Report vẫn lệch sau sửa | Medium | Re-grep hex/px + đối chiếu diff W14; claim chỉ ghi điều verify được. |

## 6. Verification Plan
- `grep -nE "#[0-9A-Fa-f]{3,6}" src/app/globals.css` → khối dark không còn hex thô ngoài primitive (A) / khớp doc (B).
- Bật dark (prefers/toggle hoặc forced theo khai báo): UI tối, severity-bg dịu, focus ring rõ; tờ A4 preview vẫn trắng-đen.
- Nhấn "Tạo report" → `Dialog` confirm (Esc đóng, backdrop không đóng, focus trả về); xác nhận → nội dung reset.
- Đọc `W14_QA_Report.md` đối chiếu diff: không claim vượt code.
- 4 gate xanh; `build_output.txt` cập nhật nếu re-claim.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Ưu tiên **S1 → S3 → S2 → S4**. Đề xuất commit: `fix(ui): dark mode via primitive token layer (no raw hex)`; `fix(write): reset confirm uses Dialog primitive`; `docs(tokens): document full dark palette`; `docs(reports): correct W14 QA claims (token-only/dark/coverage)`.
