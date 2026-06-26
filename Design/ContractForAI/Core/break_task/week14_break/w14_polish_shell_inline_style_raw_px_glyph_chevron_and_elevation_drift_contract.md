# Contract For AI — W14 Polish: Shell Inline-Style + Raw px, Glyph `▾` Chevron & Elevation Hardcode Drift

> **Lane:** Core / break_task / week14_break.
> **Branch:** `feature/W14-ui-adoption` (hoặc `polish/w14-ui-adoption`).
> **Type:** Consistency / token-discipline — findings **S1** (Med, inline-style + raw px dày đặc trong shell mới `WorkspaceLayout.tsx`/`Workspace.tsx` — **tái phạm** W11 S2 / W12 S3 / W13 S4, và lần này nặng nhất từ trước tới giờ), **S2** (Low, raw px trong `WorkspaceLayout.css` đáng token-hoá: rail/divider/badge-dot), **S3** (Low, `box-shadow` hardcode gần-trùng `--rs-elevation-*` thay vì dùng token), **S4** (Low, report-switcher chevron dùng glyph `▾` thay lucide `ChevronDown` — **đúng** repeat W13 S3) — review nhánh W14 (session 2026-06-26).
> **Builds on:** Group A (`WorkspaceLayout.tsx`, `WorkspaceLayout.css`, `Workspace.tsx`).
> **Sources:** Review nhánh W14 (2026-06-26); `month4/W14/w14a` (shell adoption, token-only), `w14d` (token §4.5/§4.6); `DesignSystem_Tokens.md §4.1/§4.3/§4.5`; `break_task/week11_break` S2 + `week12_break` S3 + `week13_break/w13_polish_*` S3/S4 (inline-style + glyph drift — đã chốt tránh).

---

## 1. Micro-task Target

Dọn drift **không chặn merge** nhưng lệch token-discipline mà các tuần trước đã chốt: (a) shell mới render layout bằng inline `style={{}}` kèm raw px (`48px/240px/320px/794px`); (b) `WorkspaceLayout.css` còn raw px đáng token-hoá; (c) `box-shadow` hardcode gần-trùng `--rs-elevation-*`; (d) chevron report-switcher dùng glyph `▾` thay lucide. **Không** đổi behavior layout / split-drag / A4 scale, **không** đổi public surface `WorkspaceLayoutProps`.

- **S1 — Inline-style + raw px dày đặc trong shell mới (tái phạm W11 S2 / W12 S3 / W13 S4).** [WorkspaceLayout.tsx](src/components/WorkspaceLayout.tsx) có **15** chỗ `style={{}}`, [Workspace.tsx](src/components/Workspace.tsx) **15** chỗ — gồm raw px layout: rail width `style={{ width: isLeftCollapsed ? "48px" : "240px" }}` ([WorkspaceLayout.tsx:152](src/components/WorkspaceLayout.tsx)), right rail `"48px" : "320px"` ([:214](src/components/WorkspaceLayout.tsx)), preview scale wrapper `width: "794px"` ([:193](src/components/WorkspaceLayout.tsx),[:204](src/components/WorkspaceLayout.tsx)), và loạt `display:flex/padding/borderBottom` inline (side-panel header [Workspace.tsx:216-228](src/components/Workspace.tsx), tabs container [:226-246](src/components/Workspace.tsx)). Đây **đúng** drift mà `week13_break/w13_polish_* S4` đã chốt "đưa style về class token" — nhưng W14 lại là tuần inline-style **nhiều nhất**, và mâu thuẫn trực tiếp với QA DoD "Strict Token-Only" (xem `w14_fix_* S4`). **Fix:** gom layout vào class trong [WorkspaceLayout.css](src/components/WorkspaceLayout.css) (đã co-located); rail width động → class `ws-side-column--collapsed`/`--expanded` hoặc CSS var `--rs-rail-w-{collapsed,expanded}`; px → token. Giữ inline **chỉ** cho giá trị thực sự động/runtime (`transform: scale(${scale})`, `width: ${splitWidth}%`, `height: ${height}px`) — phần này hợp lệ vì tính bằng JS.

- **S2 — Raw px trong `WorkspaceLayout.css` đáng token-hoá.** [WorkspaceLayout.css](src/components/WorkspaceLayout.css) còn: toggle btn `width:24px;height:24px` ([:143-144](src/components/WorkspaceLayout.css)) và `32px` ([:247-248](src/components/WorkspaceLayout.css)), badge-dot `width:8px;height:8px` ([:273-274](src/components/WorkspaceLayout.css)), divider `width:5px` ([:314](src/components/WorkspaceLayout.css)), rail `width:280px` ([:414](src/components/WorkspaceLayout.css)), `max-width:180px` ([:74](src/components/WorkspaceLayout.css)), `letter-spacing:0.5px` ([:180](src/components/WorkspaceLayout.css)). Border-width `1px`/outline-offset `2px` là hairline **được phép** (theo w13_fix_* S3). **Fix:** control-size dùng `--rs-control-height-sm`/token mới (`--rs-rail-w-*`, `--rs-divider-w`) bổ sung `DesignSystem_Tokens.md §4.5` **trước** khi dùng; giữ hairline px.

- **S3 — `box-shadow` hardcode gần-trùng `--rs-elevation-*`.** [WorkspaceLayout.css:395](src/components/WorkspaceLayout.css) `box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08)` — gần như `--rs-elevation-2` (`0 4px 12px rgba(15,23,42,0.12)`) chỉ khác alpha. Tự chế shadow rời token → drift dark mode (token elevation có thể override, hardcode thì không). **Fix:** dùng `var(--rs-elevation-1)`/`--rs-elevation-2`; nếu cần alpha riêng thì thêm token elevation mới vào `DesignSystem_Tokens.md §4.3`, không hardcode.

- **S4 — Report-switcher chevron dùng glyph `▾` thay lucide (đúng repeat W13 S3).** [WorkspaceLayout.tsx:136](src/components/WorkspaceLayout.tsx) `<span className="ws-report-switcher-chevron" aria-hidden="true">▾</span>`. Mọi icon khác trong shell dùng `lucide-react` (`Menu`/`PanelLeftOpen`/`FileText`…). `w13_polish_* S3` đã chốt bỏ glyph (`⚠`) sang lucide; đây là tái phạm cùng loại. Có `aria-hidden` (không phá SR) nhưng lệch hệ icon + render khác theo font. **Fix:** thay bằng `ChevronDown` từ `lucide-react` (`size=16`).

> 🔒 **Không đổi behavior / public surface (W14 Locked #1).** S1/S2/S3 chỉ đổi **nơi đặt** style (inline→class) + token-hoá; S4 đổi glyph→icon. Không đổi `WorkspaceLayoutProps`, không đổi split-drag/A4-scale logic, không đổi shape/CanonicalTypes.
> 🔒 **Token-only (Locked #1).** Mọi px/shadow mới qua `var(--rs-*)`; token thiếu bổ sung `DesignSystem_Tokens.md` trước.
> 🔒 **Giữ inline cho giá trị runtime.** `scale(${scale})`, `${splitWidth}%`, `${height}px` tính bằng JS — **được** giữ inline; chỉ dọn px/layout **tĩnh**.

## 2. Scope

### In scope
- **S1** [src/components/WorkspaceLayout.tsx](src/components/WorkspaceLayout.tsx) + [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY): layout tĩnh inline → class trong [WorkspaceLayout.css](src/components/WorkspaceLayout.css); giữ inline cho giá trị runtime.
- **S2** [src/components/WorkspaceLayout.css](src/components/WorkspaceLayout.css) (MODIFY): raw px control/rail/divider → token; [DesignSystem_Tokens.md §4.5](Design/Modules/Other/DesignSystem_Tokens.md) (MODIFY): thêm `--rs-rail-w-*`/`--rs-divider-w` nếu cần.
- **S3** [src/components/WorkspaceLayout.css](src/components/WorkspaceLayout.css) (MODIFY): `box-shadow` → `--rs-elevation-*`.
- **S4** [src/components/WorkspaceLayout.tsx](src/components/WorkspaceLayout.tsx) (MODIFY): glyph `▾` → lucide `ChevronDown`.

### Out of scope
- ❌ Dark hardcode hex, native `confirm()`, QA overstated (→ contract **w14_fix_***).
- ❌ Đổi behavior split-drag/A4-scale/responsive; đổi `WorkspaceLayoutProps`.
- ❌ Thêm primitive/feature; full axe (→ **W15**).

## 3. Checklist
- [ ] **S1** layout tĩnh chuyển sang class; inline chỉ còn giá trị runtime (scale/splitWidth/height); rail width động qua class/CSS var.
- [ ] **S2** `WorkspaceLayout.css` không còn raw px control/rail/divider (token-hoá; token thêm vào `DesignSystem_Tokens.md` trước); giữ hairline `1px`/`2px`.
- [ ] **S3** `box-shadow` dùng `--rs-elevation-*` (không hardcode rgba).
- [ ] **S4** chevron dùng lucide `ChevronDown`; không còn glyph `▾`.
- [ ] Behavior layout không đổi (split-drag, A4 scale-to-fit, collapse rail, mobile drawer); 4 gate xanh.

## 4. Expected Interfaces / Files

> Behavior + public surface giữ nguyên. Chỉ đổi nơi đặt style, token-hoá px/shadow, glyph→icon.

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/WorkspaceLayout.tsx` | MODIFY | S1 inline→class; S4 chevron lucide |
| `src/components/Workspace.tsx` | MODIFY | S1 side-panel/tabs inline→class |
| `src/components/WorkspaceLayout.css` | MODIFY | S1/S2 class + token px; S3 elevation token |
| `Design/Modules/Other/DesignSystem_Tokens.md` | MODIFY (nếu cần) | `--rs-rail-w-*`/`--rs-divider-w`/elevation |

> **Import boundary:** không lib mới; `ChevronDown` từ `lucide-react` (đã dùng). Offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Chuyển inline→class lỡ đổi layout | Medium | Class = đúng giá trị cũ; so screenshot trước/sau (desktop + mobile). |
| Token-hoá px lỡ đổi kích thước | Low | Token = đúng px cũ; verify rail 48/240/320, divider, A4 794. |
| "Polish" lén đổi behavior split-drag/scale | Low | Giữ nguyên handler + inline runtime; chỉ dọn style tĩnh. |
| Glyph→icon đổi spacing chevron | Low | `ChevronDown size=16` + canh `aria-hidden`; kiểm thị giác. |

## 6. Verification Plan
- `grep -n "px" src/components/WorkspaceLayout.css` → chỉ còn hairline `1px`/offset `2px` (hoặc token).
- `grep -n "style={{" src/components/{WorkspaceLayout,Workspace}.tsx` → chỉ còn giá trị runtime (scale/splitWidth/height).
- Shell: split-drag kéo được, A4 scale-to-fit không méo (≥3 viewport), rail collapse 48px, mobile drawer; chevron là icon lucide.
- 4 gate xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Làm **sau** `w14_fix_*` (ưu tiên thấp hơn). Đề xuất commit: `polish(shell): static layout styles to css classes + tokens`; `refactor(shell): tokenize rail/divider px + elevation`; `polish(shell): report switcher chevron to lucide`.
