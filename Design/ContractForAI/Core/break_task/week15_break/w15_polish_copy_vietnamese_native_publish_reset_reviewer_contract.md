# Contract For AI — W15 Polish: Copy Trộn Anh–Việt & Chưa Tự Nhiên ("Xuất bản nộp", "Tạo report", "Người soát")

> **Lane:** Core / break_task / week15_break.
> **Branch:** `polish/w15-copy-vietnamese`.
> **Type:** Microcopy / i18n-consistency — finding **S1** (Low-Med, nhiều chuỗi trộn Anh–Việt hoặc gượng: "Xuất bản nộp", "Tạo report", "Bật AI trong cấu hình", "Người soát", "Chưa soát báo cáo…"). Gốc lỗi #16. Review toàn dự án (2026-06-26).
> **Builds on:** `Workspace.tsx`, `AiAssistBar.tsx`, CheckerPanel.
> **Sources:** Review 2026-06-26; `Frontend/Other/VoiceAndContent.md §7`; sản phẩm hướng sinh viên Việt → tránh trộn Anh–Việt.

---

## 1. Micro-task Target

Chuẩn hóa microcopy về tiếng Việt tự nhiên, nhất quán giọng `VoiceAndContent §7`. Gốc lỗi #16. **Chỉ đổi chữ hiển thị**, không đổi logic/biến/key.

- **S1 — Chuỗi cần sửa (hardcode trong JSX):**
  | Hiện tại | File:line | Gợi ý |
  |---|---|---|
  | "Xuất bản nộp" | [Workspace.tsx:211](src/components/Workspace.tsx#L211) | "Xuất bản để nộp" / "Xuất PDF" |
  | "Tạo report" | [Workspace.tsx:224](src/components/Workspace.tsx#L224), [:338](src/components/Workspace.tsx#L338) | "Tạo báo cáo" |
  | "Tạo report mới?" | [Workspace.tsx:328](src/components/Workspace.tsx#L328) | "Tạo báo cáo mới?" |
  | "Người soát" (tab) | [Workspace.tsx:239](src/components/Workspace.tsx#L239) | "Soát lỗi" / "Kiểm tra" |
  | "Bật AI trong cấu hình" | [AiAssistBar.tsx:120](src/modules/write/ai/AiAssistBar.tsx#L120) | "Bật AI trong Cài đặt" |
  | "Chưa soát báo cáo…" | CheckerPanel (empty state) | "Báo cáo chưa được soát lỗi" |

  **Fix:** đổi đúng các chuỗi trên cho thuần Việt + nhất quán thuật ngữ (thống nhất "báo cáo" thay vì "report"; "Cài đặt" thay vì "cấu hình"; "soát lỗi" cho chức năng review). Rà thêm chuỗi Anh–Việt còn sót bằng grep (`report`, `config`, `draft`…) trong JSX hiển thị. Không đổi `value`/key tab (chỉ đổi nhãn). Cập nhật `VoiceAndContent.md` nếu chốt thuật ngữ mới.

> 🔒 **Chỉ đổi chữ hiển thị.** Không đổi `TabsTrigger value`, không đổi biến/CanonicalTypes/i18n key.
> 🔒 **Giọng `VoiceAndContent §7`.**

## 2. Scope

### In scope
- **S1** [src/components/Workspace.tsx](src/components/Workspace.tsx), [src/modules/write/ai/AiAssistBar.tsx](src/modules/write/ai/AiAssistBar.tsx), CheckerPanel empty-state (MODIFY): đổi chuỗi; [VoiceAndContent.md](Design/Frontend/Other/VoiceAndContent.md) (MODIFY nếu chốt thuật ngữ).

### Out of scope
- ❌ Affordance/khung cụm AI (→ **w15_polish_ai_assist_bar_***).
- ❌ Đổi logic/route Cài đặt AI.

## 3. Checklist
- [ ] **S1** 6 chuỗi trên đổi thuần Việt; thuật ngữ nhất quán (báo cáo/Cài đặt/soát lỗi).
- [ ] `grep -nE "report|config|draft" src/**/*.tsx` (chuỗi hiển thị) không còn trộn Anh–Việt ngoài ý đồ.
- [ ] `TabsTrigger value` không đổi; chỉ nhãn.
- [ ] 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/Workspace.tsx` | MODIFY | nút/tab/dialog copy |
| `src/modules/write/ai/AiAssistBar.tsx` | MODIFY | "Cài đặt" |
| CheckerPanel (empty state) | MODIFY | "Báo cáo chưa được soát lỗi" |
| `Design/Frontend/Other/VoiceAndContent.md` | MODIFY (nếu cần) | chốt thuật ngữ |

> **Import boundary:** không lib mới. Offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Đổi nhầm `value` tab gãy state | Med | Chỉ đổi children nhãn, giữ `value="check"…`. |
| Test snapshot bắt chuỗi cũ | Low | Cập nhật test text nếu có assertion. |

## 6. Verification Plan
- UI: nút/tab/dialog hiển thị tiếng Việt thuần, nhất quán.
- Tabs vẫn chuyển đúng (value không đổi).
- 4 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit: `polish(copy): native Vietnamese labels (publish/reset/reviewer/settings)`.
