# Contract For AI — W15 Polish: Cụm AI Là Card Lớn Có Viền → Nên Là Thanh Toolbar Gọn

> **Lane:** Core / break_task / week15_break.
> **Branch:** `polish/w15-ai-bar-compact`.
> **Type:** Visual-weight / consistency — finding **S1** (Low-Med, `.ws-ai-assist-bar-container` là card `flex-column + padding-12 + border + radius + margin` bọc 1 hàng nút → box cao bất cân, nhìn như alert/panel riêng dù chức năng là toolbar), **S2** (Low, "Bật AI trong cấu hình" không rõ là link/cảnh báo/hướng dẫn). Gốc lỗi #8 (và phần #17 cho note AI). Review toàn dự án (2026-06-26).
> **Builds on:** Module 1 write AI (`AiAssistBar.tsx`, `globals.css`).
> **Sources:** Review 2026-06-26; `VoiceAndContent.md §7`.

---

## 1. Micro-task Target

Hạ "trọng lượng" cụm AI từ card xuống thanh công cụ gọn, và làm rõ trạng thái khi AI tắt. Gốc lỗi #8. **Không** đổi hành vi rewrite/tone/diff.

- **S1 — Card AI quá cao so với nội dung.** [globals.css:2390-2399](src/app/globals.css#L2390) `.ws-ai-assist-bar-container { flex-direction:column; padding:var(--rs-space-3); border:1px solid; border-radius:md; margin-bottom:… }` bọc đúng **một** `.ws-ai-assist-buttons-row` ([2401-2406](src/app/globals.css#L2401)). Render ([AiAssistBar.tsx:89-129](src/modules/write/ai/AiAssistBar.tsx#L89)) chỉ 2 nút + 1 note → box viền lớn thừa chiều cao, trông như panel cảnh báo. **Fix:** biến thành **thanh compact**: bỏ border/radius/padding lớn (hoặc padding mảnh), nền hòa toolbar, một hàng ngang; chỉ giữ chiều cao đủ nút. Khi có diff/control bar (`showControlBar`/`showDiff`) thì phần đó mới giãn — không để trạng thái rảnh cũng chiếm cao.
- **S2 — Note "Bật AI trong cấu hình" mơ hồ.** [AiAssistBar.tsx:118-122](src/modules/write/ai/AiAssistBar.tsx#L118) hiện `<span class="ws-ai-assist-note">⚠ Bật AI trong cấu hình</span>` khi `isDisabled`. Không rõ click được không. **Fix (chọn):** hoặc làm rõ là **link/nút** dẫn tới cấu hình ("Bật AI trong Cài đặt" + affordance click), hoặc **disable 2 nút AI + tooltip** giải thích vì sao tắt. Copy theo `VoiceAndContent §7` (xem thêm contract copy cho chữ "cấu hình"→"Cài đặt").

> 🔒 **Không đổi hành vi AI.** rewrite/tone/diff/undo giữ nguyên; chỉ đổi vỏ + rõ trạng thái.
> 🔒 **Token-only + giọng `VoiceAndContent §7`.**

## 2. Scope

### In scope
- **S1** [src/app/globals.css](src/app/globals.css) (MODIFY): `.ws-ai-assist-bar-container` card → thanh compact.
- **S2** [src/modules/write/ai/AiAssistBar.tsx](src/modules/write/ai/AiAssistBar.tsx) (MODIFY): note → link/nút rõ hoặc tooltip; (copy chữ tách ở contract copy).

### Out of scope
- ❌ Wiring "Cài đặt AI" thực (chỉ affordance/điều hướng nếu đã có route).
- ❌ Toolbar editor contrast (→ **w15_fix_editor_surface_***).
- ❌ Dedup container (→ **w15_polish_duplicate_dead_css_***).

## 3. Checklist
- [ ] **S1** cụm AI là thanh gọn, không còn box viền cao; trạng thái rảnh chiếm tối thiểu.
- [ ] **S2** khi AI tắt: rõ ràng (link tới Cài đặt **hoặc** nút disabled + tooltip).
- [ ] Diff/control bar vẫn hiện đúng khi có tương tác AI.
- [ ] 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/app/globals.css` | MODIFY | ai-bar compact |
| `src/modules/write/ai/AiAssistBar.tsx` | MODIFY | note → affordance rõ |

> **Import boundary:** không lib mới. Offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Bỏ khung làm AI bar lẫn vào editor | Low | Giữ ranh giới bằng nền/spacing thay vì border đậm. |
| Disable nút làm mất lối bật AI | Med | Nếu disable thì tooltip + link Cài đặt rõ. |

## 6. Verification Plan
- AI tắt: thanh gọn, có lối hiểu cách bật.
- AI bật (mock state): 2 nút hoạt động, diff hiện khi rewrite.
- 4 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit: `polish(write): AI assist becomes compact toolbar, clearer disabled state`.
