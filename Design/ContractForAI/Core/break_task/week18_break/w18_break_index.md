# W18 Break — Index Contract (Nâng UX Nền + Tính Năng Cờ-Đầu: Hội Đồng Phản Biện Ảo)

> **Lane:** Core / break_task / week18_break.
> **Branch (chung cả tuần):** `w18/upgrade-ai` — **toàn bộ contract W18 đi chung một nhánh duy nhất**, không tách nhánh con.
> **Nguồn:** Brainstorm nâng cấp trải nghiệm (session 2026-06-28). Hai khối: **(A) lớp UX nền** gồm 5 cải tiến đòn-bẩy-cao tái dùng tài sản sẵn có; **(B) tính năng độc bản thị trường** — *Hội đồng Phản biện Ảo (AI Mock Defense)* đóng vòng pipeline viết → soát → minh chứng → xuất → **bảo vệ**.
> **Cách viết:** theo format `week16_break`/`week17_break` (Lane/Branch/Type · Micro-task S-findings · Locked · Scope · Checklist · Files · Risks · Verification · Status). Khác ở chỗ **Branch dùng chung `w18/upgrade-ai`** cho mọi contract.

## Map đề xuất → contract

| # | Đề xuất | Contract |
|---|---|---|
| A1 | Command palette (Ctrl/⌘+K) gom mọi lệnh/phím tắt | `w18_feat_command_palette` |
| A2 | Kéo-thả sắp xếp mục lục + thả ảnh/file vào mục | `w18_feat_outline_dnd_reorder_drop_assets` |
| A3 | Chỉ số "Sức khỏe báo cáo" luôn hiện trên header | `w18_feat_report_health_indicator` |
| A4 | Snapshot/khôi phục bản trước (IndexedDB) | `w18_feat_snapshot_version_restore` |
| A5 | Focus/Zen mode + đếm chữ/thời lượng đọc | `w18_feat_focus_zen_mode` |
| B | Hội đồng Phản biện Ảo — AI Mock Defense (P1 text) | `w18_feat_ai_mock_defense` |

## Tài sản tái dùng (vì sao khả thi)

- **Phím tắt rải rác** đã có ([Workspace.tsx:513-602](src/components/Workspace.tsx#L513)) → A1 chỉ gom + làm khám phá được.
- **`moveSection` + SectionNav** (W16) → A2 thêm lớp kéo-thả lên trên.
- **`readinessScore`/checker + `weak-sections` + `evidence`** → A3 gộp thành 1 chỉ số.
- **Persistence `idb-client` + `autosave`** ([autosave.ts](src/modules/write/autosave.ts), [lib/idb-client.ts](src/lib/idb-client.ts)) → A4 thêm snapshot.
- **EditorPanel** → A5 thêm chế độ tập trung.
- **`generate-qa` + `speakers` + `timeline` + `weak-sections` + AI gateway** ([ai-gateway.ts](src/modules/write/ai/ai-gateway.ts)) → B ghép thành buổi phản biện đối kháng grounded theo báo cáo.

## Thứ tự đề xuất (rủi ro thấp & nền trước → cờ-đầu sau)

1. `w18_feat_command_palette` — A1 (gần như free, mở khóa khám phá).
2. `w18_feat_report_health_indicator` — A3 (gộp tín hiệu có sẵn).
3. `w18_feat_focus_zen_mode` — A5 (UI thuần, độc lập).
4. `w18_feat_snapshot_version_restore` — A4 (chạm persistence, cần test kỹ).
5. `w18_feat_outline_dnd_reorder_drop_assets` — A2 (đánh giá lib kéo-thả).
6. `w18_feat_ai_mock_defense` — B (**phụ thuộc** AI gateway W16; tính năng cờ-đầu, làm sau khi nền ổn).

## Locked dùng chung mọi contract
- 🔒 **Một nhánh duy nhất `w18/upgrade-ai`**; mỗi contract = 1 commit logic riêng (không nhánh con).
- 🔒 **Privacy-first cho luồng không-AI giữ nguyên.** A1–A5 chạy hoàn toàn local/offline. Chỉ **B** dùng mạng, và **chỉ sau opt-in AI tường minh** (qua route server giữ key — không gửi key xuống trình duyệt).
- 🔒 **Không phá `ReportSection`/`CanonicalTypes` public surface** trừ khi contract ghi rõ (vd type mới cho phiên Mock Defense — có chủ đích, khoanh trong contract B).
- 🔒 **Token-only / no-hex ngoài primitive**; microcopy theo `VoiceAndContent.md §7`; `--rs-report-*` bất biến (A4 trang trắng-đen).
- 🔒 **Chỉ thêm lib khi contract nêu rõ.** W18 cho phép tối đa: 1 lib kéo-thả a11y (A2, *nếu* Approve) và **không** lib AI SDK mới (B tái dùng gateway `fetch`).

## Cảnh báo phạm vi (đọc trước khi Approve)
- **B (Mock Defense)** cố ý là tính năng AI đối kháng — cần cập nhật `Design/` (Module Present + Privacy note) khi Approve. P1 (text) ưu tiên trước; P2 voice (Web Speech, cần mạng) và P3 lịch sử để pha sau, ghi trong contract B.
- **A2** có thể kéo theo lib kéo-thả: mặc định ưu tiên `moveSection` (nút) đã có; chỉ thêm lib nếu Approve nêu rõ.
- **A4** chạm tầng lưu trữ: phải tránh phình quota IndexedDB (giới hạn số snapshot + nén/cắt bớt).

> Tất cả contract đang `WAITING_FOR_APPROVAL`. VibeCode Step 2: chưa chạm `src/` cho tới khi Approve từng cái. Mọi commit đi trên `w18/upgrade-ai`.
