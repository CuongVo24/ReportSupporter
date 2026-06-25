# ✍️ FLOW — Write (Module 1)

> **STATUS: ✅ SPEC.** Screen-level cho luồng viết, theo `_FlowSpecRule.md`. Logic ở `Modules/1.Write.md`; file này lo *màn trông & cảm thấy ra sao*. Đây là **bàn viết → tờ nộp** (chữ ký `0.ArtDirection.md` §12) — màn hình đầu tiên & ở lâu nhất.

## Bản đồ bước

```
[Chưa có report] → Template picker → Metadata form → BÀN VIẾT ↔ TỜ NỘP (lưu thầm)
                                                          ↑ (tuỳ) Đặt hạn nộp
```

---

### Màn 1 — Empty: Chưa có report

**0. Bố cục:** chiếm toàn vùng làm việc (chưa có bàn viết/tờ nộp). Căn giữa, thoáng.
**1. Primary:** **Tạo report**.
**2. Phụ:** (W2+) mở report gần đây nếu có.
**3. Trạng thái:**
| State | Khi nào | Hiển thị |
| :--- | :--- | :--- |
| empty | IndexedDB rỗng (lần đầu) | minh hoạ tiết chế + "Chưa có báo cáo nào" + **Tạo report**; auto-mở template picker (`1.Write.md` §6) |
| loading | đang đọc IndexedDB | skeleton, không spinner toàn màn |
| error | đọc dữ liệu lỗi | "Không mở được dữ liệu cục bộ. Tải lại trang." |

**4. Copy:** "Chưa có báo cáo nào" / "Tạo báo cáo đầu tiên để bắt đầu viết." (`VoiceAndContent.md` §5).
**5. Component:** Button (primary), empty-state pattern, (tuỳ) illustration.
**6. Gate:** none.
**7. Chữ ký:** chưa; đây là cửa vào bàn viết.

---

### Màn 2 — Template picker

**0. Bố cục:** dialog/overlay (`--rs-z-modal`) hoặc full vùng làm việc; lưới tile template.
**1. Primary:** **Tạo report** (sau khi chọn 1 template).
**2. Phụ:** **Huỷ**; xem mô tả template (hover/expand).
**3. Trạng thái:**
| State | Hiển thị |
| :--- | :--- |
| default | lưới tile (`--rs-template-tile-*`); tile chọn → viền `--rs-color-primary` |
| empty | "Chưa có template" (hiếm — bundled) |
| disabled | **Tạo report** mờ khi chưa chọn tile nào |

**4. Copy:** tiêu đề "Chọn mẫu báo cáo"; nút **Tạo report**.
**5. Component:** template tile (card), Button, Dialog (nếu overlay).
**6. Gate:** primary disabled tới khi chọn 1 tile.
**7. Chữ ký:** none.

---

### Màn 3 — Metadata form

**0. Bố cục:** form gọn (dialog hoặc panel) — title/school/course/lecturer/members + (tuỳ) **hạn nộp**.
**1. Primary:** **Lưu** (rồi vào bàn viết).
**2. Phụ:** **Huỷ**; **Thêm thành viên** (icon).
**3. Trạng thái:**
| State | Khi nào | Hiển thị | Pattern |
| :--- | :--- | :--- | :--- |
| error/invalid | field `required` trống, blur/submit | viền `--rs-field-border` error + message dưới field | `FormValidation.md` |
| disabled | **Lưu** mờ khi còn field required trống | — | — |
| feedback | lưu xong | vào bàn viết + "Đã lưu" | `Feedback.md` |

**4. Copy:** "{Tên field} không được để trống." (`VoiceAndContent.md` §4). Nhãn field tiếng Việt.
**5. Component:** Input, Select (course?), Button, (members) field nhóm.
**6. Gate:** **Lưu** disabled khi thiếu field required (zod, `1.Write.md` §5.1).
**7. Chữ ký:** nếu nhập **hạn nộp** → kích hoạt đồng hồ điềm tĩnh (SignatureInteractions #3).

---

### Màn 4 — Bàn viết ↔ Tờ nộp (màn chính) ★

**0. Bố cục:** trọng tâm AppShell — editor mono (trái) ↔ tờ A4 trên mặt bàn slate (phải); section nav trái; rail phải (người soát + đồng hồ). Xem `AppShell.md` §1.
**1. Primary:** không có nút primary nổi *trong* pane — hành động chính là **gõ**; primary toolbar là `Xuất` (thuộc Export flow). Nội dung là nhân vật chính (§3.1).
**2. Phụ:** asset insert menu (image/table/code/math/mermaid/callout), đổi `status` section, kéo chỉnh tỉ lệ pane.
**3. Trạng thái:**
| State | Khi nào | Hiển thị | Pattern |
| :--- | :--- | :--- | :--- |
| empty (section) | section markdown rỗng | preview placeholder "Chưa có nội dung"; người soát flag `empty-section` | `EmptyStates.md` |
| loading (preview) | render debounce 120–180ms | giữ preview cũ, không nháy trắng | `LoadingSkeleton.md` |
| error (parse) | Mermaid/KaTeX sai cú pháp | khối lỗi inline trong preview, **không** trắng pane (`1.Write.md` §6) | `ErrorStates.md` |
| error (ảnh) | `asset:` mồ côi / base64 hỏng | ô "ảnh lỗi" giữ layout | `ErrorStates.md` |
| feedback (lưu) | throttle ~2s | dấu **lưu thầm** "Đã lưu HH:MM" inline | `Feedback.md` |
| error (quota) | `QuotaExceededError` | banner "Bộ nhớ trình duyệt đầy…", giữ nội dung RAM | `ErrorStates.md` |

**4. Copy:** placeholder section "Chưa có nội dung"; dấu lưu "Đang lưu…"/"Đã lưu HH:MM"; lỗi Mermaid "Mermaid không render được: {message}".
**5. Component:** editor (CodeMirror/textarea), preview pane, section navigator, asset menu (dropdown), Badge (section status), Button (ghost toolbar).
**6. Gate:** none (viết tự do); insert image cảnh báo khi >2MB (`1.Write.md` §6).
**7. Chữ ký:** **lưu thầm có dấu vết** (#4); **đèn rọi** khi jump từ người soát (#1) cuộn editor+preview tới đúng đoạn; **đồng hồ** trên rail nếu có deadline (#3).

---

## 🎯 Điểm nhấn gu
- Editor tĩnh lặng, chữ là trung tâm (north-star §5). Tờ nộp đặt trên mặt bàn slate — không phải tab "preview" lép vế.
- **Không** primary rực trong vùng viết; sự ấm đến từ lưu thầm + nhớ chỗ đang viết, không từ trang trí (§12.4).

## 📎 Cross-refs
- `Modules/1.Write.md` · `4.Layouts/AppShell.md` · `_FlowSpecRule.md` · `Other/SignatureInteractions.md` (#1, #3, #4).
- `3.Patterns/*` · `2.Components/Input.md` / `Textarea.md` / `Badge.md` · `Other/VoiceAndContent.md` §4–§6.
