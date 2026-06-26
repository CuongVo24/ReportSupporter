# Contract For AI — W15 Polish: Quá Tải IA (4 Cột + 5 Tab Cùng Lúc) & Sidebar Mục Lục Khó Đọc

> **Lane:** Core / break_task / week15_break.
> **Branch:** `polish/w15-ia-workflow`.
> **Type:** Information-architecture / legibility — finding **S1** (Med, mọi chức năng hiện cùng lúc: 4 cột + panel phải nhồi **5 tab** Người soát/Xuất bản/Nộp bài/Minh chứng/Slide → quá tải, workflow không rõ thứ tự), **S2** (Low-Med, sidebar "Mục lục" khi hẹp chỉ còn vòng tròn, tên mục bị cắt, active chỉ vạch xanh, không tooltip khi thu gọn). Gốc lỗi #19 và #6. Review toàn dự án (2026-06-26).
> **Builds on:** `Workspace.tsx` (5 tab), `SectionNav.tsx`, `WorkspaceLayout.tsx` (collapsed rail).
> **Sources:** Review 2026-06-26; workflow đề xuất: Viết → Kiểm tra/AI → Xem trước → Xuất bản.

---

## 1. Micro-task Target

Giảm tải nhận thức: gom 5 tab theo workflow + làm sidebar thu gọn vẫn đọc/hover được. Gốc lỗi #19 (IA) và #6 (sidebar). **Không** bỏ chức năng nào, chỉ tổ chức lại + bổ sung affordance.

- **S1 — 5 tab + 4 cột cùng hiện.** [Workspace.tsx:226-245](src/components/Workspace.tsx#L226) panel phải có 5 `TabsTrigger`: Người soát · Xuất bản · Nộp bài · Minh chứng · Slide — tất cả ngang hàng, không phản ánh trình tự dùng. **Fix (không bỏ tính năng):** nhóm theo giai đoạn workflow (vd: *Soạn* → *Kiểm tra* (soát + minh chứng) → *Xuất bản* (xuất + nộp) → *Trình bày* (slide)), hoặc gom thành ít nhóm chính + sub-tab; làm rõ bước hiện tại. Tối thiểu: sắp xếp lại thứ tự tab theo luồng + nhãn nhóm. Phối với contract drawer (1024–1439 assistant thành drawer) để 4 cột không cùng đua.
- **S2 — Sidebar thu gọn mất thông tin.** Khi `isLeftCollapsed`, rail chỉ hiện số + chấm trạng thái ([WorkspaceLayout.tsx:159-171](src/components/WorkspaceLayout.tsx#L159)); bản mở `SectionNav` có tên mục + Badge ([SectionNav.tsx:37-55](src/components/SectionNav.tsx#L37)) nhưng dễ bị cắt và (do flex-shrink, contract riêng) bị nén. Active chỉ `border-left:3px`. Thiếu **tooltip** khi thu gọn. **Fix:** rail thu gọn thêm `title`/tooltip tên mục (đã có `title={sec.title}` ở [:165](src/components/WorkspaceLayout.tsx#L165) cho item — bổ sung cho nhất quán + visible focus); bản mở bảo đảm 2 trạng thái rõ "thu gọn (icon) / mở rộng (1. Giới thiệu, 2. Thành viên…)"; active rõ hơn vạch (nền + đậm). Đánh số mục để khớp heading numbering.

> 🔒 **Không bỏ chức năng.** 5 mảng (soát/xuất/nộp/minh chứng/slide) vẫn truy cập được; chỉ tổ chức lại.
> 🔒 **Token-only.** Không hex/px thô mới.

## 2. Scope

### In scope
- **S1** [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY): nhóm/sắp xếp tab theo workflow + nhãn bước.
- **S2** [src/components/SectionNav.tsx](src/components/SectionNav.tsx) + [src/components/WorkspaceLayout.tsx](src/components/WorkspaceLayout.tsx) + CSS (MODIFY): tooltip thu gọn, active rõ, số mục.

### Out of scope
- ❌ flex-shrink sidebar (→ **w15_fix_side_column_flexshrink_***) — nguyên nhân nén.
- ❌ Drawer tier (→ **w15_fix_responsive_breakpoint_tiers_***).
- ❌ Viết lại module chức năng.

## 3. Checklist
- [ ] **S1** tab sắp theo luồng Viết→Kiểm tra→Xuất bản→Trình bày (hoặc nhóm); bước hiện tại rõ; không mất tính năng.
- [ ] **S2** rail thu gọn có tooltip tên mục + focus rõ; bản mở hiện "n. Tên mục"; active rõ hơn vạch.
- [ ] 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/Workspace.tsx` | MODIFY | nhóm/sắp xếp 5 tab |
| `src/components/SectionNav.tsx` | MODIFY | số mục, active rõ, tooltip |
| `src/components/WorkspaceLayout.tsx` | MODIFY | rail thu gọn tooltip/focus |
| `src/components/WorkspaceLayout.css` | MODIFY | style active/số mục |

> **Import boundary:** không lib mới. Offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Nhóm tab giấu mất chức năng | Med | Mọi mảng vẫn ≤2 click; kiểm từng tab. |
| Đổi `TabsTrigger value` gãy state | Med | Giữ `value`, chỉ đổi nhóm/nhãn/thứ tự. |
| Số mục lệch heading number | Low | Dùng cùng nguồn thứ tự section. |

## 6. Verification Plan
- Panel phải: thứ tự tab theo luồng; mọi mảng vẫn mở được.
- Sidebar: thu gọn hover ra tên mục; mở rộng hiện "1. …/2. …"; active rõ.
- 4 gate xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Làm **sau** flex-shrink + drawer tier. Commit: `polish(ia): order panels by workflow`; `polish(nav): numbered sections, collapsed tooltips, clearer active`.
