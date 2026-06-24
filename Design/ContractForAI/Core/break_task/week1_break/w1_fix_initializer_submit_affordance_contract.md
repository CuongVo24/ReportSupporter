# Contract For AI — W1 Break: Fix Init→Workspace Affordance (nút submit khuất, không rõ export ở đâu)

> **Lane:** Core / break_task / week1_break.
> **Branch:** `feature/W1-project-bootstrap` (hoặc `fix/w1-init-affordance`).
> **Type:** UX/affordance fix — review finding: ở màn **Khởi tạo Báo cáo**, người dùng "không thấy nút HTML/PDF/DOCX, không biết bấm đâu sau khi nhập".
> **Builds on:** Group B (`w1b_workspace_shell_contract.md` — app shell, vị trí panel/hành động), `ProjectInitializer` (xây ở W2 commit `103b5d8`) đang được Workspace gate khi `isInitializing`.
> **Sources:** `src/components/Workspace.tsx` (gate `isInitializing` → render `ProjectInitializer`; ExportPanel chỉ ở side panel workspace), `src/modules/write/ProjectInitializer.tsx` (nút `Khởi tạo báo cáo` cuối form).

---

## 1. Micro-task Target

Làm rõ luồng **Khởi tạo → Workspace** để người dùng biết phải bấm gì, và đưa nút hành động chính vào tầm nhìn.

**Root cause (2 tầng, không phải thiếu nút):**
1. **Nút export không ở màn này.** `ExportPanel` (HTML/PDF/DOCX) chỉ render trong side panel của **Workspace**, mà Workspace chỉ hiện sau khi `isInitializing = false` (`Workspace.tsx` — gate màn init rồi mới render `ExportPanel`). Đang ở bước khởi tạo nên chưa thể có nút export.
2. **Nút qua bước tiếp bị đẩy khuất.** `ProjectInitializer.tsx` có nút submit `Khởi tạo báo cáo` ở **cuối form**, dưới field "Thành viên nhóm". Form (card `maxWidth: 520px`, 7 field) cao hơn viewport → nút rơi **dưới fold**, người dùng không thấy, tưởng bế tắc.

**Fix:** đưa hành động chính `Khởi tạo báo cáo` vào tầm nhìn (sticky trong card) và thêm chỉ dẫn ngắn rằng **xuất bản (HTML/PDF/DOCX) là bước sau khi vào trình soạn thảo**.

## 2. Scope

### In scope
- `src/modules/write/ProjectInitializer.tsx`:
  - **Nút submit luôn thấy được.** Đặt `Khởi tạo báo cáo` trong một **footer sticky** bên trong card (vd `position: sticky; bottom: 0` + nền surface + viền trên), hoặc tách form thành vùng cuộn nội dung + footer cố định. Mục tiêu: với mọi chiều cao viewport, nút luôn nằm trong tầm nhìn.
  - **Chỉ dẫn bước sau.** Thêm một dòng helper gần nút (hoặc dưới subtitle): ví dụ *"Bấm Khởi tạo để mở trình soạn thảo — nút Xuất bản (HTML/PDF/Word) nằm trong trình soạn thảo."*
  - Giữ nguyên logic validate/submit (`handleSubmit`, `validateMetadata`, `onInitialize`).
- *(Tuỳ chọn nhỏ, nếu rẻ)* `src/components/Workspace.tsx`: không bắt buộc — chỉ xét nếu muốn nhãn rõ hơn cho khối Export trong side panel. Mặc định **out** để giữ patch nhỏ.

### Out of scope
- ❌ Logic field `textList` nuốt space/`,` (đó là `week2_break/w2_fix_metadata_textlist_input_clobber_contract.md`).
- ❌ Thiết kế lại toàn bộ layout shell / responsive đa breakpoint.
- ❌ Đổi `validateMetadata` / template / skeleton.
- ❌ Bất kỳ thay đổi module export (W4).

## 3. Checklist
- [ ] `ProjectInitializer`: nút `Khởi tạo báo cáo` sticky/luôn trong tầm nhìn ở mọi chiều cao viewport.
- [ ] Có dòng chỉ dẫn rằng Xuất bản là bước sau khi vào trình soạn thảo.
- [ ] Logic submit/validate **không đổi**.
- [ ] 4 gates xanh (lint / typecheck / test / build).

## 4. Expected Interfaces / Files

```tsx
// ProjectInitializer.tsx — không đổi props/handlers:
//   form: vùng nội dung cuộn + footer sticky chứa <button type="submit">Khởi tạo báo cáo</button>
//   thêm 1 dòng helper chỉ dẫn bước Xuất bản ở workspace.
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/write/ProjectInitializer.tsx` | MODIFY | ~+15 (sticky footer + hint) |

> **Import boundary** không đổi. Thuần UI/CSS-in-JS, offline, no `fetch`. Không đổi chữ ký `ProjectInitializer` props.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| Sticky footer che mất field cuối khi cuộn | Thấp | Chừa padding-bottom cho vùng nội dung bằng chiều cao footer. |
| Card quá thấp khiến sticky thừa | Thấp | Sticky chỉ kích hoạt khi nội dung vượt chiều cao; ngắn thì nút vẫn ở cuối tự nhiên. |
| Khó viết unit test cho "trong tầm nhìn" | Thấp | Affordance kiểm bằng manual; unit chỉ khẳng định nút submit + helper text render. |

## 6. Verification Plan
- Manual (npm run dev → màn Khởi tạo): điền đủ field; **không cuộn** vẫn thấy nút `Khởi tạo báo cáo`; bấm → vào trình soạn thảo, thấy panel Xuất bản (HTML/PDF/Word) ở side panel.
- Manual: thu nhỏ chiều cao cửa sổ → nút vẫn trong tầm nhìn (sticky).
- Unit (nhẹ): render `ProjectInitializer` → có `button[type=submit]` "Khởi tạo báo cáo" + dòng helper chỉ dẫn bước Xuất bản.
- lint / typecheck / test / build xanh.

## 7. Status

`PENDING` — chờ Approve.

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `fix(write): sticky init submit + clarify export-is-next affordance` + 1 docs commit (contract này).
