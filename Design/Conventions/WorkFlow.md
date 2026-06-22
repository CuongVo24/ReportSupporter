# 📜 WORKFLOW — ReportSupporter Solo Agile-AI (V1.0)

> Quy trình vận hành cho dự án **1 người + AI agent**. Rút gọn từ mô hình team nhưng giữ nguyên các "chốt gác" kỷ luật.
>
> **⛔ NGUYÊN TẮC THÉP: NO BRIEF — NO CODE.** Không có Task Brief + Contract được approve → không gõ code thật.

---

## 🗺️ END-TO-END FLOW (ASCII)

```text
  ┌────────────────────────────────────────────────────────────────────┐
  │ MONDAY  · SPRINT PLANNING                                           │
  │   MasterRoadMap → chọn Module tuần → rã Task (≤2 ngày/task)         │
  └───────────────────────────────┬────────────────────────────────────┘
                                  │
                                  ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │ PER TASK · TASK BRIEF                                               │
  │   TaskBrief/Core/month<X>/w<Y>.md  (Context · Logic Key · I/O)      │
  └───────────────────────────────┬────────────────────────────────────┘
                                  │
            ┌─────────────────────▼─────────────────────┐  AI EXECUTION LOOP
            │ Context load → Plan Micro-tasks + Risk     │  (lặp cho mỗi nhóm)
            │                                            │
            │   ┌──────────────────────────────────┐    │
            │   │ Contract → STOP & WAIT APPROVE   │◄───┼──── lặp nhóm
            │   │ Approve (3S self-review Contract) │    │
            │   │ Code (≤200 dòng, no import lậu)   │    │
            │   │ 3S Quality Gate → Push + contract │    │
            │   └──────────────────────────────────┘    │
            └─────────────────────┬─────────────────────┘
                                  │ hết nhóm micro-task của tuần
                                  ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │ END OF WEEK · GIT FLOW                                              │
  │   feature/W<n>-<desc> → PR vào develop → (self-QC) → main           │
  │   Definition of Done tích xanh → Task "Done"                       │
  └────────────────────────────────────────────────────────────────────┘
```

---

## 🟢 GIAI ĐOẠN 1: SPRINT PLANNING (đầu tuần)

* Đối soát `RoadMap/MasterRoadMap.md` → xác định Module mục tiêu của tuần.
* Phân rã thành các Task nhỏ (không Task nào quá ~2 ngày).
* Quyết định trước: tuần này đụng tới file/type nào, có cần lib nào (phải đã có trong `TechnicalStack.md`).

---

## 🟡 GIAI ĐOẠN 2: TASK BRIEF (đầu mỗi nhiệm vụ)

Cập nhật `TaskBrief/Core/month<X>/w<Y>.md` trước khi gọi AI. Mỗi brief gồm:

* **Context:** tính năng thuộc Module nào (Write / Format / Check / Export / Present)?
* **Logic Key:** các bước xử lý (VD: 1. Đọc Markdown → 2. Parse mdast → 3. Lấy heading → 4. Sinh TOC).
* **Móc nối code:** Input/Output là gì? Type nào (`ReportProject`...)? Lib nào trong stack?

---

## 🔵 GIAI ĐOẠN 3: AI EXECUTION LOOP (vòng lặp thực chiến)

> Tuân thủ `VibeCode.md`. Tóm tắt vòng lặp:

1. **Context Loading** — AI đọc đúng thứ tự (VibeCode Step 0).
2. **Planning** — phân rã Micro-tasks + Risk Assessment, liệt kê file `[NEW]`/`[MODIFY]`.
3. **Contract** — tạo `_contract.md` tại `ContractForAI/Core/month{M}/W{N}/` → **STOP & WAIT FOR APPROVE**.
4. **Approve** — bạn tự review Contract (logic, typing, naming, scope). OK → "Approve".
5. **Code** — chỉ sau approve; khớp 100% Contract; ≤200 dòng/file/lần; không import lậu.
6. **Push** — qua self quality gate (dưới) → commit kèm `_contract.md`.
7. **Iterate** — quay lại bước 3 cho nhóm micro-task kế tiếp.

```
Context → Plan → [ Contract → Approve → Code → Push ] (lặp) → PR
```

---

## 🗓️ WORKED EXAMPLE — MỘT TUẦN ĐIỂN HÌNH (W3 FORMAT)

Minh hoạ trọn vòng lặp một tuần để bám theo. Giả định tuần W3 = Module 2 (Format).

| Ngày | Hoạt động | Output cụ thể |
|---|---|---|
| **T2 (Mon)** | Sprint Planning | Đối soát RoadMap → tuần W3 làm Format. Rã 3 task: (1) heading numbering, (2) TOC generator, (3) figure/table caption. Nhánh: `feature/W3-format`. |
| **T2 chiều** | Task Brief #1 | Viết brief "heading numbering" vào `TaskBrief/Core/month1/w3.md`: Context=Format, Logic Key=parse mdast heading → đánh số 1/1.1/1.1.1, I/O=`ReportSection[] → ReportSection[]`. |
| **T3 (Tue)** | AI loop task #1 | Contract `w3_heading_numbering_contract.md` → Approve → code `src/modules/format/numbering.ts` (~90 dòng) → 3S gate xanh → commit `feat(format): them heading numbering` + contract. |
| **T4 (Wed)** | AI loop task #2 | Brief "TOC generator" → Contract → Approve → code tách 3 file con (toc / toc-extract / toc-normalize, mỗi file < 80 dòng) → push. |
| **T5 (Thu)** | AI loop task #3 | "Figure/table caption" → Contract → Approve → code → push. Gặp blocker (caption đụng numbering) → xem mục "BLOCKED? DO THIS". |
| **T6 (Fri)** | Đóng tuần | DoD tích xanh cho cả 3 task → PR `feature/W3-format` vào `develop` → self-QC tay trên preview → ghi evidence `Reports/Month1/W3/`. |

> 🔁 Mỗi ô "AI loop" lặp đúng `Context → Plan → Contract → Approve → Code → Push`. Một nhánh tuần duy nhất, không tạo nhánh mới mỗi task.

---

## 🔴 GIAI ĐOẠN 4: GIT FLOW & SELF QUALITY GATE

Branching: `feature/W<n>-<desc>` → PR vào `develop` → (self-QC) → `main`.

### Self Quality Gate — checklist **3S** (thay cho Buddy Review của team)

Trước khi merge, tự kiểm:

* **Structure:** đúng `Coding & Git Standard.md`? Naming/typing chuẩn? Không vượt 200 dòng/file?
* **Scope:** khớp 100% Task Brief? **Không vượt `ProductPRD.md` §6 Non-goals?**
* **Safety:** `lint` + `typecheck` + `build` xanh? Vitest xanh (nếu đụng Checker)? Không lộ path/secret? Không network trong Checker?

#### ✅ 3S — Full checklist (tích từng dòng trước khi push)

**Structure**
- [ ] Naming đúng convention (`PascalCase` type, `camelCase` fn, `kebab-case.ts` non-component).
- [ ] Không `any` / `as any` / `@ts-ignore` né lỗi; I/O qua `unknown` + `zod.parse()`.
- [ ] Canonical types (`ReportProject`/`ReportSection`/`ReportIssue`) giữ nguyên shape.
- [ ] Diff ≤ 200 dòng/file/lần; file dài đã tách con; localized edit, không rewrite vô cớ.
- [ ] Module chỉ import nhau qua `index.ts` public surface, không import nội bộ chéo.

**Scope**
- [ ] Khớp 100% Task Brief + Contract đã approve (không thêm tính năng ngoài).
- [ ] Đã chiếu `ProductPRD.md` §6 — không chạm login/realtime/cloud/AI-writing/convert-all.
- [ ] Không kéo lib ngoài `TechnicalStack.md`.
- [ ] Nếu đổi logic → đã update `.md` tương ứng (Single Source of Truth).

**Safety**
- [ ] `npm run lint` xanh.
- [ ] `npm run typecheck` xanh.
- [ ] `npm run build` xanh.
- [ ] `Vitest` xanh cho Checker rules (nếu đụng Module 3).
- [ ] Checker không gọi mạng; export không nuốt exception (visible & recoverable).
- [ ] Đúng nhánh `feature/W<n>-<desc>`, không phải `main`/`develop`.
- [ ] Format/Export deterministic (cùng input → cùng output).

---

## 🆘 BLOCKED? DO THIS

Khi kẹt (bug khó, type vỡ, conflict, nghi ngờ scope), KHÔNG tự ý phá kiến trúc — làm theo bậc thang:

| Tình huống | Hành động |
|---|---|
| **Nghi ngờ chạm Non-goals** | DỪNG ngay. Hỏi user. Không tự quyết mở scope. (Rule §6) |
| **Cần lib ngoài stack** | DỪNG. Xin approve + đề xuất update `TechnicalStack.md`. Không `npm install` lén. |
| **Type/schema vỡ (đụng canonical types)** | Tạo Contract phụ ở `ContractForAI/Core/break_task/...` mô tả thay đổi shape, chờ approve, rồi update cả `.md` liên quan. |
| **Bug Checker / sai AST** | Viết Vitest tái hiện bug trước, rồi mới sửa rule (regression-safe). |
| **Diff phình > 200 dòng** | DỪNG. Tách file con theo nhánh ~100 dòng (xem `VibeCode.md` §3 worked example). |
| **Git conflict khi merge develop** | Resolve localized, không rewrite cả file; chạy lại 3S gate trước khi push. |
| **Không chắc làm task nào** | Mở `RoadMap/MasterRoadMap.md` + Task Brief tuần; nếu vẫn mơ hồ → hỏi user. |

> 🧭 Quy tắc vàng khi blocked: **thà dừng và hỏi còn hơn đoán và phá kiến trúc.** Ghi blocker + hướng xử lý vào Contract (`Status: BLOCKED`).

---

## 🎯 DEFINITION OF DONE

Một Task chỉ "Done" khi **tất cả** tích xanh:

* [x] Code đã merge vào `develop`, không conflict.
* [x] `lint` / `typecheck` / `build` xanh (CI hoặc local).
* [x] Vitest xanh cho phần Checker rules bị ảnh hưởng.
* [x] Tính năng chạy đúng tay (UI/UX), khớp Task Brief, không bug nhảm.
* [x] Type/`.md` liên quan đã cập nhật (Single Source of Truth).
* [x] File `_contract.md` đã commit kèm code.
* [x] Evidence (nếu cần) ghi vào `Design/Reports/Month<X>/W<N>/`.

### 🔎 DoD — verifiable items (cách kiểm chứng từng dòng)

| Tiêu chí | Cách verify cụ thể |
|---|---|
| Merge sạch | `git merge develop` không báo conflict; PR hiển thị "able to merge". |
| Lint xanh | `npm run lint` → exit 0, không lỗi đỏ. |
| Typecheck xanh | `npm run typecheck` → 0 error. |
| Build xanh | `npm run build` → build success. |
| Checker test xanh | `npx vitest run src/modules/check` → all pass (nếu đụng Module 3). |
| Chạy đúng tay | Mở workspace local, thao tác đúng acceptance trong `Modules/<n>.*.md`. |
| Single Source of Truth | `git diff` cho thấy `.md` liên quan đã đổi cùng code khi logic đổi. |
| Contract committed | `git log --stat` cho thấy `_contract.md` trong cùng commit/nhánh. |
| Determinism (Format/Export) | Chạy export 2 lần cùng input → file output byte-identical (hoặc diff rỗng). |
| Evidence | File QA/build-log/export mẫu tồn tại trong `Design/Reports/Month<X>/W<N>/`. |
