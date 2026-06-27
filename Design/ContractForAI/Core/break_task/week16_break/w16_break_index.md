# W16 Break — Index Contract (Nâng Trải Nghiệm: Nhập Liệu Nhanh + Section Linh Hoạt + Nối AI Thật)

> **Lane:** Core / break_task / week16_break.
> **Nguồn:** Review UX toàn dự án (session 2026-06-27) — người dùng làm báo cáo nhanh bị 3 nỗi đau gốc: (a) **bắt buộc gõ tay vào form template** mới vào được editor, (b) **section cứng** — không add/sửa/xóa/sắp xếp, (c) **AI dựng sẵn nhưng không bật được** (không có Cài đặt, không adapter, cờ mặc định OFF) → 2 nút AI luôn disabled. Cộng thêm 2 câu hỏi trực tiếp: *"nối API để xài AI kiểu gì"* và *"nối MCP để lấy markdown từ NotebookLM/Gemini/ChatGPT/Codex/Claude được không"*.
> **Cách viết:** theo format `week15_break` (Lane/Branch/Type · Micro-task S-findings · Locked · Scope · Checklist · Files · Risks · Verification · Status=`WAITING_FOR_APPROVAL`).

## Map nỗi đau review → contract

| # Nỗi đau (review) | Contract |
|---|---|
| 1 Không bật/nối được AI từ UI (không có Cài đặt) | `w16_feat_ai_settings_panel_enable_provider_key` |
| 2 "Nối API kiểu gì" — chưa có adapter + đường mạng an toàn | `w16_feat_ai_adapter_server_route_register` |
| 3 Phải gõ tay, không thả/dán được file markdown vào | `w16_feat_global_markdown_import_drop_paste` |
| 4 Bắt buộc qua form template mới vào editor | `w16_feat_quickstart_blank_skip_template_form` |
| 5 Section cứng — không add/sửa/xóa/sắp xếp | `w16_feat_section_crud_reorder_nav` |
| 6 Không có AI sinh dàn ý (thay cho điền form) | `w16_feat_ai_outline_generate_outline` |
| 7 AI chỉ theo từng đoạn — thiếu mức toàn báo cáo + dịch/chuẩn thuật ngữ | `w16_feat_ai_whole_report_scope_translate_action` |
| 8 "Nối MCP lấy markdown từ NotebookLM/Gemini/ChatGPT/Codex/Claude" | `w16_decide_mcp_connector_ingestion_strategy` |

## Thứ tự đề xuất (đòn bẩy cao → thấp, rủi ro thấp trước)

1. `w16_feat_global_markdown_import_drop_paste` — #3 (rẻ nhất, đập tan nỗi đau "phải gõ tay"; tái dùng `importReadme` đã có).
2. `w16_feat_quickstart_blank_skip_template_form` — #4 (mở lối vào nhanh; ăn theo import ở trên).
3. `w16_feat_section_crud_reorder_nav` — #5 (làm cấu trúc "mềm").
4. `w16_feat_ai_settings_panel_enable_provider_key` — #1 (mảnh còn thiếu để toàn bộ module AI sống dậy; chỉ config, chưa mạng).
5. `w16_feat_ai_adapter_server_route_register` — #2 (adapter thật + route server giữ key; **phụ thuộc** #4).
6. `w16_feat_ai_outline_generate_outline` — #6 (**phụ thuộc** #5).
7. `w16_feat_ai_whole_report_scope_translate_action` — #7 (**phụ thuộc** #5).
8. `w16_decide_mcp_connector_ingestion_strategy` — #8 (contract **quyết định/spike**, không động `src/`; chốt hướng trước khi cân nhắc epic MCP riêng).

## Locked dùng chung mọi contract
- 🔒 **Privacy-first không phá vỡ cho luồng không-AI.** Báo cáo vẫn lưu IndexedDB, offline. Chỉ khi user **chủ động bật AI** mới có request mạng.
- 🔒 **Không key/secret trong code và không gửi key xuống trình duyệt.** Key đi qua route server-side (xem `w16_feat_ai_adapter_server_route_register`).
- 🔒 **Provider-agnostic giữ nguyên.** Mọi adapter phải thỏa interface `AiAdapter` ([ai-gateway.ts:29](src/modules/write/ai/ai-gateway.ts#L29)); gateway/types không đổi public surface trừ khi contract ghi rõ (mở rộng `AiConfig`/`AiAction` là có chủ đích, ghi trong contract tương ứng).
- 🔒 **Token-only / no-hex ngoài primitive**; giọng microcopy theo `VoiceAndContent.md §7`.
- 🔒 **Không lib AI SDK mới** — adapter gọi REST của provider bằng `fetch` từ route server (ưu tiên), không bundle SDK. Lib khác: không thêm trừ khi contract nêu (vd thư viện kéo-thả cho section — đánh giá trong contract đó).
- 🔒 `--rs-report-*` bất biến — tờ A4 luôn trắng-đen.

## Cảnh báo phạm vi (đọc trước khi Approve)
- Nhóm AI (#1,#2,#6,#7) **cố ý phá** ràng buộc "offline tuyệt đối" của các tuần trước — nhưng **chỉ sau opt-in tường minh**. Cần cập nhật `Design/` (PRD/Privacy note) khi Approve nhóm này.
- #8 MCP: kết luận sơ bộ trong contract là **không** biến browser app thành MCP client (vướng CORS/secret/transport + phá offline). Hướng khuyến nghị = import markdown xịn (#3) đã giải 95% nhu cầu; MCP thật là epic riêng cần dời storage lên server.

> Tất cả contract đang `WAITING_FOR_APPROVAL`. VibeCode Step 2: chưa chạm `src/` cho tới khi Approve từng cái.
