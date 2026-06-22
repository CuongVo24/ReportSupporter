# 📖 GUIDELINE — BẢN ĐỒ DỰ ÁN REPORTSUPPORTER

Chào mừng đến với **ReportSupporter**! Đây là "bản đồ" giúp bạn (hoặc AI Agent) định vị toàn bộ hệ thống tài liệu, quy trình và nhiệm vụ trong thư mục `Design`. Đọc theo đúng thứ tự dưới đây để nắm dự án trong ~10 phút.

---

## 🌟 QUICK CHEATSHEET ("Chúng ta đang làm gì?")

* **Sứ mệnh:** Một **workspace chuyên dụng để viết, định dạng, kiểm tra và xuất báo cáo** học thuật / dự án — không phải site "convert mọi file".
* **Định danh:** Màn hình đầu tiên là **workspace editor**, KHÔNG phải landing page marketing.
* **5 Module:**
    1. **Write** — Markdown editor + preview + template + autosave.
    2. **Format** — numbering, TOC, layout A4 học thuật.
    3. **Check** — checker offline phát hiện thiếu mục / lỗi format trước khi nộp.
    4. **Export** — HTML / PDF / DOCX (DOCX & PDF deterministic).
    5. **Present** *(Phase 3)* — slide outline, script, Q&A.
* **Stack chốt cứng:** Next.js + TypeScript · unified/remark pipeline · Puppeteer (PDF) · `docx` · IndexedDB. Chi tiết: `Modules/Other/TechnicalStack.md`.
* **Tiến độ:** lộ trình **12 tuần** (`RoadMap/MasterRoadMap.md`). Phase 1 (W1–4) = MVP workspace.
* **Mô hình vận hành:** **Solo + AI Agent** — kỷ luật contract-first, không Buddy review nên tự review chặt.

---

## 🧭 CẤU TRÚC THƯ MỤC `Design/`

```text
Design/
  Guideline.md           # ← bạn đang ở đây (bản đồ)
  VibeCode.md            # Giao thức điều khiển AI (anti-hallucination)
  ProductPRD.md          # Bài toán, MVP goal, Non-goals
  Conventions/           # "Luật chơi": Rule · WorkFlow · Coding & Git Standard
  Modules/               # Linh hồn sản phẩm: 5 module + Other/TechnicalStack
  RoadMap/               # Lộ trình 12 tuần (MasterRoadMap)
  TaskBrief/Core/        # Nhiệm vụ theo tuần (lane Core)
  ContractForAI/Core/    # Hợp đồng code cho AI (theo CONTRACT_STRUCTURE_RULE)
  Reports/               # Evidence: QA, build log, export mẫu
```

---

## 🚦 THỨ TỰ ĐỌC LOGIC (STEP-BY-STEP)

> Thứ tự này **đồng nhất** với bảng Context Primer trong `VibeCode.md` Step 0.

### BƯỚC 0: Nếu bạn là AI Agent
Đọc **`VibeCode.md`** đầu tiên và tuân thủ toàn bộ giao thức trong đó.

### BƯỚC 1: Tầm nhìn sản phẩm
1. **`ProductPRD.md`** — hiểu bài toán: ReportSupporter giải quyết gì cho sinh viên/nhóm dự án? Đọc kỹ **§6 Non-goals**.
2. **`Modules/Other/TechnicalStack.md`** — "vũ khí" công nghệ đã khoá cứng.

### BƯỚC 2: Hệ thống Modules (5 module)
* **`Modules/1.Write.md`** · **`2.Format.md`** · **`3.Check.md`** · **`4.Export.md`** · **`5.Present.md`**

### BƯỚC 3: Quy chuẩn làm việc (Conventions)
1. **`Conventions/Rule.md`** — luật cho AI Agent.
2. **`Conventions/Coding & Git Standard.md`** — naming, structure, commit, branch.
3. **`Conventions/WorkFlow.md`** — quy trình solo Agile-AI + self quality gate + DoD.

### BƯỚC 4: Lộ trình & hành động
1. **`RoadMap/MasterRoadMap.md`** — kế hoạch 12 tuần.
2. **`TaskBrief/Core/month<X>/w<Y>.md`** — nhiệm vụ tuần hiện tại.
3. **`ContractForAI/CONTRACT_STRUCTURE_RULE.md`** — đọc trước khi tạo bất kỳ Contract nào.

---

## 💡 GOLDEN RULES (NGUYÊN TẮC THÉP)

1. **Single Source of Truth** — mọi thay đổi logic phải update vào file `.md` tương ứng.
2. **No Brief — No Code** — phải có Task Brief + Contract approved mới gõ code.
3. **MVP-first** — bám sát `ProductPRD.md` §6 Non-goals, không phình tính năng.
4. **VibeCode or revert** — dùng AI không theo `VibeCode.md` = code rác, revert.
