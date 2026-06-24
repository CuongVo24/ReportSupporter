# Contract For AI — W5 Break: Fix QR Code Not Rendering In Live Preview

> **Lane:** Core / break_task / week5_break.
> **Branch:** `feature/W5-evidence-kit` (hoặc `fix/w5-qr-preview`).
> **Type:** Bug fix — review findings **#1 (🔴) QR không hiển thị trong preview**, kèm **#2 (🟡) rò scope raw-HTML**, **#3 (🟡) cơ chế portal mong manh**, **#4 (🟢) `data-url` không escape** (W5 Evidence Kit code review).
> **Builds on:** Group C (`evidence-appendix.ts` placeholder + `PreviewPane.tsx` integration), Group D (`EvidenceQrPreview.tsx`, `evidence-qr.ts`), pattern tham chiếu của export (`prepare-export.ts` `translateQrPlaceholders`).
> **Sources:** W5 code review (QR preview), `w5.md` Locked Decisions #2/#3/#4, `TechnicalStack.md §3` (một pipeline), `markdown-pipeline.ts` (sanitize không bật `rehype-raw`).

---

## 1. Micro-task Target

Vá lỗi **observable khi xem preview**: bật `qrEnabled` cho một minh chứng có URL nhưng **không có QR nào hiện ra** trong bảng phụ lục preview. Test tự động hiện tại không bắt được vì chỉ assert **chuỗi Markdown**, chưa render qua pipeline thật.

- **#1 (🔴) QR placeholder bị pipeline drop.** `buildEvidenceAppendix` nhúng raw HTML `<span class="ws-evidence-qr-placeholder" data-url="...">` vào cell ([evidence-appendix.ts:21-24](src/modules/evidence/evidence-appendix.ts)). Nhưng pipeline preview (`markdown-pipeline.ts`) **không** dùng `rehype-raw` và `remark-rehype` chạy **không** `allowDangerousHtml` → node `html` bị **loại bỏ** trước cả khi tới `rehype-sanitize`. Hệ quả: `document.querySelectorAll(".ws-evidence-qr-placeholder")` ([PreviewPane.tsx:211](src/components/PreviewPane.tsx)) trả mảng rỗng → không portal QR nào được tạo. **Đã verify**: render appendix qua `parseMarkdown → renderMdastToHtml` cho `html.includes("ws-evidence-qr-placeholder") === false`. (Export **không** dính lỗi này vì [prepare-export.ts:229-251](src/modules/export/prepare-export.ts) đọc node `html` ở tầng mdast **trước** sanitize.)
- **#2 (🟡) Rò scope + ngược Locked #3.** Builder Group C nhúng raw HTML đặc thù QR (Group D) vào artifact lẽ ra "một Markdown sạch qua một pipeline". Vừa coupling, vừa cố đẩy raw HTML vào pipeline vốn cố tình strip raw HTML.
- **#3 (🟡) Cơ chế preview mong manh kể cả khi span sống.** `querySelectorAll` quét **toàn `document`** (không scope theo ref vùng preview) và `createPortal` vào DOM do `dangerouslySetInnerHTML` quản lý — React ghi đè innerHTML mỗi lần re-render → portal mồ côi/nhấp nháy.
- **#4 (🟢) `data-url="${item.url}"` không escape** — URL chứa `"` làm vỡ attribute / regex `data-url="([^"]+)"` ở export.

## 2. Scope

### In scope

**#1+#2+#3 — QR vào preview ở tầng AST (đồng nhất với export):**
- `src/components/PreviewPane.tsx`: thay cơ chế raw-span + `querySelectorAll` + portal-vào-innerHTML bằng **dịch placeholder ở tầng mdast** — đúng pattern `translateQrPlaceholders` của export:
  - Pre-resolve QR data URL **on-demand** trong `useEffect` (async) qua `toQrDataUrl(item.url)` cho mỗi item `qrEnabled && url`, gom vào map `Record<url, dataUrl>` ở state. **Không** persist (Locked #4) — chỉ sống trong component.
  - Trước `renderMdastToHtml(numberedAst)`, chạy một bước biến node `html` chứa `ws-evidence-qr-placeholder` thành node `image` (`url: dataUrl`, `alt: "QR: <url>"`) — **giống** export. `image` đi qua sanitize hợp lệ (protocol `data:` đã được allow cho `src`). Bỏ `placeholders` state, `createPortal`, và import `EvidenceQrPreview` khỏi PreviewPane.
  - Trong khi QR chưa resolve xong (map chưa có key) → để placeholder bị bỏ như cũ (không QR, không vỡ bảng); resolve xong → re-render hiện QR.
- **Tái dùng, không nhân bản logic:** trích `translateQrPlaceholders` thành helper export công khai dùng chung cho cả export lẫn preview (vd `src/modules/evidence/evidence-qr.ts` thêm `injectQrImages(ast, qrDataUrls)` qua `index.ts`, hoặc export hàm hiện có từ `prepare-export`). Một nguồn sự thật cho phép preview = export (Locked #3).
- `src/modules/evidence/EvidenceQrPreview.tsx`: **cân nhắc xóa** nếu không còn consumer (giờ QR là `image` node, không phải React component trong appendix). Nếu giữ cho mục đích khác thì bỏ khỏi `index.ts` public surface để tránh API chết.

**#4 — escape `data-url`** (`src/modules/evidence/evidence-appendix.ts`):
- Escape `"` trong giá trị `data-url` (vd `"`→`&quot;`), và consumer (helper translate dùng chung) decode `&quot;`→`"` **trước** khi tra map keyed theo raw url. Giữ map key = URL gốc (đúng với `qrDataUrls[item.url]`). Không đổi chữ ký `buildEvidenceAppendix`.

**Regression tests (thuần, render qua pipeline thật — đây là test đáng lẽ phải có để chặn #1):**
- `src/modules/evidence/evidence-appendix.test.ts` (hoặc test PreviewPane-logic mới): với 1 item `qrEnabled:true` + url + map QR đã resolve → sau bước translate + `renderMdastToHtml`, HTML **chứa** `<img` `alt="QR: ...` (src data URL); `qrEnabled:false` → **không** có `<img>` QR.
- Khẳng định bảng phụ lục (phần không-QR) vẫn render đúng số hàng + label kind sau pipeline.
- url chứa `"` → escape/decode đúng, vẫn tra được QR; không vỡ attribute.
- Offline: không `fetch`; `toQrDataUrl` chạy local.

### Out of scope
- ❌ Đổi pipeline W2 để bật `rehype-raw`/`allowDangerousHtml` — **CẤM**: nới sanitize đã chốt W2 và vẫn để lại cơ chế portal mong manh. Fix đi theo hướng AST-image (sạch hơn).
- ❌ Export-embed (HTML/DOCX đã đúng — không đụng; chỉ trích helper dùng chung từ chính nó).
- ❌ Đổi shape `EvidenceItem`/schema (CanonicalTypes §2 — giữ nguyên).
- ❌ Findings #report-accuracy & #5 confirm() → **Contract 2** (`w5_improve_evidence_report_accuracy_and_polish_contract.md`).
- ❌ QR cho PDF (vẫn theo engine PDF — follow-up W4).

## 3. Checklist
- [ ] Preview hiện QR cạnh link `qrEnabled` qua **node `image`** ở tầng AST (không raw span, không `querySelectorAll` toàn document, không portal-vào-innerHTML).
- [ ] Helper translate placeholder→image **dùng chung** preview + export (một nguồn, Locked #3).
- [ ] `data-url` escape `"`; consumer decode trước khi tra map.
- [ ] `EvidenceQrPreview` xóa hoặc gỡ khỏi public surface nếu không còn consumer.
- [ ] Test render-qua-pipeline: `qrEnabled` → có `<img alt="QR:…">`; tắt → không; bảng vẫn đúng; offline.
- [ ] 4 gates xanh (lint / typecheck / test / build).

## 4. Expected Interfaces / Files

```ts
// helper dùng chung (vd evidence-qr.ts), thay cho translateQrPlaceholders cục bộ ở prepare-export:
export function injectQrImages(ast: MdastRoot, qrDataUrls: Record<string, string>): void; // html placeholder -> image node

// PreviewPane: pre-resolve map on-demand, không persist
const [qrMap, setQrMap] = useState<Record<string, string>>({});
// ...effect: với mỗi evidence.qrEnabled && url -> toQrDataUrl -> setQrMap
// ...trước renderMdastToHtml: injectQrImages(numberedAst, qrMap)

// evidence-appendix.ts: data-url escaped
//   data-url="${item.url.replace(/"/g, "&quot;")}"
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/components/PreviewPane.tsx` | MODIFY | ~−20/+20 (bỏ portal, thêm map + inject) |
| `src/modules/evidence/evidence-qr.ts` (hoặc helper chung) | MODIFY | ~+20 (`injectQrImages`) |
| `src/modules/export/prepare-export.ts` | MODIFY | dùng helper chung thay bản cục bộ |
| `src/modules/evidence/evidence-appendix.ts` | MODIFY | ~+1 (escape `data-url`) |
| `src/modules/evidence/index.ts` | MODIFY | export `injectQrImages`; gỡ `EvidenceQrPreview` nếu xóa |
| `src/modules/evidence/EvidenceQrPreview.tsx` | DELETE? | nếu hết consumer |
| `src/modules/evidence/evidence-appendix.test.ts` | MODIFY | ~+40 (render-pipeline + escape) |

> **Import boundary** không đổi: preview import `@/modules/evidence` + `@/lib`. **Offline tuyệt đối** — không `fetch`. QR không persist (Locked #4).

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| QR resolve async → flash "không QR" rồi mới hiện | Thấp | Chấp nhận được (giống lazy image); map cache theo url, re-render khi xong. |
| Trích helper chung làm hồi quy export | TB | Giữ logic y nguyên `translateQrPlaceholders`, chỉ move + export; test export hiện có phải vẫn xanh. |
| `image` node bị sanitize chặn | Thấp | `protocols.src` đã allow `data:` (`markdown-pipeline.ts`); test khẳng định `<img>` xuất hiện. |
| Xóa `EvidenceQrPreview` phá import ẩn | Thấp | grep consumer trước khi xóa; nếu còn thì giữ + gỡ khỏi index. |
| URL có `"` literal | Thấp | Escape `&quot;` + decode khi tra map; URL thực tế thường percent-encode. |

## 6. Verification Plan
- Unit: appendix 1 item `qrEnabled:true` + url → sau `injectQrImages` + `renderMdastToHtml`, HTML chứa `<img alt="QR: https://…"`; `qrEnabled:false` → 0 `<img>` QR.
- Unit: bảng phụ lục n item → đúng số hàng + label VI sau pipeline (không-QR vẫn nguyên).
- Unit: url chứa `"` → tra map QR thành công, attribute không vỡ.
- grep: không còn `querySelectorAll(".ws-evidence-qr-placeholder")`, không `createPortal` QR; không `fetch`.
- Manual (khi chạy app): bật QR cho 1 link ở section cuối → preview hiện QR cạnh link trong "Phụ lục minh chứng"; export HTML/DOCX vẫn có QR (không hồi quy).
- lint / typecheck / test / build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `fix(evidence): render QR in preview via AST image injection`; (2) `refactor(export): share QR inject helper`; (3) `test(evidence): appendix render-pipeline + QR coverage`; +1 docs commit.
