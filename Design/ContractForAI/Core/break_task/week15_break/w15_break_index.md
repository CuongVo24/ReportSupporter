# W15 Break — Index 15 Contract (Review Toàn Dự Án Sau 15 Tuần)

> **Lane:** Core / break_task / week15_break.
> **Nguồn:** Review UI toàn dự án trên ảnh hiện trạng 1366×768 (session 2026-06-26) — 20 lỗi user nêu, gom về 8 nguyên nhân gốc, tách thành **15 contract độc lập** (8 `fix` lỗi vỡ + 7 `polish` drift) để chia nhỏ việc, áp cho **cả dự án** (không bó tuần 15).
> **Cách viết:** theo format `week14_break` (Lane/Branch/Type · Micro-task S-findings · Locked · Scope · Checklist · Files · Risks · Verification · Status=`WAITING_FOR_APPROVAL`).

## Map 20 lỗi → contract

| # Lỗi (review) | Contract |
|---|---|
| 1 Layout vỡ ngang | `w15_fix_side_column_flexshrink_panel_crush` (+ responsive tiers) |
| 2 Quá nhiều scrollbar / scroll ngang | `w15_fix_shell_100vw_horizontal_scroll_nested_overflow` |
| 3 Panel phải sai kích thước | `w15_fix_side_column_flexshrink_panel_crush` |
| 4 Preview khối tối trên giấy trắng | `w15_fix_preview_content_paper_tokens_dark_block_on_sheet` |
| 5 Scale preview quá nhỏ | `w15_fix_preview_zoom_control_scale_strategy_readable_typography` |
| 6 Sidebar mục lục khó đọc | `w15_polish_ia_workflow_overload_sidebar_legibility` |
| 7 Header chưa cân | `w15_polish_topbar_balance_save_status_primary_action_alignment` |
| 8 Box AI cao/xấu | `w15_polish_ai_assist_bar_card_to_compact_toolbar` |
| 9 Toolbar editor mờ | `w15_fix_editor_surface_toolbar_contrast_insert_state_cm_theme` |
| 10 Lỗi thị giác editor (viền/gutter) | `w15_polish_duplicate_dead_css_double_editor_container_border` (viền) + `w15_fix_editor_surface_*` (gutter) |
| 11 "#" thành "2 …" | `w15_fix_heading_autonumber_editor_hint_preview_scope_label` |
| 12 Typography preview nhỏ | `w15_fix_preview_zoom_control_*` |
| 13 Phân cấp màu yếu | `w15_fix_os_darkmode_autoflip_governance_color_hierarchy` |
| 14 Quá nhiều border | `w15_polish_duplicate_dead_css_double_editor_container_border` |
| 15 Spacing/alignment | `w15_polish_topbar_balance_*` |
| 16 Copy Anh–Việt | `w15_polish_copy_vietnamese_native_publish_reset_reviewer` |
| 17 Active/disabled không rõ | `w15_polish_state_token_consistency_active_disabled_warning` |
| 18 Accessibility | `w15_polish_accessibility_min_font_contrast_not_color_only` |
| 19 Luồng sử dụng chưa rõ | `w15_polish_ia_workflow_overload_sidebar_legibility` |
| 20 Responsive tổng | `w15_fix_responsive_breakpoint_tiers_assistant_drawer` |

## Thứ tự đề xuất (đòn bẩy cao → thấp, rủi ro thấp trước)

1. `w15_fix_side_column_flexshrink_panel_crush` — #1,#3 (sửa 1 chỗ, hết panel nát)
2. `w15_fix_shell_100vw_horizontal_scroll_nested_overflow` — #2
3. `w15_fix_os_darkmode_autoflip_governance_color_hierarchy` — #13 (xác định theme trước, làm #4/#9 dễ kiểm)
4. `w15_fix_preview_content_paper_tokens_dark_block_on_sheet` — #4
5. `w15_fix_preview_zoom_control_scale_strategy_readable_typography` — #5,#12
6. `w15_fix_responsive_breakpoint_tiers_assistant_drawer` — #20
7. `w15_fix_editor_surface_toolbar_contrast_insert_state_cm_theme` — #9,#10b
8. `w15_fix_heading_autonumber_editor_hint_preview_scope_label` — #11
9. `w15_polish_duplicate_dead_css_double_editor_container_border` — #10,#14
10. `w15_polish_ai_assist_bar_card_to_compact_toolbar` — #8
11. `w15_polish_topbar_balance_save_status_primary_action_alignment` — #7,#15
12. `w15_polish_state_token_consistency_active_disabled_warning` — #17
13. `w15_polish_accessibility_min_font_contrast_not_color_only` — #18
14. `w15_polish_copy_vietnamese_native_publish_reset_reviewer` — #16
15. `w15_polish_ia_workflow_overload_sidebar_legibility` — #19,#6

## Locked dùng chung mọi contract
- 🔒 `--rs-report-*` bất biến — tờ A4 luôn trắng-đen, không lật theme.
- 🔒 Token-only / no-hex ngoài primitive — token mới vào `DesignSystem_Tokens.md` trước khi dùng.
- 🔒 Không đổi public surface (`WorkspaceLayoutProps`, CanonicalTypes, `ui/index.ts`) trừ khi contract ghi rõ.
- 🔒 Offline, không lib mới.

> Tất cả 15 contract đang `WAITING_FOR_APPROVAL`. VibeCode Step 2: chưa chạm `src/` cho tới khi Approve từng cái.
