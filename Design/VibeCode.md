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
| 8 | `Design/RoadMap/MasterRoadMap.md` | Lộ trình 12 tuần lõi + Phase 4 (W13–W15) — biết đang ở đâu |

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

> 📌 **Lưu ý thứ tự đọc:** Bảng Step 0 này là **nguồn chuẩn duy nhất** cho reading order. Bảng "THỨ TỰ ĐỌC LOGIC" trong `Design/Guideline.md` phải đồng nhất với bảng này — nếu lệch, ưu tiên VibeCode.

### 🧰 PROMPT TEMPLATE LIBRARY (copy-paste cho phiên mới)

Dùng đúng template để AI nạp ngữ cảnh và không tự ý nhảy vào code. Prose tiếng Việt, mệnh lệnh tiếng Anh.

**(A) Mở phiên — nạp ngữ cảnh + plan (KHÔNG code):**
```text
READ in this order, then summarize back to me before doing anything:
1) Design/VibeCode.md  2) Design/Guideline.md  3) Design/ProductPRD.md
4) Design/Modules/Other/TechnicalStack.md  5) Design/Conventions/Rule.md
6) Design/Conventions/Coding & Git Standard.md  7) Design/Conventions/WorkFlow.md
Then read the current Task Brief at Design/TaskBrief/Core/month<X>/w<Y>.md.
DO NOT write code. Output: (a) what the week's goal is, (b) a Micro-task plan, (c) a Risk list.
```

**(B) Trước một nhóm micro-task — yêu cầu Contract:**
```text
For Micro-task group "<tên nhóm>", create a Contract file at
Design/ContractForAI/Core/month<M>/W<N>/<desc>_contract.md following
Design/ContractForAI/CONTRACT_STRUCTURE_RULE.md.
Then STOP and WAIT FOR APPROVE. Do not touch src/.
```

**(C) Approve — bắt đầu sinh code:**
```text
Approve. Generate code matching the Contract 100%.
Hard limits: ≤200 lines per file per edit, no library outside TechnicalStack.md,
no any (use unknown + zod at I/O), keep ReportProject/ReportSection/ReportIssue shapes.
```

**(D) Khi nghi ngờ chạm Non-goals:**
```text
Before adding this, check ProductPRD.md §6 Non-goals (no login / no realtime /
no cloud / no AI writing in Phase 1 / no "convert every format"). If it drifts
toward any of those, STOP and ask me — do not implement.
```

**(E) Self-review trước push:**
```text
Run the 3S self gate (Structure / Scope / Safety) from WorkFlow.md against this diff.
Report lint/typecheck/build status, branch name, and the commit message you will use.
```

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

## 🧪 WORKED EXAMPLE — MỘT VÒNG MICRO-TASK ĐẦY ĐỦ

Ví dụ cụ thể minh hoạ trọn 1 chu trình cho micro-task **"TOC generator"** (thuộc Module 2 — Format). Đây là khuôn mẫu để AI bắt chước.

### (1) Plan output (Step 1) — AI trả về, CHƯA code

```text
Micro-task group: "format/toc-generator"
File map:
  [NEW]    src/modules/format/toc.ts          (build TOC từ mdast headings)
  [NEW]    src/modules/format/toc.test.ts     (Vitest — KHÔNG, TOC không thuộc Checker; bỏ qua)
  [MODIFY] src/modules/format/index.ts        (export buildToc)
  [MODIFY] src/types/report.ts                (không đổi shape — chỉ import type)
Risk:
  - Heading bị skip cấp (h1 → h3) → TOC lệch. Mitigation: dùng số thứ tự logic, không dựa depth thô.
  - Vượt 200 dòng? Không — ước tính ~80 dòng. OK.
  - Đụng Non-goals? Không. Đụng lib ngoài stack? Không (chỉ unified mdast).
```

### (2) Contract skeleton (Step 2) — file vật lý, theo `CONTRACT_STRUCTURE_RULE.md`

```markdown
# Contract For AI - W3 TOC Generator

## 1. Micro-task Target
Sinh Table of Contents deterministic từ mdast headings của một ReportSection[].

## 2. Scope
In scope: parse headings (h1–h3), build numbered TOC nodes, return typed result.
Out of scope: rendering UI, PDF page numbers (W4), heading auto-numbering (tách task khác).

## 3. Checklist
- [ ] buildToc(sections: ReportSection[]): TocEntry[]
- [ ] Bỏ qua heading rỗng; giữ thứ tự theo section.order.
- [ ] Không regex thô — đọc mdast node type "heading".

## 4. Expected Interfaces
type TocEntry = { id: string; level: 1 | 2 | 3; text: string; sectionId: string };

## 5. Risks
| Risk | Level | Mitigation |
|---|---:|---|
| Skipped heading level | Medium | Normalize theo thứ tự xuất hiện, không theo depth thô. |

## 6. Verification Plan
- npm run typecheck + lint xanh. Build xanh. (Không Vitest — không thuộc Checker.)

## 7. Status
WAITING_FOR_APPROVAL
```

> ⛔ Sau khi xuất Contract này → **AI im lặng**, chờ "Approve".

### (3) Approve (Step 2) — user gõ

```text
Approve. Sinh code đúng Contract. ≤200 dòng, no any, không lib ngoài stack.
```

### (4) Sample 200-line split (Step 3) — khi logic dài

Nếu `buildToc` phình ra (parse + normalize + render-helpers > 200 dòng), AI **PHẢI tách**, không nhồi 1 file:

```text
ĐÚNG (tách theo nhánh, mỗi file < dải an toàn):
  src/modules/format/toc.ts            ~70 dòng  (orchestrator: gọi 2 hàm dưới)
  src/modules/format/toc-extract.ts    ~60 dòng  (mdast → raw heading list)
  src/modules/format/toc-normalize.ts  ~50 dòng  (đánh số 1 / 1.1 / 1.1.1)

SAI:
  src/modules/format/toc.ts            ~240 dòng  ← vượt 200, dễ ảo giác, ghi đè mất logic
```

### (5) Push (Step 5)

```text
git checkout feature/W3-format-toc      # đúng nhánh, không phải main/develop
npm run lint && npm run typecheck && npm run build   # 3 đèn xanh
git add src/modules/format/ Design/ContractForAI/Core/month1/W3/w3_toc_contract.md
git commit -m "feat(format): them TOC generator tu mdast headings"
git push origin feature/W3-format-toc
```
Báo lại tiếng Việt: *"Đã push nhánh `feature/W3-format-toc` kèm contract. Quay lại Step 2 cho nhóm caption tiếp theo."*

---

## 🚨 COMMON AI FAILURE MODES & HOW TO STOP THEM

Bảng các kiểu "ảo giác" thường gặp khi vận hành AI trên ReportSupporter và cách chặn ngay.

| # | Failure mode | Triệu chứng | Cách chặn (DO THIS) |
|---|---|---|---|
| 1 | **Import lậu** | AI tự `npm install react-pdf` / `tiptap` / `pandoc` | Reject ngay. Reply: *"Stack locked — see TechnicalStack.md. No new lib."* Chỉ Puppeteer/`docx`/`rehype-stringify` cho export. |
| 2 | **Scope creep về Non-goals** | Thêm login form, "sync to cloud", nút "AI viết hộ" | Chiếu `ProductPRD.md` §6. STOP & hỏi. Phase 1 không có 5 thứ này. |
| 3 | **Phá canonical type** | Đổi `ReportSection.status` thành string tự do, thêm field không khai báo | Giữ đúng `draft`/`review`/`done`. Đổi shape ⇒ phải update `.md` + Contract W1 trước. |
| 4 | **Code trước Contract** | AI sửa `src/` khi chưa có "Approve" | Vi phạm nghiêm trọng → revert. Yêu cầu tạo Contract rồi WAIT. |
| 5 | **Rewrite cả file** | Diff > 200 dòng, ghi đè cả file đang chạy | Bắt localized edit. Tách file con (xem worked example §4). |
| 6 | **Regex thô trong Checker** | Rule "missing references" dùng `str.match(/.../)` thay vì đọc AST | Checker đọc mdast/hast; regex chỉ cho text check (`TODO`, `lorem ipsum`). |
| 7 | **Network trong Checker** | Rule fetch URL để verify link sống | Checker MUST offline. Broken-image-path check = so path tĩnh, không gọi mạng. |
| 8 | **`any` để né lỗi type** | `as any`, `// @ts-ignore` rải rác | Cấm. Dùng `unknown` + `zod.parse()` ở ranh giới I/O (IndexedDB / template JSON / form). |
| 9 | **Non-deterministic export** | Cùng Markdown ra PDF/DOCX khác nhau mỗi lần | Format & Export deterministic từ `Markdown + metadata`. Không random id/timestamp trong pipeline render. |
| 10 | **Quên commit Contract** | Push code không kèm `_contract.md` | Commit luôn `_contract.md` của nhóm để lưu vết quyết định. |

---

## 💡 GOLDEN RULES

1. **Single Source of Truth** — logic đổi → update `.md` tương ứng.
2. **No Brief — No Code** — phải có Task Brief + Contract approved.
3. **MVP-first** — bám sát PRD Non-goals, không phình tính năng.
4. **VibeCode or revert** — dùng AI không theo protocol = code rác, revert.
