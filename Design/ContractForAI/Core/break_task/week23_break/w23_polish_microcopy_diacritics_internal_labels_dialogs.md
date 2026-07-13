# Contract For AI — W23 Polish (F): Microcopy — Command Palette Không Dấu · Nhãn Nội Bộ Rò UI · Dialog Xóa & Tooltip AI Sai

> **Lane:** Core / break_task / week23_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Polish microcopy/copy. Gom nhiều điểm nhỏ cùng chủ đề "giọng & nhãn".
> **Findings:**
> - **S1** (🟢) — **Command palette + vài toast không dấu tiếng Việt (source thật).** `command-registry.ts` hardcode toàn bộ nhãn **không dấu**: nhóm "Viet bao cao"/"Kiem tra"/"Hien thi"/"Xuat ban"/"Thiet lap" ([command-registry.ts:33](src/components/command-registry.ts#L33)-L38) và lệnh "Them muc moi"/"Nhan doi muc hien tai"/"Chuyen muc len tren"/"Luu nhap"/"Soat loi bao cao"… ([command-registry.ts:44](src/components/command-registry.ts#L44)+). Toast cũng có chỗ mất dấu, vd `"Da chen noi dung Markdown vao muc da tha."` ([Workspace.tsx:439](src/components/Workspace.tsx#L439)). **Khác** dương-tính-giả W22** (a11y label mất dấu do serialize): đây là **chuỗi trong source thật sự thiếu dấu**. (Search bỏ dấu vẫn hoạt động tốt — normalize NFD tại [command-registry.ts:140](src/components/command-registry.ts#L140) — nên chỉ cần sửa **hiển thị**, không đụng logic tìm.)
> - **S2** (🟢) — **Nhãn nội bộ/lịch trình rò ra UI người dùng cuối.** `(dev)` cạnh readiness ([IssuesPanel.tsx:94](src/components/IssuesPanel.tsx#L94)); "Tối ưu kịch bản bằng AI (W11)" ([ScriptView.tsx:54](src/modules/present/ScriptView.tsx#L54)); "Xuất PPTX (Phase 3)" + "cần bật Phase 3" ([ExportPanel.tsx:267](src/modules/export/ExportPanel.tsx#L267),L271) — thêm nữa mâu thuẫn với nút PPTX **đang chạy** ở Present ([PresentPanel.tsx:151](src/modules/present/PresentPanel.tsx#L151)). Tương tự "(W11)" xuất hiện ở nhãn Q&A/outline AI.
> - **S3** (🟢) — **Dialog xóa mục dọa tĩnh, sai với thực tế.** Mô tả cố định "Mục báo cáo hiện tại **đang chứa nội dung**. Hành động xóa **sẽ không thể hoàn tác**." ([Workspace.tsx:1287](src/components/Workspace.tsx#L1287)) hiển thị kể cả **mục rỗng**, và thực tế **có** snapshot khôi phục ("Trước khi xóa mục …" — QA khôi phục thành công). Thông điệp vừa dọa vừa sai.
> - **S4** (🟢) — **Tooltip AI sai trạng thái.** `isDisabled = state === "disabled" || state === "unconfigured"` ([AiAssistBar.tsx:53](src/modules/write/ai/AiAssistBar.tsx#L53)); cả hai trạng thái đều hiện tooltip **"Vui lòng bật AI trong Cài đặt để sử dụng"** ([AiAssistBar.tsx:167](src/modules/write/ai/AiAssistBar.tsx#L167),L231). Khi AI **đã bật** nhưng thiếu API key (`unconfigured`), thông điệp sai — user đã bật rồi.
> **Builds on:** `command-registry.ts`, `Workspace.tsx` (toast, delete dialog), `IssuesPanel.tsx`, `ScriptView.tsx`, `ExportPanel.tsx`, `AiAssistBar.tsx`, `VoiceAndContent.md §7`.
> **Sources:** QA session 2026-07-13, phát hiện #10–#13 [[w25-ui-redesign]].

---

## 1. Micro-task Target

Toàn bộ chuỗi hiển thị cho người dùng cuối **đủ dấu tiếng Việt**, **không lộ nhãn nội bộ** (`(dev)`/`(W11)`/`Phase N`), và **thông điệp đúng trạng thái thực**.

- **S1 — Đủ dấu.** Thêm dấu cho toàn bộ nhãn `command-registry.ts` (nhóm + lệnh) và các toast mất dấu; **không** đổi `keywords`/logic tìm bỏ dấu.
- **S2 — Ẩn nhãn nội bộ.** Bỏ `(dev)`, `(W11)`, `(Phase 3)` khỏi chuỗi UI; nếu là cờ tính năng (readiness dev, PPTX gate) thì ẩn sau điều kiện build/flag, không in ra text. Giải quyết mâu thuẫn PPTX: hoặc bỏ "tạm hoãn" (nếu Present đã xuất được), hoặc thống nhất một chỗ xuất PPTX (phối hợp [[w23_fix_silent_actions_feedback_zip_pptx_history]]).
- **S3 — Dialog xóa đúng ngữ cảnh.** Mô tả theo thực tế: nếu mục rỗng → "Xóa mục trống này?"; nếu có nội dung → nêu có; và vì có snapshot khôi phục, đổi "không thể hoàn tác" → "Bạn có thể khôi phục từ Lịch sử phiên bản" (đúng với hành vi hiện có).
- **S4 — Tooltip AI phân biệt trạng thái.** `disabled` → "Vui lòng bật AI trong Cài đặt"; `unconfigured` → "AI đã bật — thêm khóa API trong Cài đặt để sử dụng".

> 🔒 Không đổi logic (tìm kiếm palette, luật xóa/snapshot, gate AI) — chỉ **chuỗi hiển thị**. Theo `VoiceAndContent.md §7`.
> 🔒 Không rò nhãn nội bộ; không thêm lib.

## 2. Scope

### In scope
- [src/components/command-registry.ts](src/components/command-registry.ts) (MODIFY): thêm dấu cho `commandGroupLabels` + `label` từng lệnh; giữ `keywords`.
- [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY): thêm dấu toast (vd L439); mô tả dialog xóa theo ngữ cảnh (rỗng/có nội dung + khôi phục).
- [src/components/IssuesPanel.tsx](src/components/IssuesPanel.tsx) (MODIFY): bỏ/ẩn `(dev)`.
- [src/modules/present/ScriptView.tsx](src/modules/present/ScriptView.tsx) (MODIFY): bỏ "(W11)"; các nhãn "(W11)" khác nếu có.
- [src/modules/export/ExportPanel.tsx](src/modules/export/ExportPanel.tsx) (MODIFY): xử lý "Xuất PPTX (Phase 3)"/"tạm hoãn" cho nhất quán với Present.
- [src/modules/write/ai/AiAssistBar.tsx](src/modules/write/ai/AiAssistBar.tsx) (MODIFY): tooltip theo `state` (`disabled` vs `unconfigured`).
- Rà quét (VERIFY): grep `(dev)`/`(W\d+)`/`Phase \d`/chuỗi thiếu dấu còn sót.

### Out of scope
- ❌ Đổi logic tìm kiếm palette / luật xóa / gate AI / gate PPTX.
- ❌ Dịch nội dung do người dùng nhập.
- ❌ Redesign dialog/tooltip (chỉ đổi chữ).

## 3. Checklist
- [ ] **S1** Command palette + toast đủ dấu; tìm kiếm bỏ dấu vẫn chạy.
- [ ] **S2** Không còn `(dev)`/`(W11)`/`(Phase 3)` trên UI; PPTX nhất quán.
- [ ] **S3** Dialog xóa: mục rỗng vs có nội dung khác nhau; nêu khôi phục được (không "không thể hoàn tác" nếu có snapshot).
- [ ] **S4** Tooltip AI: `unconfigured` báo "thêm khóa API", không "bật AI".
- [ ] grep nhãn nội bộ = rỗng. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/command-registry.ts` | MODIFY | nhãn đủ dấu; giữ keywords |
| `src/components/Workspace.tsx` | MODIFY | toast đủ dấu; dialog xóa theo ngữ cảnh |
| `src/components/IssuesPanel.tsx` | MODIFY | bỏ `(dev)` |
| `src/modules/present/ScriptView.tsx` | MODIFY | bỏ `(W11)` |
| `src/modules/export/ExportPanel.tsx` | MODIFY | PPTX "Phase 3" nhất quán |
| `src/modules/write/ai/AiAssistBar.tsx` | MODIFY | tooltip theo state |

> **Import boundary:** không lib mới.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Sửa nhãn palette làm hỏng test so khớp chuỗi | Low | Cập nhật test theo chuỗi có dấu; tìm kiếm dùng keywords/normalize không đổi. |
| Ẩn "Phase 3" nhưng PPTX thật chưa ổn định | Med | Phối hợp contract E: nếu Present PPTX chạy được thì bỏ "tạm hoãn"; nếu không, đổi copy trung tính (không lộ "Phase"). |
| Dialog xóa cần biết mục rỗng/không | Low | Kiểm `section.markdown.trim()` để chọn thông điệp. |
| Bỏ sót chuỗi thiếu dấu khác | Low | grep rà toàn repo; ghi checklist. |

## 6. Verification Plan
- Mở Ctrl+K: mọi nhãn có dấu ("Viết báo cáo", "Thêm mục mới", "Soát lỗi báo cáo"); gõ "soat"/"soát" đều match.
- Panel Soát lỗi không còn "(dev)"; Present không "(W11)"; Export PPTX không lộ "Phase 3" (hoặc nhất quán với Present).
- Xóa mục rỗng: thông điệp khác mục có nội dung; nêu khôi phục từ Lịch sử phiên bản.
- Bật AI (chưa nhập key): tooltip "thêm khóa API"; chưa bật: "bật AI trong Cài đặt". 4 gate xanh.

## 7. Status

`PROPOSED — chờ Approve`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `polish(copy): restore diacritics, hide internal labels, fix delete/AI messages`.
