# 🧪 TEST STRATEGY — ReportSupporter (V1.0)

> **AI RULE:** File này hợp nhất chiến lược test cho dự án. Nó **không** thay thế QC checklist trong từng `Modules/*.md`; nó nêu *tầng test*, *fixtures*, và cách verify **determinism**. Đổi chiến lược → cập nhật file này.

Triết lý: **test ít nhưng đúng chỗ.** Trục giá trị của ReportSupporter là **deterministic** (cùng Markdown + metadata → cùng output) và **Checker offline regression-safe**. Test tập trung vào hai trục đó, không chạy theo coverage %.

---

## 1. TEST LEVELS

| Tầng | Công cụ | Bắt buộc cho | Ghi chú |
| :-- | :-- | :-- | :-- |
| **Unit** | Vitest | **Checker rules (Module 3)** — bắt buộc từng rule; Format numbering/TOC/caption; Export mdast→docx mapping; lib (`slugify`, pipeline helpers) | env `node` (`vitest.config.ts`); deterministic, no network |
| **Integration** | Vitest | Pipeline nhỏ end-to-end: Markdown → mdast → format → sanitize → hast; `createProjectFromTemplate` | Ghép nhiều bước, vẫn in-process |
| **E2E** | Playwright | **Deferred Phase 3** (`TechnicalStack.md` §7) — chưa cài MVP | Workspace flow thật trên browser |
| **Manual QC** | tay | Acceptance UI từng `Modules/*.md` §QC | Self-QC trước merge (`WorkFlow.md` 3S) |

---

## 2. MANDATORY UNIT COVERAGE (MVP)

- **Mỗi Checker rule** có ≥ 1 test "báo đúng" + 1 test "không báo nhầm" (template-aware false-positive) — khớp `3.Check.md` §8.
- **Numbering / TOC / caption** (Format) có test deterministic (`2.Format.md` §8).
- **Export mapping** mdast→docx có test cấu trúc (`4.Export.md` §8).
- **W1 subset:** `createProjectFromTemplate` (section count / `order` / `status="draft"`) + text-based checks (`placeholder-text`, `code-block-no-lang`) — khớp `TaskBrief/Core/month1/w1.md`.

---

## 3. DETERMINISM / GOLDEN-FILE

> DoD đòi "export 2 lần cùng input → byte-identical" (`WorkFlow.md`). Cách verify:

- **Golden-file (snapshot có kiểm soát):** giữ output kỳ vọng (HTML / numbering tree / docx-structure JSON) trong fixtures; test so output hiện tại với golden.
- **Cấm nguồn non-deterministic trong render path:** không `Date.now()` / `Math.random()` / `crypto.randomUUID()` trong Format/Export render. ID sinh ở Write / lúc tạo project, **không** ở render path → chạy 2 lần phải trùng.
- **Đổi golden = hành vi đổi có chủ đích** → cập nhật golden trong **cùng PR** + ghi lý do (giống "nâng version pipeline = Contract").

---

## 4. FIXTURES

- Đặt fixtures cạnh test: `src/modules/<m>/__fixtures__/` (markdown mẫu, bundle mẫu, golden output).
- Có ≥ 1 **báo cáo mẫu ~40 trang** (khớp budget `OptimizePerformance.md` §8) để test perf-sensitive path & golden export.
- Fixtures là dữ liệu **tĩnh**, không gọi mạng.

---

## 5. OFFLINE & SECURITY TESTS

- **Checker offline:** test chạy khi "ngắt mạng" → vẫn ra `ReportIssue[]`, **không** network call (`3.Check.md` §8).
- **Sanitize:** test các vector XSS ở `Security.md` §7 (script / onerror / `javascript:` URI) → bị loại; math/code vẫn render.

---

## 6. CI (đề xuất — light)

- Một workflow chạy `npm ci` → `lint` → `typecheck` → `build` → `test` trên push/PR vào `develop` / `main`.
- (Tuỳ chọn) `npm audit` mức cảnh báo (`Security.md` §5) — không chặn cứng MVP.
- CI xanh là một phần của DoD (`WorkFlow.md`); self-QC tay vẫn **bắt buộc** cho phần UI.

---

## 7. WHAT WE DON'T TEST (MVP)

- Không hard gate coverage %.
- Không test component UI (jsdom / testing-library **chưa cài** — `w1.md` `[C2]`); UI verify bằng manual QC tới khi có E2E (Phase 3).
- Không test link sống / network (Checker offline).

---

## 8. CROSS-REFERENCES

- `Design/Modules/3.Check.md` §8 — QC checklist Checker (nguồn rule test).
- `Design/Modules/2.Format.md` §8 · `Design/Modules/4.Export.md` §8 — QC determinism.
- `Design/Conventions/WorkFlow.md` — DoD, "Determinism" verify.
- `Design/Modules/Other/Security.md` §7 — sanitize tests.
- `Design/Modules/Other/TechnicalStack.md` §7 — Vitest / Playwright posture.
