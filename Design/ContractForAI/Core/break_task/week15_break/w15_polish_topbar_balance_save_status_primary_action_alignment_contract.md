# Contract For AI — W15 Polish: Header Chưa Cân — "Đã Lưu" Trôi Giữa, Nút Sát Mép, Hierarchy Mờ

> **Lane:** Core / break_task / week15_break.
> **Branch:** `polish/w15-topbar-balance`.
> **Type:** Layout-balance / hierarchy — finding **S1** (Low-Med, cụm giữa "Đã lưu" chỉ hiện khi đã lưu → 3 cụm `space-between` nhịp lệch, trạng thái không gắn trực quan với tài liệu), **S2** (Low, nút primary sát mép phải + brand/dropdown/status/nút chưa thành hierarchy rõ). Gốc lỗi #7 và phần alignment của #15. Review toàn dự án (2026-06-26).
> **Builds on:** Group A shell (`WorkspaceLayout.tsx`, `WorkspaceLayout.css`, `Workspace.tsx`).
> **Sources:** Review 2026-06-26.

---

## 1. Micro-task Target

Cân lại topbar để brand · tài liệu · trạng thái lưu · hành động chính có thứ bậc rõ và spacing đều. Gốc lỗi #7 + #15 (alignment). **Không** đổi chức năng nút/save.

- **S1 — Save-status trôi giữa, neo lỏng.** [WorkspaceLayout.tsx:140](src/components/WorkspaceLayout.tsx#L140) `.ws-topbar-center` đặt giữa; nội dung chỉ hiện khi `status==="saved"`/`saving` ([Workspace.tsx:191-203](src/components/Workspace.tsx#L191)). Khi rỗng, cụm giữa biến mất → nhịp `space-between` đổi, hai bên xô lệch. Trạng thái "Đã lưu" ở chính giữa màn không gắn với tài liệu/editor. **Fix:** neo save-status **cạnh report-switcher** (trái) hoặc sát nhãn tài liệu thay vì giữa màn; hoặc giữ chỗ cố định (reserve width) để không xô layout khi ẩn/hiện. Trạng thái nên đứng gần đối tượng nó mô tả (báo cáo).
- **S2 — Nút primary sát mép + hierarchy phẳng.** [WorkspaceLayout.css:13-25](src/components/WorkspaceLayout.css#L13) `.ws-topbar` padding `0 var(--rs-space-4)`; `.ws-topbar-right` ([:39-43](src/components/WorkspaceLayout.css#L39)) đặt nút primary `Xuất bản nộp` sát phải. Brand (lg/bold) + switcher + status + nút chưa phân tầng thị giác. **Fix:** tăng padding phải/đệm cho nút không dính mép; thiết lập hierarchy: brand nhẹ đi một bậc (hoặc thành logo), tài liệu-switcher là tiêu điểm trái, nút primary nổi bật phải; căn baseline các cụm. Token-only.

> 🔒 **Không đổi chức năng.** Save logic + `runExport` giữ nguyên; chỉ đổi vị trí/spacing/hierarchy.
> 🔒 **Token-only.** Spacing qua `--rs-space-*`.

## 2. Scope

### In scope
- **S1** [src/components/WorkspaceLayout.tsx](src/components/WorkspaceLayout.tsx) + CSS (MODIFY): neo save-status cạnh tài liệu / reserve chỗ.
- **S2** [src/components/WorkspaceLayout.css](src/components/WorkspaceLayout.css) (MODIFY): padding nút, hierarchy topbar.

### Out of scope
- ❌ Đổi copy nút "Xuất bản nộp" (→ **w15_polish_copy_***).
- ❌ Đổi behavior export/save.

## 3. Checklist
- [ ] **S1** ẩn/hiện save-status không xô layout; trạng thái đứng gần tài liệu.
- [ ] **S2** nút primary không sát mép; brand/switcher/status/nút có thứ bậc rõ; căn baseline.
- [ ] 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/WorkspaceLayout.tsx` | MODIFY | vị trí save-status |
| `src/components/WorkspaceLayout.css` | MODIFY | spacing/hierarchy topbar |

> **Import boundary:** không lib mới. Offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Reserve width làm topbar chật | Low | Dùng min-width nhỏ cho status; test trạng thái saving/saved/rỗng. |
| Đổi hierarchy lệch mobile | Low | Kiểm topbar ở <1024 (nút menu trái/phải vẫn đúng). |

## 6. Verification Plan
- Gõ để trigger saving→saved→rỗng: layout không giật; status gần tài liệu.
- Nút primary cách mép đều; các cụm căn hàng.
- 4 gate xanh (desktop + <1024).

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit: `polish(shell): balance topbar; anchor save status near document`.
