# 🚀 PERFORMANCE OPTIMIZATION — ReportSupporter

> **AI RULE:** Hiệu năng không phải việc làm sau cùng — nó được thiết kế ngay từ dòng code đầu (tinh thần `Design/VibeCode.md`).
> Mọi kỹ thuật dưới đây **chỉ dùng công nghệ trong `Design/Modules/Other/TechnicalStack.md`** (đã khoá) + **Web Platform API có sẵn** (Web Worker, `requestIdleCallback`, `IntersectionObserver`...). **Cấm** kéo thêm lib hiệu năng/state ngoài stack.

ReportSupporter là **client-first heavy Markdown workspace**: người dùng gõ liên tục vào editor, mỗi phím có thể kích hoạt parse Markdown → format → preview → check. Nếu làm ngây thơ (parse lại toàn bộ doc trên main thread mỗi keystroke), báo cáo dài vài chục trang sẽ giật khựng. Triết lý tối ưu ở đây xoay quanh **3 trục**:

> 1. **Đừng làm lại việc đã làm** (debounce, memoize AST, diff theo section).
> 2. **Đừng làm việc nặng trên main thread** (đẩy unified pipeline + checker sang Web Worker).
> 3. **Đừng tải thứ chưa cần** (lazy-load mermaid, katex, export path).

Không có backend nóng, không realtime, không 5000 CCU — vì PRD §6 Non-goals: no cloud, no realtime, no login. **Đối thủ hiệu năng duy nhất là main thread của chính trình duyệt người dùng.**

---

## 1. ✍️ EDITOR & PREVIEW (Module 1 — Write)

### 1.1. Debounce preview re-render

* Keystroke **không** trigger re-render preview ngay. Gom phím bằng **debounce ~120-180ms** (dừng gõ mới render). Trong lúc đang gõ, editor vẫn mượt vì không bị parse chen ngang.
* Dùng `requestAnimationFrame` để commit kết quả render vào DOM đúng nhịp vẽ khung hình, tránh layout thrash.
* Editor là controlled `<textarea>` (W1) rồi CodeMirror 6 (W2+ theo TechnicalStack §2) — cả hai đều giữ state cục bộ, **không** ép React re-render cả cây mỗi phím.

### 1.2. Incremental parse — đừng parse lại cả doc

* Báo cáo chia theo `ReportSection[]` (`Design/Modules/1.Write.md` data model). Chỉ section đang sửa mới được parse lại; các section khác giữ nguyên hast cũ trong cache.
* CodeMirror 6 có `@codemirror/state` quản lý thay đổi dạng transaction → biết chính xác range nào đổi, không cần so cả chuỗi.

### 1.3. Tránh re-render toàn bộ preview

* Preview render **theo section**, mỗi section là một node độc lập. Section không đổi → không re-render (so sánh tham chiếu hast cache).
* Tách "khung A4 / margin / page-number" (tĩnh, đọc token `--rs-report-*` trong `Design/Modules/Other/DesignSystem_Tokens.md`) khỏi "nội dung section" (động) để khung không vẽ lại khi gõ.

---

## 2. ⚙️ HEAVY PARSE OFFLOADING — WEB WORKER

> Đây là trục quan trọng nhất. `unified` pipeline (remark-parse + remark-gfm + remark-math + rehype-katex + rehype-highlight + remark-rehype + rehype-stringify — `TechnicalStack.md` §3) và Checker engine (Module 3) đều **CPU-bound**. Chạy chúng trên main thread = chặn input khi gõ.

* **Đẩy unified pipeline vào Web Worker.** Main thread chỉ gửi `{ sectionId, markdown }` xuống worker qua `postMessage`; worker parse → trả về `{ sectionId, hast, ast }`. Main thread chỉ làm việc nhẹ: nhận HTML và gắn vào DOM.
* **Checker chạy cùng worker** (hoặc worker thứ hai). Checker đọc mdast/hast AST (`3.Check.md` "đọc AST, không regex thô") nên nó cần chính cây AST worker vừa dựng — gom chung một worker tránh truyền AST qua lại hai lần.
* **Transferable / structured clone:** truyền string Markdown xuống (nhẹ); truyền HTML string + danh sách `ReportIssue` lên. Tránh truyền hàm/DOM node qua worker (không serialize được).
* **Worker là module worker** (`new Worker(url, { type: "module" })`) để import được các package unified/remark đúng kiểu ESM của Next.js.
* **Mermaid là ngoại lệ:** Mermaid cần DOM nên **không** chạy được trong worker (`TechnicalStack.md` §3 "render client-side"). Worker chỉ phát hiện code block ```mermaid và đánh dấu; main thread render diagram sau, lazy (xem §3).

> 💡 Hệ quả: dù báo cáo 50 trang, gõ phím vẫn mượt vì main thread gần như rảnh — việc nặng nằm hết ở worker thread.

---

## 3. 📦 LAZY LOADING — chỉ tải khi cần

> Mặc định người dùng mở workspace để gõ chữ. Đừng bắt họ tải mermaid/katex/export bundle khi chưa dùng tới.

| Thư viện | Khi nào tải | Cách tải |
| :--- | :--- | :--- |
| `mermaid` | Lần đầu preview gặp block ```mermaid``` | `await import("mermaid")` (dynamic import), render client-side |
| `katex` (+ `rehype-katex`) | Lần đầu doc có `$...$` / `$$...$$` | dynamic import nhánh math của pipeline trong worker |
| `rehype-highlight` (highlight.js) | Lần đầu có code block có language | dynamic import; nếu doc không có code, không tải |
| Export path | Khi user bấm "Export" | route export tách bundle riêng |
| `puppeteer` | **Chỉ server-side**, khi gọi route PDF | `TechnicalStack.md` §4 — heavy dep, **không** vào client bundle bao giờ |
| `docx` | Khi user bấm Export DOCX | dynamic import phía client/worker |

* Dùng `next/dynamic` cho component nặng (vd component preview render mermaid) với `ssr: false` — chúng cần DOM.
* **Cấm import tĩnh** mermaid/katex/docx ở entry — sẽ phình initial bundle, chậm first paint của workspace (vi phạm posture "workspace-first" của `TechnicalStack.md` §1).

---

## 4. 📜 LONG DOCUMENTS — virtualization / chunking

> Báo cáo học thuật có thể 30-80 trang. Render toàn bộ DOM một lúc = nghẽn layout + tốn RAM.

* **Section-level rendering:** preview dựng từng `ReportSection` thành block riêng. Chỉ section trong viewport (+ buffer 1-2 section trên/dưới) được render đầy đủ; section ngoài viewport giữ placeholder cao đúng bằng chiều cao đã đo.
* **Virtualization bằng `IntersectionObserver`** (API có sẵn, không cần lib): observer phát hiện section sắp vào màn hình → render thật; section rời màn hình lâu → có thể thu về placeholder để nhẹ DOM.
* **Section navigator** (Key Screen ở `1.Write.md`) nhảy thẳng tới section bằng anchor, không cuộn qua toàn bộ DOM nặng.
* **Lưu ý export:** khi export, **tắt** virtualization và render đầy đủ 100% section (Puppeteer/`docx` cần toàn bộ nội dung). Virtualization chỉ là tối ưu *màn hình*, không bao giờ làm mất nội dung khi xuất file.

---

## 5. 🗄️ STORAGE — autosave IndexedDB (`idb`)

> `TechnicalStack.md` §5: draft sống qua refresh bằng IndexedDB qua `idb`. Phải autosave mà không giật UI khi gõ.

* **Throttled autosave:** ghi IndexedDB tối đa **mỗi ~2s** (throttle), không phải mỗi keystroke. Kết hợp "flush khi `visibilitychange`/`beforeunload`" để không mất phím cuối khi đóng tab.
* **Không block main thread:** `idb` dùng IndexedDB vốn bất đồng bộ; ghi trong `requestIdleCallback` để nhường thời gian cho việc gõ. Nếu draft lớn, có thể chuyển bước serialize sang worker (§2).
* **Draft diffing:** chỉ ghi `ReportSection` nào `markdown` đã đổi (so `updatedAt`/hash), không ghi đè cả `ReportProject`. Giảm khối lượng I/O và tránh ghi thừa.
* **Granular keys:** lưu mỗi section một record (key = `sectionId`) thay vì một blob khổng lồ → cập nhật một section không phải đọc-ghi lại cả báo cáo.

---

## 6. 📤 EXPORT PERFORMANCE

> Export là tác vụ nặng nhất. PDF (Puppeteer) chạy **server-side** (`TechnicalStack.md` §4, **stub tới W4**). DOCX (`docx` lib) sinh từ AST.

### 6.1. PDF (Puppeteer — server-side, stub tới W4)

* Chạy trong Node route, **không** chiếm main thread của trình duyệt người dùng.
* **Queue / serialize:** mỗi instance Chromium tốn RAM; với solo-dev một người dùng, giới hạn **1 job render tại một thời điểm** (hàng đợi đơn giản), tránh mở nhiều Chromium song song gây OOM. Reuse browser instance giữa các request thay vì launch mới mỗi lần.
* **Streaming response:** stream file PDF về client thay vì buffer toàn bộ vào RAM rồi mới gửi.
* UI hiển thị trạng thái "đang export" (đọc token toast `--rs-z-toast`); request bất đồng bộ, không khoá workspace.

### 6.2. DOCX (`docx` lib — off the UI thread)

* Sinh DOCX từ mdast AST (`TechnicalStack.md` §4) trong **Web Worker** (§2) — việc xây cây docx CPU-bound, đẩy khỏi main thread để workspace không khựng.
* Worker trả về `Blob`; main thread chỉ tạo download link.

### 6.3. Chung cho export

* **Tái dùng AST đã cache** (§7) thay vì parse lại Markdown từ đầu khi export — preview đã dựng AST rồi.
* Token report (`--rs-report-*` trong `DesignSystem_Tokens.md`) đọc một lần, nhúng vào HTML/áp vào docx — không tính lại layout per-page thủ công.

---

## 7. ✅ CHECKER PERFORMANCE (Module 3)

> Checker chạy offline (`3.Check.md` Acceptance "no network") và phải re-run nhanh sau mỗi sửa đổi.

* **Memoize AST:** Checker đọc chính cây mdast/hast mà worker đã dựng cho preview (§2) — **không** parse lại Markdown lần thứ hai cho checker.
* **Chỉ check section đã đổi:** mỗi rule chạy trên AST từng section; section không đổi → tái dùng `ReportIssue[]` cũ đã cache. Re-run toàn cục chỉ khi rule có tính *toàn doc* (vd "Missing references" — phải quét cả báo cáo).
* **Phân loại rule theo phạm vi:**
  * *Section-scoped* (heading nhảy cấp, code thiếu language, caption thiếu) → chạy lại chỉ section đổi.
  * *Document-scoped* (thiếu TOC / kết luận / references / bảng phân công, thiếu link demo/source) → chạy lại khi cấu trúc section thay đổi, không phải mỗi phím.
* **Debounce check** dài hơn debounce preview (vd ~400ms) — người dùng cần preview tức thì hơn là danh sách lỗi tức thì.
* Kết quả gom theo `severity` (`error | warning | info`) đúng `DesignSystem_Tokens.md` §2.3 để render badge nhanh, không tính màu runtime.

---

## 8. 📊 PERFORMANCE BUDGET TABLE

> Ngân sách mục tiêu. Mọi PR đụng Write/Format/Check/Export phải tự đối chiếu. Đo trên báo cáo mẫu **~40 trang A4** (kịch bản tiêu biểu của sinh viên), máy laptop tầm trung.

| Hạng mục | Chỉ tiêu mục tiêu | Ghi chú |
| :--- | :--- | :--- |
| **Keystroke → editor phản hồi** | `< 16ms` (1 frame) | Gõ không bao giờ giật; parse nằm ở worker (§2) |
| **Keystroke → preview cập nhật** | `< 200ms` sau khi ngừng gõ | Debounce 120-180ms (§1.1) + render incremental |
| **Re-check sau sửa 1 section** | `< 300ms` | Chỉ check section đổi (§7) |
| **Re-check toàn doc** | `< 800ms` | Rule document-scoped, ít khi chạy |
| **Autosave interval** | `~2s` throttle | Không block gõ; diff theo section (§5) |
| **Autosave 1 lần ghi** | `< 50ms` main-thread cost | Phần nặng ở `requestIdleCallback`/worker |
| **First load workspace (TTI)** | `< 2.5s` | Lazy mermaid/katex/export khỏi initial bundle (§3) |
| **Initial JS bundle (workspace)** | càng nhỏ càng tốt | **Không** chứa puppeteer/mermaid/docx |
| **Export PDF (40 trang)** | `< 8s` server-side | Puppeteer reuse instance + queue 1 job (§6.1) |
| **Export DOCX (40 trang)** | `< 4s` | `docx` lib trong worker (§6.2) |
| **Scroll preview (40 trang)** | `≥ 50 fps` | Virtualization theo section (§4) |
| **RAM tab khi mở 40 trang** | ổn định, không leak | Virtualization + thu placeholder section ngoài viewport |

---

## 9. 📎 CROSS-REFERENCES

* `Design/Modules/Other/TechnicalStack.md` — stack đã khoá (unified pipeline, `idb`, puppeteer server-side, `docx`); mọi kỹ thuật ở đây bám đúng các lib này.
* `Design/Modules/1.Write.md` — editor/preview/section/autosave mà §1, §4, §5 tối ưu.
* `Design/Modules/2.Format.md` — preset A4/typography; export tái dùng AST đã format (§6.3).
* `Design/Modules/3.Check.md` — checker offline + `ReportIssue.severity`; §7 tối ưu re-check.
* `Design/Modules/4.Export.md` — pipeline export HTML/PDF/DOCX mà §6 đặt ngân sách.
* `Design/Modules/Other/DesignSystem_Tokens.md` — token `--rs-report-*` dùng cho preview và export, đọc một lần (§6.3).
* `Design/ProductPRD.md` §6 — Non-goals (no cloud / no realtime / no login) định hình posture client-first.
