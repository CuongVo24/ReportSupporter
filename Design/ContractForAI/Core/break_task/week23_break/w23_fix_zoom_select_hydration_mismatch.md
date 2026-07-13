# Contract For AI — W23 Fix (G): Hydration Mismatch Ở Radix Select (Điều Khiển Zoom)

> **Lane:** Core / break_task / week23_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Bug kỹ thuật (SSR/hydration), độc lập.
> **Findings:**
> - **S1** (🟢) — **`id`/`aria-controls` lệch giữa server và client.** Mỗi lần load trang, console báo **2 lỗi** "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties" cho `SelectTrigger` (điều khiển zoom, `aria-label="Chọn tỷ lệ zoom"`): server render `aria-controls="radix-_R_5jqaatmlb_"` / `id="_R_jqaatmlb_"` còn client `radix-_R_1cuiatmlb_` / `_R_4uiatmlb_`. Radix Select (`@radix-ui/react-select`) sinh id không ổn định giữa SSR và client trong bối cảnh dev/layout `(dev)`. Component: [src/components/ui/Select.tsx](src/components/ui/Select.tsx), dùng trong điều khiển zoom preview ([WorkspaceLayout.tsx](src/components/WorkspaceLayout.tsx)).
> **Builds on:** `ui/Select.tsx`, `WorkspaceLayout.tsx` (zoom control), Next.js App Router SSR.
> **Sources:** QA session 2026-07-13 (console errors), phát hiện #14 [[w25-ui-redesign]].

---

## 1. Micro-task Target

Loại bỏ hydration mismatch của Select zoom để console sạch và DOM a11y không bị React bỏ qua patch — bằng cách tối thiểu rủi ro, **không** tắt SSR toàn trang.

- **S0 — Xác nhận phạm vi.** Kiểm còn Select nào khác mismatch không (evidence type, AI provider…); ghi danh sách.
- **S1 — Ổn định render.** Chọn một trong: (a) **mounted-guard** — chỉ render Select (hoặc cả zoom control) sau `useEffect` set `mounted=true`, hiển thị placeholder tĩnh khi SSR; hoặc (b) `suppressHydrationWarning` đúng chỗ nếu chênh lệch chỉ là id vô hại; hoặc (c) truyền `id` ổn định qua `useId` nhất quán. Ưu tiên (a) nếu control là client-only hợp lý (zoom chỉ có nghĩa sau khi có viewport).

> 🔒 Không tắt SSR toàn trang; không thêm lib. Không đổi diện mạo control.

## 2. Scope

### In scope
- [src/components/ui/Select.tsx](src/components/ui/Select.tsx) (MODIFY nếu chọn c): đảm bảo id ổn định.
- [src/components/WorkspaceLayout.tsx](src/components/WorkspaceLayout.tsx) (MODIFY nếu chọn a): mounted-guard cho zoom control.
- (VERIFY) các Select khác (evidence form, AI settings) — sửa nếu cùng lỗi.

### Out of scope
- ❌ Thay Radix Select bằng lib khác.
- ❌ Đổi hành vi zoom.
- ❌ Tắt SSR toàn app.

## 3. Checklist
- [x] **S0** Đã liệt kê mọi Select mismatch.
- [x] **S1** Load trang → **0** lỗi hydration liên quan Select zoom trong console.
- [x] Zoom control hoạt động như cũ (đổi tỷ lệ, hiển thị %).
- [x] 4 gate xanh (test 617/617, tsc sạch).

### S0 — Kết quả audit Select (2026-07-13)
Toàn app chỉ có **3 call-site `<Select>` thật**: điều khiển zoom ([WorkspaceLayout.tsx](src/components/WorkspaceLayout.tsx)), [AiSettingsPanel.tsx](src/modules/write/ai/AiSettingsPanel.tsx), [EvidenceForm.tsx](src/modules/evidence/EvidenceForm.tsx) (call-site `(dev)/ui-gallery` là trang dev, không tính). Chỉ **zoom** nằm trong lượt SSR đầu tiên → sinh mismatch. Hai cái còn lại render **bên trong Radix Dialog/panel** (content chỉ mount khi mở) nên không SSR id Radix → khớp đúng QA gốc (console chỉ báo **2 lỗi, đều của zoom**). Đã áp mounted-guard cho zoom; không cần đụng 2 Select kia.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/WorkspaceLayout.tsx` | MODIFY (cách a) | mounted-guard cho zoom control |
| `src/components/ui/Select.tsx` | MODIFY (cách c) | id ổn định nếu cần |

> **Import boundary:** không lib mới.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Mounted-guard gây nhấp nháy control lúc mount | Low | Placeholder tĩnh cùng kích thước; control chỉ hiện sau mount. |
| `suppressHydrationWarning` che lỗi thật khác | Med | Chỉ áp cho attribute id đã xác nhận vô hại; không bọc cả cây. |
| Select khác cũng lỗi nhưng bỏ sót | Low | S0 liệt kê; test load các panel có Select. |

## 6. Verification Plan
- Reload trang nhiều lần (light/dark, `(dev)` layout): console **không** còn lỗi hydration Select zoom.
- Đổi zoom 50/75/100/125/Kích thước thực: hoạt động; nhãn "Zoom: N%" đúng.
- Mở form evidence + AI settings: không phát sinh mismatch mới. 4 gate xanh.

## 7. Status

`DONE — đã thi công & xác nhận (commit 01ac1e4)`

> Thi công: mounted-guard cho zoom control ([WorkspaceLayout.tsx](src/components/WorkspaceLayout.tsx)); placeholder tĩnh cùng kích thước khi SSR. Gate xanh (test 617/617, tsc sạch). S0 audit ghi ở §3.
