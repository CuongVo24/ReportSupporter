# 🎤 FLOW — Present (Module 5, Phase 3)

> **STATUS: ✅ SPEC (forward-looking).** Screen-level theo `_FlowSpecRule.md`. Logic ở `Modules/5.Present.md` — **NOT MVP** (Phase 3, W9–W10), baseline **deterministic, offline**; AI chỉ opt-in W11. File này dựng sẵn vỏ để Phase 3 không thiết kế lại. Giữ **cùng ngôn ngữ** với các panel khác — "không màn lạ" (§12.5).

## Bản đồ bước

```
[Sinh outline] → Outline + speaker/timeline → Script → Defense Q&A → Checklist nộp → Xuất slides
```

> Toàn bộ nối tiếp **tờ nộp** (chữ ký §12): báo cáo → bộ bảo vệ. Mỗi view sống trong rail phải (tab Present) hoặc full vùng làm việc, **không** phá khung AppShell.

---

### Màn 1 — Sinh slide outline

**0. Bố cục:** view trong tab Present; danh sách slide theo dòng chương mục báo cáo.
**1. Primary:** **Sinh outline** (deterministic từ `ReportSection[]`).
**2. Phụ:** sửa bullets, gộp/tách slide, **Sinh lại**.
**3. Trạng thái:**
| State | Khi nào | Hiển thị | Pattern |
| :--- | :--- | :--- | :--- |
| empty | chưa sinh | "Chưa có slide" + **Sinh outline** | `EmptyStates.md` |
| disabled | report chưa đủ nội dung (vd 0 section) | nút mờ + lý do "Báo cáo chưa có nội dung để dựng slide" | — |
| loading | đang sinh | skeleton danh sách slide | `LoadingSkeleton.md` |
| error | sinh lỗi | message + thử lại | `ErrorStates.md` |

**4. Copy:** "Chưa có slide" / "Sinh outline từ báo cáo để bắt đầu."; nút **Sinh outline**.
**5. Component:** Button, list slide (card), Badge (mapping section).
**6. Gate:** disabled khi báo cáo rỗng / thiếu heading.
**7. Chữ ký:** giữ đúng dòng chương mục (mapping về `fromSectionId`) — jump về section nguồn (#1).

---

### Màn 2 — Speaker assignment + timeline

**0. Bố cục:** outline + cột gán người nói; panel timeline tổng thời lượng.
**1. Primary:** none nổi — thao tác là gán/kéo; primary là **Lưu phân công** nếu cần.
**2. Phụ:** gán member (từ `metadata.members`), chỉnh `estimatedSeconds`.
**3. Trạng thái:**
| State | Hiển thị |
| :--- | :--- |
| empty (members) | thiếu members → 1 người mặc định, không crash (`5.Present.md` §6) |
| warning | tổng thời lượng vượt giới hạn → "Tổng {X} phút vượt giới hạn — cân nhắc cắt." |

**4. Copy:** cảnh báo timeline điềm tĩnh, không trách.
**5. Component:** Select/menu (gán speaker), timeline bar, Badge.
**6. Gate:** none.
**7. Chữ ký:** đồng hồ điềm tĩnh áp cho *thời lượng nói* (họ hàng với #3 deadline).

---

### Màn 3 — Script view

**0. Bố cục:** từng slide + kịch bản nói + cue evidence.
**1. Primary:** **Sinh script** (deterministic baseline).
**2. Phụ:** sửa script; (W11 opt-in) **Gợi ý bằng AI** — sau explicit action, không tự ghi đè.
**3. Trạng thái:** empty (chưa sinh) · loading · error; AI off mặc định (`5.Present.md` §6).
**4. Copy:** cue "Ở phần này, mở video demo/link deploy…".
**5. Component:** Textarea (sửa script), Button.
**6. Gate:** AI chỉ chạy sau explicit user action (Non-goal Phase 1).
**7. Chữ ký:** script tham chiếu evidence (vật chứng §12).

---

### Màn 4 — Defense Q&A

**0. Bố cục:** danh sách câu hỏi theo nhóm topic (scope/tech/result/limitation/future).
**1. Primary:** **Sinh câu hỏi**.
**2. Phụ:** sửa/ẩn câu hỏi.
**3. Trạng thái:** empty · loading · error.
**4. Copy:** câu hỏi bám nội dung section.
**5. Component:** list nhóm (Tabs/accordion), Button.
**6. Gate:** none.
**7. Chữ ký:** người soát mở rộng sang "soát phản biện".

---

### Màn 5 — Checklist nộp + Xuất slides

**0. Bố cục:** checklist cuối + panel export slides.
**1. Primary:** **Xuất slides** (PDF slides MVP-path; PPTX nếu `pptxgenjs` approve).
**2. Phụ:** tick checklist item.
**3. Trạng thái:**
| State | Hiển thị |
| :--- | :--- |
| disabled (PPTX) | chưa approve `pptxgenjs` → nút PPTX mờ "Cần bật Phase 3"; PDF slides vẫn chạy (`5.Present.md` §6) |
| job | tái dùng timeline export thật (#5) |

**4. Copy:** checklist "File đã xuất? Evidence đủ? Slide xong?".
**5. Component:** checklist (checkbox), Button, timeline (tái dùng Export #5).
**6. Gate:** PPTX disabled tới khi lib approve.
**7. Chữ ký:** tiến trình xuất thật (#5).

---

## 🎯 Điểm nhấn gu
- Cùng ngôn ngữ với Write/Export — không "màn lạ". Một primary mỗi view.
- Deterministic & offline trước; AI là lớp tuỳ chọn, người dùng giữ quyền kiểm soát.

## 📎 Cross-refs
- `Modules/5.Present.md` · `4.Layouts/AppShell.md` (rail/tabs) · `_FlowSpecRule.md` · `Other/SignatureInteractions.md` (#1, #5).
- `3.Patterns/*` · `2.Components/Tabs.md` / `Button.md` / `Textarea.md`.
