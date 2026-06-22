# 🤖 VIBE CODING PROTOCOL — ReportSupporter (ANTI-HALLUCINATION)

Bộ **Khung Kim Cô** bắt buộc mọi AI Agent (Cursor / Copilot / Claude / Antigravity...) phải tuân thủ khi làm việc trên dự án **ReportSupporter**, để ngăn ảo giác (Hallucination) phá vỡ kiến trúc đã thiết kế.

> Dự án này do **1 người** vận hành cùng AI — kỷ luật càng phải chặt vì không có Buddy review chéo. AI là người thực thi, **không phải người quyết định scope**.

---

## 🛑 STEP 0: THE ABSOLUTE PRIMER (NẠP NGỮ CẢNH)

Khi mở một phiên làm việc mới, **hành động đầu tiên tuyệt đối** là đọc trọn file này, rồi đọc bộ tài liệu xương sống **theo đúng thứ tự**:

| # | File | Mục đích | Khi nào |
|---|------|----------|---------|
| 1 | `Design/Guideline.md` | Bản đồ toàn dự án, cấu trúc thư mục | Luôn đọc đầu |
| 2 | `Design/ProductPRD.md` | MVP goal, core flow, **Non-goals** | Luôn đọc |
| 3 | `Design/Modules/Other/TechnicalStack.md` | Stack đã khoá cứng (cấm import lậu) | Luôn đọc |
| 4 | `Design/Conventions/Rule.md` | Luật chơi cho AI | Luôn đọc |
| 5 | `Design/Conventions/Coding & Git Standard.md` | Chuẩn code, naming, commit, branch | Luôn đọc |
| 6 | `Design/Conventions/WorkFlow.md` | Quy trình solo Agile-AI 4 giai đoạn | Luôn đọc |

**Tài liệu công việc — đọc khi nhận task:**

| # | File | Mục đích |
|---|------|----------|
| 7 | `Design/TaskBrief/Core/month<X>/w<Y>.md` | Task Brief tuần hiện tại — xác định phạm vi |
| 8 | `Design/RoadMap/MasterRoadMap.md` | Lộ trình 12 tuần — biết đang ở đâu |

**Tài liệu module — đọc khi cần:**

| # | File | Khi nào |
|---|------|---------|
| 9  | `Design/Modules/1.Write.md` | Khi code editor / preview / template / autosave |
| 10 | `Design/Modules/2.Format.md` | Khi code numbering / TOC / A4 layout |
| 11 | `Design/Modules/3.Check.md` | Khi code checker engine / rules |
| 12 | `Design/Modules/4.Export.md` | Khi code HTML / PDF / DOCX export |
| 13 | `Design/Modules/5.Present.md` | Khi code slides / script (Phase 3) |
| 14 | `Design/ContractForAI/CONTRACT_STRUCTURE_RULE.md` | **BẮT BUỘC** trước khi thao tác bất kỳ Contract nào |

> 💡 **Prompt gợi ý đầu phiên:**
> *"Đọc `Design/VibeCode.md` và toàn bộ tài liệu nó trỏ tới, rồi đọc Task Brief tuần hiện tại và lên plan cho tôi."*

---

## 🗺️ STEP 1: PLANNING MODE — PHÂN RÃ MICRO-TASKS

Khi nhận Task, AI **KHÔNG ĐƯỢC tuôn code ngay**. Bắt buộc:

1. **Micro-tasking:** băm Task Brief thành các nhóm nhỏ, phạm vi rõ ràng.
2. **File map:** liệt kê chính xác file `[NEW]` / `[MODIFY]`.
3. **Risk Assessment:** đánh giá rủi ro (phá type cũ? nợ kỹ thuật? đụng Non-goals? cần lib ngoài stack?).

---

## 📜 STEP 2: CONTRACT-FIRST → WAIT FOR APPROVE

Trước **mỗi nhóm Micro-task**, AI bắt buộc tạo Contract bằng file vật lý, theo `CONTRACT_STRUCTURE_RULE.md`:

* **Vị trí:** `Design/ContractForAI/Core/month{M}/W{N}/<desc>_contract.md`
* **Contract phụ** (conflict/bug/schema): `Design/ContractForAI/Core/break_task/...`
* **Nội dung tối thiểu:** (1) Checklist Plan · (2) Risk Assessment · (3) Mô phỏng code (phác thảo).

> ⛔ **Sau khi tạo Contract → AI PHẢI NGỪNG SINH CODE VÀ IM LẶNG.** Chỉ khi user gõ **"Approve"** / **"Bắt đầu sinh code"** mới được đụng source.
> Nếu AI nhảy thẳng vào code khi chưa có Contract approved → vi phạm nghiêm trọng → dừng ngay.

---

## 🧱 STEP 3: LUẬT 200 DÒNG (ANTI-HALLUCINATION)

* Nghiêm cấm thêm/sửa/ghi đè **> 200 dòng trên 1 file / 1 lần**. Vượt ngưỡng → AI dễ quên `{}` hoặc ghi đè mất logic cũ.
* Giải pháp: tách file con, code từng nhánh ~100 dòng → test → mới mở dải mới.
* Ưu tiên **localized edits**, không rewrite cả file vô cớ.

---

## 🚧 STEP 4: STRICT ECOSYSTEM (CẤM TỰ Ý)

* **Cấm "import lậu":** không `npm install` lib nào ngoài `TechnicalStack.md`. Cần lib mới → xin approve rõ ràng.
* **Giữ nguyên types:** tôn trọng canonical types (`ReportProject`, `ReportSection`, `ReportIssue`). Đổi shape → cập nhật `.md` tương ứng.
* **Scope guard:** trước khi thêm gì, đối chiếu `ProductPRD.md` §6 Non-goals (no login / no realtime / no cloud / no AI ở Phase 1 / không "convert mọi định dạng"). Nghi ngờ → DỪNG, hỏi user.
* **Checker offline:** không gọi mạng trong Module Check.

---

## 🚀 STEP 5: PUSH PROTOCOL & ITERATE

Code xong mỗi nhóm task, qua 4 trạm gác rồi mới push:

1. **Lint/Typecheck/Build:** `npm run lint` + `typecheck` + `build` xanh (Vitest xanh nếu đụng Checker).
2. **Branch Guard:** đúng nhánh `feature/W<tuần>-<mô-tả>`. Cấm push thẳng `main`/`develop`.
3. **Commit Convention:** `<type>(<scope>): <mô tả>` (VD: `feat(check): them rule missing-references`).
4. **Push & report:** commit kèm `_contract.md`, báo lại bằng tiếng Việt nhánh nào đã push.

Sau push → **quay lại Step 2** cho nhóm tiếp theo, tới khi hết Task Brief tuần.

```
┌──────────────────────────────────────────────┐
│  Step 0: Nạp ngữ cảnh (đọc VibeCode + docs)  │
│  Step 1: Plan Micro-Tasks + Risk             │
│  ┌────────────────────────────────────────┐  │
│  │ Step 2: Contract → WAIT APPROVE ←─ lặp │  │
│  │ Step 3-4: Code (≤200 dòng, no import lậu)│ │
│  │ Step 5: Push → nhóm tiếp               │  │
│  └────────────────────────────────────────┘  │
│  Hết task → PR vào develop                   │
└──────────────────────────────────────────────┘
```

---

## 💡 GOLDEN RULES

1. **Single Source of Truth** — logic đổi → update `.md` tương ứng.
2. **No Brief — No Code** — phải có Task Brief + Contract approved.
3. **MVP-first** — bám sát PRD Non-goals, không phình tính năng.
4. **VibeCode or revert** — dùng AI không theo protocol = code rác, revert.
