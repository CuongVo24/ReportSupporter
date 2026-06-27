# Contract For AI — W16 Decide/Spike: Chiến Lược Nối MCP / Connector Để Lấy Markdown Từ NotebookLM / Gemini / ChatGPT / Codex / Claude

> **Lane:** Core / break_task / week16_break.
> **Branch:** `docs/w16-mcp-decision` (chỉ `Design/`, **không** `src/`).
> **Type:** Decision record / spike — câu hỏi trực tiếp của user: *"có cách nào nối với MCP để nó lấy file markdown từ NotebookLM / Gemini / ChatGPT / agent như Codex, Claude không?"*. Gốc nỗi đau #8. Review 2026-06-27.
> **Builds on:** Bối cảnh kiến trúc — app **browser-only, offline-first**, lưu IndexedDB ([Workspace.tsx:48-65](src/components/Workspace.tsx#L48)), chưa có backend (chỉ vừa thêm route AI ở `w16_feat_ai_adapter_*`).
> **Sources:** Review 2026-06-27; `TechnicalStack.md`; `ProductPRD.md`.

---

## 1. Micro-task Target

**Chốt hướng** thay vì code vội. Đây là contract quyết định: phân tích 3 phương án, khuyến nghị, và định nghĩa "không làm gì trong `src/` ở tuần này".

### Bối cảnh kỹ thuật (vì sao MCP không hợp ngay)
- MCP là giao thức **agent ↔ tool**, chạy server/desktop (stdio hoặc HTTP/SSE). Trình duyệt khó làm **MCP client**: vướng CORS, không có stdio, và phải giữ secret ở client.
- Server **không ghi được vào IndexedDB** của trình duyệt người dùng → muốn agent "đẩy" báo cáo vào app thì buộc **dời storage lên server**, phá vỡ offline-first/privacy-first vốn là điểm bán hàng.
- **Quan trọng:** NotebookLM, ChatGPT, Gemini, Claude, Codex **đều đã xuất ra markdown**. Nhu cầu thật của user = *đưa markdown đó vào app dễ dàng*, **không** nhất thiết là đường ống MCP.

### Ba phương án
- **A. Import markdown xịn (KHUYẾN NGHỊ).** Không MCP. Giải 95% nhu cầu bằng `w16_feat_global_markdown_import_drop_paste` (thả/dán `.md`) + `w16_feat_ai_outline_*`. User copy/expor từ Claude/NotebookLM → thả vào → xong. Chi phí thấp, giữ offline.
- **B. MCP server thật (epic riêng).** App expose MCP server (route SSE) với tool `import_report_markdown`/`add_section` để agent đẩy thẳng vào. **Điều kiện:** phải có persistence server-side (rời IndexedDB) + auth + đồng bộ về browser. Đây là dự án lớn, ROI cần cân nhắc; **không** thuộc tuần 16.
- **C. Browser làm MCP client.** Không khả thi gọn (secret/CORS/transport) → **loại**.

> 🔒 **Contract này không chạm `src/`** — chỉ ghi quyết định vào `Design/`.
> 🔒 Khuyến nghị mặc định = **A**. **B** chỉ mở khi có quyết định dời storage server-side (ghi điều kiện rõ).

## 2. Scope

### In scope
- `Design/Decisions/MCP_Connector_Strategy.md` (NEW) hoặc append vào `ProductPRD.md`: ghi 3 phương án, khuyến nghị A, điều kiện kích hoạt B, lý do loại C.
- (Tùy chọn) phác thảo interface tool MCP cho B ở mức tài liệu (không code).

### Out of scope
- ❌ Bất kỳ thay đổi `src/` nào.
- ❌ Dựng MCP server (epic riêng nếu chọn B).
- ❌ Import markdown thực thi (đã thuộc `w16_feat_global_markdown_import_drop_paste`).

## 3. Checklist
- [ ] Tài liệu quyết định liệt kê A/B/C + đánh giá.
- [ ] Khuyến nghị A nêu rõ "giải 95% nhu cầu qua import".
- [ ] Điều kiện kích hoạt B (dời storage server-side, auth) ghi tường minh.
- [ ] Lý do loại C (CORS/secret/transport) ghi rõ.
- [ ] Không có thay đổi `src/`.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `Design/Decisions/MCP_Connector_Strategy.md` | NEW | decision record |
| `Design/ProductPRD.md` | MODIFY (tùy) | link tới quyết định |

> **Import boundary:** docs-only. Không lib, không `src/`.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Kỳ vọng "có MCP ngay" | Med | Nêu rõ A giải gần hết nhu cầu; B là epic có điều kiện. |
| Chọn B phá offline/privacy âm thầm | High | B chỉ mở sau quyết định kiến trúc tường minh + cập nhật PRD. |

## 6. Verification Plan
- Đọc tài liệu: người mới hiểu vì sao chọn import-first và khi nào mới làm MCP.
- Xác nhận không có diff trong `src/`.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: contract docs-only — không chạm `src/`. Commit: `docs(design): MCP/connector ingestion strategy — import-first, MCP as conditional epic`.
