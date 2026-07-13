# Contract For AI — W23 UX (H): Bảng Điều Khiển Che Nội Dung Ở Laptop 1024–1439px · Module Present Chật

> **Lane:** Core / break_task / week23_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** UX/IA + responsive. **Design — đo breakpoint trước khi sửa, không "sửa mù".**
> **Findings:**
> - **S1** (🟢) — **Panel là modal drawer che nội dung dưới 1440px.** `WorkspaceLayout` dock panel cạnh phải **chỉ khi** `min-width: 1440px` (`wideMedia`, [WorkspaceLayout.tsx:88](src/components/WorkspaceLayout.tsx#L88)-L118); ở **1024–1439px** (laptop phổ biến 1280/1366) panel mở dạng **drawer che** editor. Hệ quả QA: bấm "Xem" một issue điều hướng đúng mục nhưng **drawer vẫn che**, phải Đóng → sửa → Mở lại → chạy Soát lỗi lại — vòng lặp gãy dòng công việc "vừa xem lỗi vừa sửa".
> - **S2** (🟢) — **Module Thuyết trình nhồi trong drawer ~300px.** Present gồm outline 12 slide + dropdown gán người nói mỗi slide + tab Kịch bản nói + Q&A phản biện + Luyện phản biện ([PresentPanel.tsx](src/modules/present/PresentPanel.tsx)) — tất cả trong drawer hẹp; thao tác gán người nói/soạn kịch bản rất chật, cuộn dài.
> **Builds on:** `WorkspaceLayout.tsx` (breakpoint tiers `1024`/`1440`, drawer vs dock), `WorkspaceLayout.css` (drawer), `PresentPanel.tsx`.
> **Sources:** QA session 2026-07-13, phát hiện #15 [[w25-ui-redesign]].

---

## 1. Micro-task Target

Cho phép **vừa xem lỗi/panel vừa sửa** ở laptop 1024–1439px (không bị che), và cho module Present đủ không gian thao tác — bằng thay đổi **có đo lường**, không phá layout ≥1440 hay ≤1023 (mobile drawer đúng).

- **S0 — Đo & quyết định breakpoint (design trước).** Xác nhận các tier hiện có (`1024` desktop, `1440` wide) và hành vi từng tier; quyết mốc dock: hạ dock cạnh phải xuống **≥1280** (thu hẹp editor thay vì che), giữ drawer cho <1280; hoặc cho panel **dock-thu-hẹp** ở 1024–1439 thay vì overlay. Ghi quyết định + ảnh so sánh vào PR.
- **S1 — Panel không che ở tier laptop.** Áp quyết định S0: ở tier đã chọn, panel đẩy/thu editor (co-exist) thay vì overlay che; bảo toàn nút đóng, focus-trap chỉ khi thực sự là modal (mobile).
- **S2 — Present rộng hơn.** Cho Present lối "mở rộng" (full-width workspace hoặc panel rộng hơn khi ở tier đủ chỗ); tối thiểu cải thiện mật độ (bố cục 2 cột outline/chi tiết khi đủ rộng) thay vì nhồi 1 cột hẹp.

> 🔒 Không phá layout ≥1440 (đang tốt) và ≤1023 (mobile drawer đúng — đã loại dương-tính-giả). Chỉ cải thiện tier giữa.
> 🔒 Token-only; không lib mới; không đổi chức năng panel.

## 2. Scope

### In scope
- [src/components/WorkspaceLayout.tsx](src/components/WorkspaceLayout.tsx) (MODIFY): thêm/điều chỉnh tier để panel dock-thu-hẹp ở 1024–1439 (hoặc mốc S0), không overlay che.
- [src/components/WorkspaceLayout.css](src/components/WorkspaceLayout.css) (MODIFY): style dock cho tier mới; giữ drawer cho <mốc.
- [src/modules/present/PresentPanel.tsx](src/modules/present/PresentPanel.tsx) (MODIFY): bố cục rộng/2 cột hoặc lối mở rộng khi đủ chỗ.
- (VERIFY) focus-trap/scroll-lock chỉ áp cho modal thật (mobile), không cho dock.

### Out of scope
- ❌ Redesign toàn bộ shell/IA (chỉ tier giữa + Present density).
- ❌ Đổi mobile drawer (≤1023) — đang đúng.
- ❌ Tính năng Present mới.

## 3. Checklist
- [ ] **S0** Quyết định breakpoint ghi rõ + ảnh so sánh trong PR.
- [ ] **S1** Ở 1280/1366: mở panel Soát lỗi → **không che** editor; bấm "Xem" issue sửa được ngay không cần đóng panel.
- [ ] **S2** Present ở tier rộng: bố cục thoáng hơn (2 cột / mở rộng), thao tác gán người nói/kịch bản dễ.
- [ ] ≥1440 và ≤1023 không hồi quy. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/WorkspaceLayout.tsx` | MODIFY | tier dock cho 1024–1439 (hoặc mốc S0) |
| `src/components/WorkspaceLayout.css` | MODIFY | style dock tier giữa; giữ drawer <mốc |
| `src/modules/present/PresentPanel.tsx` | MODIFY | mật độ/mở rộng Present |

> **Import boundary:** không lib mới; token layout sẵn có.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Dock thu editor quá hẹp ở 1280 gây chật preview | Med | Đo min-width editor/preview khả dụng; chọn mốc dock (≥1280) sao cho cả hai đủ đọc; cho thu gọn panel. |
| Đổi tier phá ≥1440/≤1023 | Med | Test 3 mốc (375 / 1280 / 1600); giữ nhánh mobile drawer nguyên. |
| Present 2 cột vỡ ở tier hẹp | Low | 2 cột chỉ bật khi đủ rộng; fallback 1 cột. |
| Focus-trap dock cản thao tác editor | Med | Chỉ trap khi modal (mobile); dock không trap. |

## 6. Verification Plan
- 1280×800: mở "Soát lỗi", editor **co lại nhưng vẫn thấy**; bấm "Xem" lỗi → con trỏ tới mục, sửa ngay khi panel còn mở; chạy Soát lỗi lại không cần đóng/mở.
- 1600×900: hành vi dock ≥1440 như cũ. 375×812: mobile drawer + tab Bàn viết/Tờ nộp như cũ.
- Present ở 1600: bố cục thoáng; gán người nói/kịch bản thao tác dễ. 4 gate xanh.

## 7. Status

`PROPOSED — chờ Approve`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `feat(ui): dock assistant panel at laptop widths and widen present module`.
