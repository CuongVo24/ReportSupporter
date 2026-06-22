# 📜 WORKFLOW — ReportSupporter Solo Agile-AI (V1.0)

> Quy trình vận hành cho dự án **1 người + AI agent**. Rút gọn từ mô hình team nhưng giữ nguyên các "chốt gác" kỷ luật.
>
> **⛔ NGUYÊN TẮC THÉP: NO BRIEF — NO CODE.** Không có Task Brief + Contract được approve → không gõ code thật.

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

## 🔴 GIAI ĐOẠN 4: GIT FLOW & SELF QUALITY GATE

Branching: `feature/W<n>-<desc>` → PR vào `develop` → (self-QC) → `main`.

### Self Quality Gate — checklist **3S** (thay cho Buddy Review của team)

Trước khi merge, tự kiểm:

* **Structure:** đúng `Coding & Git Standard.md`? Naming/typing chuẩn? Không vượt 200 dòng/file?
* **Scope:** khớp 100% Task Brief? **Không vượt `ProductPRD.md` §6 Non-goals?**
* **Safety:** `lint` + `typecheck` + `build` xanh? Vitest xanh (nếu đụng Checker)? Không lộ path/secret? Không network trong Checker?

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
