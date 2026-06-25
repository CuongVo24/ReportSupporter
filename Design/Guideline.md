# 📖 GUIDELINE — BẢN ĐỒ DỰ ÁN REPORTSUPPORTER

Chào mừng đến với **ReportSupporter**! Đây là "bản đồ" giúp bạn (hoặc AI Agent) định vị toàn bộ hệ thống tài liệu, quy trình và nhiệm vụ trong thư mục `Design`. Đọc theo đúng thứ tự dưới đây để nắm dự án trong ~10 phút.

---

## ⏱️ FIRST 10 MINUTES — ONBOARDING WALKTHROUGH

Nếu bạn (hoặc AI Agent) lần đầu vào dự án, làm đúng 6 bước này theo phút:

| Phút | Hành động | File / lệnh | Kết quả mong đợi |
|---|---|---|---|
| 0–1 | Đọc Quick Cheatsheet bên dưới | (ngay file này) | Biết ReportSupporter là gì, 5 module, stack chốt |
| 1–3 | Đọc giao thức điều khiển AI | `VibeCode.md` | Hiểu Step 0→5, Luật 200 dòng, Contract-first |
| 3–5 | Đọc bài toán + ranh giới | `ProductPRD.md` (kỹ **§6 Non-goals**) | Biết cái gì KHÔNG làm (no login/realtime/cloud/AI/convert-all) |
| 5–7 | Đọc stack khoá cứng | `Modules/Other/TechnicalStack.md` | Biết được dùng lib nào, cấm lib nào |
| 7–9 | Đọc luật + chuẩn code | `Conventions/Rule.md` · `Conventions/Coding & Git Standard.md` | Biết naming, typing, git flow, branch |
| 9–10 | Mở Task Brief tuần hiện tại | `TaskBrief/Core/month<X>/w<Y>.md` | Biết tuần này code gì → sẵn sàng plan |

> ✅ **Sau 10 phút bạn phải trả lời được 4 câu:** (1) Sản phẩm giải quyết gì? (2) 5 module là gì? (3) Stack gồm những gì, cấm gì? (4) Tuần này tôi làm Module nào?

---

## 📚 GLOSSARY — THUẬT NGỮ DỰ ÁN

| Term | Nghĩa trong ReportSupporter |
|---|---|
| **Workspace-first** | Route `/` đầu tiên là editor làm việc, KHÔNG phải landing/marketing page. |
| **5 Modules** | Write · Format · Check · Export · Present — xương sống sản phẩm. |
| **Markdown pipeline** | Chuỗi `unified`/`remark`/`rehype` biến Markdown → AST → HTML; dùng chung cho Format/Check/Export. |
| **AST (mdast/hast)** | Cây cú pháp Markdown (mdast) / HTML (hast). Checker đọc AST, không regex thô. |
| **Intermediate document model** | Chính là AST chung — mọi export ăn cùng nguồn để deterministic. |
| **Deterministic** | Cùng `Markdown + metadata` → luôn ra cùng output (preview, PDF, DOCX). |
| **ReportProject** | Type gốc: 1 dự án báo cáo (id, title, templateId, metadata, sections[], updatedAt). |
| **ReportSection** | 1 mục báo cáo (id, order, title, markdown, status: `draft`/`review`/`done`). |
| **ReportIssue** | 1 lỗi Checker phát hiện (severity, module, message, suggestion, sectionId?, line?). |
| **Checker (offline)** | Module 3 quét lỗi trước khi nộp — KHÔNG gọi mạng. |
| **Stub** | Bản giả/placeholder (VD: DOCX/export placeholder W1) để không kéo dependency nặng sớm. |
| **Contract** | File `_contract.md` AI tạo trước khi code, chờ "Approve" (xem `VibeCode.md`). |
| **Luật 200 dòng** | Cấm thêm/sửa > 200 dòng/file/lần để chống ảo giác AI. |
| **Non-goals** | 5 thứ KHÔNG làm ở MVP — `ProductPRD.md` §6. |
| **3S Quality Gate** | Self-review trước merge: Structure · Scope · Safety (`WorkFlow.md`). |
| **DoD** | Definition of Done — checklist task mới được tính "xong" (`WorkFlow.md`). |
| **Single Source of Truth** | Đổi logic ⇒ phải update file `.md` tương ứng; canonical types chỉ định nghĩa 1 lần. |

---

## 🌳 DECISION TREE — "I WANT TO DO X → READ FILE Y"

| Tôi muốn... | Đọc file |
|---|---|
| Hiểu cách điều khiển AI / mở phiên mới | `VibeCode.md` |
| Biết sản phẩm làm gì & KHÔNG làm gì | `ProductPRD.md` (§5 features, §6 Non-goals) |
| Biết được dùng / cấm lib nào | `Modules/Other/TechnicalStack.md` |
| Biết luật cho AI (typing, scope, boundaries) | `Conventions/Rule.md` |
| Biết naming / commit / branch / folder | `Conventions/Coding & Git Standard.md` |
| Biết quy trình tuần + self quality gate + DoD | `Conventions/WorkFlow.md` |
| Biết chiến lược test / fixtures / golden-file | `Conventions/TestStrategy.md` |
| Biết sanitize HTML / privacy / threat model | `Modules/Other/Security.md` |
| Biết cách build & host (deploy demo) | `Modules/Other/Deployment.md` |
| Tạo / sửa một Contract cho AI | `ContractForAI/CONTRACT_STRUCTURE_RULE.md` |
| **Dựng/sửa BẤT KỲ giao diện** (component, layout, màn) | `Frontend/README.md` → tầng tương ứng |
| Biết "đẹp" với dự án là gì / gu thị giác | `Frontend/0.ArtDirection.md` |
| Spec một component UI + đủ trạng thái | `Frontend/2.Components/<X>.md` (khuôn `_ComponentSpecRule.md`) |
| Xử lý màn rỗng / loading / lỗi / validate | `Frontend/3.Patterns/` |
| Giá trị token (màu/chữ/spacing/A4) | `Modules/Other/DesignSystem_Tokens.md` |
| Code **editor / preview / template / autosave** | `Modules/1.Write.md` |
| Code **numbering / TOC / layout A4** | `Modules/2.Format.md` |
| Code **checker engine / rules** | `Modules/3.Check.md` |
| Code **export HTML / PDF / DOCX** | `Modules/4.Export.md` |
| Code **slides / script (Phase 3)** | `Modules/5.Present.md` |
| Biết đang ở tuần nào trong 12 tuần | `RoadMap/MasterRoadMap.md` |
| Nhận nhiệm vụ tuần này | `TaskBrief/Core/month<X>/w<Y>.md` |
| Xem mẫu Contract bootstrap đã duyệt | `ContractForAI/Core/month1/W1/w1_project_bootstrap_contract.md` |

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
* **Stack chốt cứng:** Next.js + TypeScript · unified/remark pipeline · browser-print PDF first · `docx` · IndexedDB. Chi tiết: `Modules/Other/TechnicalStack.md`.
* **Tiến độ:** lộ trình **12 tuần** (`RoadMap/MasterRoadMap.md`). Phase 1 (W1–4) = MVP workspace.
* **Mô hình vận hành:** **Solo + AI Agent** — kỷ luật contract-first, không Buddy review nên tự review chặt.

---

## 🧭 CẤU TRÚC THƯ MỤC `Design/`

```text
Design/
  Guideline.md                         # ← bạn đang ở đây (bản đồ + onboarding + glossary)
  VibeCode.md                          # Giao thức điều khiển AI (Step 0–5, anti-hallucination)
  ProductPRD.md                        # Bài toán, target users, MVP goal §3, features §5, Non-goals §6
  Conventions/
    Rule.md                            # Luật cho AI: stack constraints, typing, boundaries, git protocol
    WorkFlow.md                        # Quy trình solo Agile-AI 4 giai đoạn + 3S gate + DoD
    Coding & Git Standard.md           # Naming, source structure, 200-line rule, commit, branch, PR review
    TestStrategy.md                    # Tầng test + fixtures + golden-file determinism
  Modules/
    1.Write.md                         # Spec Module 1 — editor, preview, template, autosave (IndexedDB)
    2.Format.md                        # Spec Module 2 — numbering, TOC, caption, A4 layout presets
    3.Check.md                         # Spec Module 3 — checker engine offline + danh sách rules
    4.Export.md                        # Spec Module 4 — HTML / PDF browser print / DOCX (docx)
    5.Present.md                        # Spec Module 5 — slide outline, script, Q&A (Phase 3)
    Support.Evidence.md                 # Supporting module — Evidence Kit
    Other/
      TechnicalStack.md                # Stack khoá cứng + rationale + version policy + data-flow
      Security.md                      # Threat model + sanitize HTML + privacy (IndexedDB)
      Deployment.md                    # Build / Next output mode / hosting demo (client-first)
      DesignSystem_Tokens.md           # Token canonical (màu/chữ/spacing/A4/severity) — Foundations của Frontend/
  Frontend/                            # ★ Discipline frontend (4 tầng) — đọc trước khi dựng UI
    README.md                          # Bản đồ tầng giao diện + cách dùng
    0.ArtDirection.md                  # La bàn thị giác: tính cách, gu, anti-patterns, frontend Non-goals
    1.Foundations/                     # Trỏ token canonical + Typography (pairing font)
    2.Components/                      # Spec component + ĐỦ trạng thái (_ComponentSpecRule.md là khuôn)
    3.Patterns/                        # empty / loading / error / validation / feedback
    4.Layouts/                         # AppShell · Responsive · InformationArchitecture
    5.Flows/                           # Wireframe-level theo module (Write/Export/Present)
    Other/                             # Motion · Accessibility · VoiceAndContent · Icons
  RoadMap/
    MasterRoadMap.md                   # Lộ trình 12 tuần; Phase 1 (W1–4) = MVP workspace
  TaskBrief/Core/
    month<X>/w<Y>.md                   # Nhiệm vụ theo tuần, lane Core (đọc khi nhận task)
  ContractForAI/
    CONTRACT_STRUCTURE_RULE.md         # Rule cấu trúc/đặt tên/nội dung Contract (đọc trước khi tạo)
    Core/
      month1/W1..W4/ ... month3/W12/   # Contract chính theo tuần (kèm code khi commit)
      break_task/                      # Contract phụ: conflict / bug / schema break
  Reports/
    Month<X>/W<N>/                     # Evidence: QA, build log, export mẫu (PDF/DOCX/HTML)
```

> 💡 Mỗi module ⇄ một thư mục source `src/modules/<module>` (xem `Modules/Other/TechnicalStack.md` §9 và `Coding & Git Standard.md` §2).

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
