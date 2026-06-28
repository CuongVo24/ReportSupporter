# Contract For AI — W18 Feat (B): Hội Đồng Phản Biện Ảo (AI Mock Defense) — P1 Text

> **Lane:** Core / break_task / week18_break.
> **Branch:** `w18/upgrade-ai` (nhánh chung cả tuần).
> **Type:** Flagship / tính năng độc bản — finding **S1** (High, tài sản phản biện hiện *tĩnh*: `generate-qa` sinh câu hỏi, `DefenseQAView` chỉ hiển thị — chưa có vòng tương tác đối kháng có chấm điểm). Brainstorm 2026-06-28. **Khoảng trống thị trường:** không công cụ phổ biến nào mô phỏng buổi phản biện bám sát đúng tài liệu của người dùng cho ngữ cảnh đồ án/khóa luận VN.
> **Builds on:** `generate-qa` ([generate-qa.ts](src/modules/present/generate-qa.ts)), `speakers` ([speakers.ts](src/modules/present/speakers.ts)), `timeline` ([timeline.ts](src/modules/present/timeline.ts)), `weak-sections` ([weak-sections.ts](src/modules/present/weak-sections.ts)), `evidence`, AI gateway ([ai-gateway.ts](src/modules/write/ai/ai-gateway.ts) — `requestSuggestion`/`getGatewayState`).
> **Sources:** Brainstorm 2026-06-28; `VoiceAndContent.md §7`; `Design/Modules` (Present); Privacy note.

---

## 1. Micro-task Target

Một **chế độ luyện bảo vệ đối kháng**: AI đóng vai hội đồng, hỏi vặn dựa trên **chính nội dung báo cáo + minh chứng** của người dùng; người dùng trả lời (text ở P1); AI đối chiếu, chấm "trả lời được/né/sai", chỉ ra chỗ dễ bị hỏi tiếp; cuối phiên xuất **Thẻ điểm sẵn sàng bảo vệ**. **Chỉ chạy sau opt-in AI**; báo cáo không gửi key xuống trình duyệt (qua route server đã có ở W16).

- **S1 — Sinh câu hỏi grounded (personas).** Mở rộng `generate-qa` thành phiên có *vai hội đồng* (tái dùng cấu trúc `speakers`): vd "phản biện kỹ thuật", "phản biện phạm vi", "thư ký bắt lỗi minh chứng". Câu hỏi bám section + ưu tiên `weak-sections` và chỗ thiếu minh chứng (`brokenEvidenceNotes`). Prompt + parse qua AI gateway; schema zod cho câu hỏi.
- **S2 — Vòng hỏi–đáp (text).** UI phiên: AI hỏi → người dùng gõ trả lời → AI đánh giá đối chiếu báo cáo, trả `{ verdict: answered|evaded|incorrect, rationale, supportingSectionId?, followUp? }`. Trích đúng đoạn báo cáo hậu thuẫn, hoặc cảnh báo "không có minh chứng → dễ bị hỏi tiếp".
- **S3 — Thẻ điểm sẵn sàng.** Tổng hợp phiên → `{ readiness%, perPersona, hotQuestions[], weakClaims[] }`. Tái dùng `weak-sections`/health (A3) cho phần điểm. Xuất/lưu để ôn.
- **S4 — Trạng thái gateway + offline-aware.** Khi AI `disabled`/`unconfigured` → CTA mở Cài đặt AI (như các panel khác), **không** giả vờ chạy. Báo rõ đây là tính năng cần mạng + opt-in.

> 🔒 **Chỉ network sau opt-in AI tường minh**; key giữ ở route server (không xuống browser). Báo cáo/minh chứng chỉ rời máy khi user bật AI và bắt đầu phiên.
> 🔒 **Grounded** — câu hỏi & đánh giá phải dựa trên nội dung báo cáo thật, không "ảo" chung chung.
> 🔒 Không lib AI SDK mới (tái dùng gateway `fetch`). Type phiên mới khoanh trong module Present; không phá public surface khác. Token-only, giọng `§7`.

## 2. Scope (P1 — Text mode)

### In scope
- [src/modules/present/mock-defense/session.ts](src/modules/present/mock-defense/session.ts) (NEW): state máy phiên thuần (câu hỏi → trả lời → verdict → thẻ điểm), injectable gateway.
- [src/modules/present/mock-defense/personas.ts](src/modules/present/mock-defense/personas.ts) (NEW): vai hội đồng (tái dùng `speakers` shape).
- [src/modules/present/mock-defense/generate-questions.ts](src/modules/present/mock-defense/generate-questions.ts) (NEW): prompt + parse (zod) grounded theo section/weak/evidence.
- [src/modules/present/mock-defense/evaluate-answer.ts](src/modules/present/mock-defense/evaluate-answer.ts) (NEW): prompt + parse verdict.
- [src/modules/present/mock-defense/scorecard.ts](src/modules/present/mock-defense/scorecard.ts) (NEW): tổng hợp thẻ điểm (tái dùng weak-sections/health).
- `*.test.ts` cho mỗi file trên (NEW): parse/verdict/scorecard với gateway giả (fake) — **không gọi mạng thật**.
- [src/types/present.ts](src/types/present.ts) (MODIFY): schema `MockDefenseSession`/`DefenseQuestion`/`AnswerVerdict`/`ReadinessScorecard`.
- [src/modules/present/MockDefenseView.tsx](src/modules/present/MockDefenseView.tsx) (NEW): UI phiên (hỏi–đáp–thẻ điểm) + CTA cấu hình AI.
- [src/modules/present/PresentPanel.tsx](src/modules/present/PresentPanel.tsx) (MODIFY): thêm tab/nút "Luyện phản biện".
- [src/modules/present/index.ts](src/modules/present/index.ts) (MODIFY): export.
- [src/app/globals.css](src/app/globals.css) (MODIFY): style (token).

### Out of scope (để pha sau — ghi trong contract này)
- ❌ **P2 Voice mode** (Web Speech API; nhận dạng giọng thường cần mạng; đo nhịp nói vs `timeline`) — contract riêng sau khi P1 ổn.
- ❌ **P3 Lịch sử buổi tập** (đường cong readiness, top câu hay bí) — contract riêng.
- ❌ Đổi adapter/route AI (đã có W16; chỉ tiêu thụ gateway).

## 3. Checklist (P1)
- [ ] **S1** Sinh câu hỏi grounded theo section + weak/evidence, có vai hội đồng; schema parse an toàn.
- [ ] **S2** Vòng hỏi–đáp text: verdict answered/evaded/incorrect + rationale + trích đoạn hậu thuẫn.
- [ ] **S3** Thẻ điểm readiness%/perPersona/hotQuestions/weakClaims; xuất/lưu được.
- [ ] **S4** Gateway disabled/unconfigured → CTA Cài đặt AI, không chạy giả; nhãn rõ "cần mạng + opt-in".
- [ ] Test dùng gateway giả, không gọi mạng thật. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/present/mock-defense/session.ts` | NEW | máy phiên thuần |
| `src/modules/present/mock-defense/personas.ts` | NEW | vai hội đồng |
| `src/modules/present/mock-defense/generate-questions.ts` | NEW | prompt+parse grounded |
| `src/modules/present/mock-defense/evaluate-answer.ts` | NEW | prompt+parse verdict |
| `src/modules/present/mock-defense/scorecard.ts` | NEW | tổng hợp thẻ điểm |
| `src/modules/present/mock-defense/*.test.ts` | NEW | unit (gateway giả) |
| `src/types/present.ts` | MODIFY | schema phiên/câu hỏi/verdict/scorecard |
| `src/modules/present/MockDefenseView.tsx` | NEW | UI phiên |
| `src/modules/present/PresentPanel.tsx` | MODIFY | tab "Luyện phản biện" |
| `src/modules/present/index.ts` | MODIFY | export |
| `src/app/globals.css` | MODIFY | style (token) |

> **Import boundary:** không lib AI SDK mới; tái dùng gateway `fetch` qua route server W16.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Lộ nội dung báo cáo ra mạng ngoài ý muốn | High | Chỉ chạy sau opt-in AI; key ở route server; nhãn rõ; không tự khởi động. |
| AI "ảo" câu hỏi không bám báo cáo | High | Grounding bằng section + weak + evidence trong prompt; schema parse; hiển thị đoạn hậu thuẫn. |
| Parse output AI không ổn định | Med | zod safeParse + fallback thông báo lỗi (pattern như present hiện có). |
| Phụ thuộc cấu hình AI chưa bật | Med | CTA mở Cài đặt AI; trạng thái `getGatewayState`. |
| Phình phạm vi sang voice/lịch sử | Med | Khoanh P1 text; P2/P3 contract riêng. |

## 6. Verification Plan
- Bật AI → mở "Luyện phản biện" → nhận câu hỏi bám đúng section/điểm yếu của báo cáo.
- Trả lời "né" → verdict `evaded` + lý do; trả lời có dẫn chứng đúng → `answered` + trích đoạn.
- Kết phiên → Thẻ điểm readiness + hotQuestions; lưu/ xuất được.
- AI tắt → CTA cấu hình, không chạy giả.
- Test gateway giả xanh; không request mạng thật. 4 gate xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit (trên `w18/upgrade-ai`): `feat(present): AI mock defense P1 — grounded adversarial Q&A with readiness scorecard`.
