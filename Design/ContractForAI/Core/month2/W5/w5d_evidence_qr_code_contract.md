# Contract For AI - W5 Group D: QR Code Generation

> **Lane / Week:** Core / Month 2 / W5 - Day 4 (`Design/TaskBrief/Core/month2/w5.md` `[C62]`-`[C63]`).
> **Branch:** `feature/W5-evidence-kit`.
> **Builds on:** Group A (`EvidenceItem.qrEnabled`), Group C (`buildEvidenceAppendix` + preview integration).
> **Depended on by:** W4 Export (embeds QR into appendix when export is real), W8 submission package, Phase 3 Present (QR slide).
> **Sources:** `w5.md` Locked Decisions #2/#4/#7, `week5.md` Day 4, `Support.Evidence.md §6` (QR deferred → unlocked W5), `TechnicalStack.md §8` (`qrcode` deferred).

---

## 1. Micro-task Target

Sinh **QR code cho mỗi link minh chứng** (local, offline) bằng `qrcode`, hiển thị cạnh link `qrEnabled` trong appendix preview. QR sinh **on-demand**, không lưu vào draft.

> **🔒 Offline + on-demand (Locked #2/#4).** `qrcode` chạy local — không gọi dịch vụ QR ngoài. Chỉ `qrEnabled: boolean` được persist; QR data URL sinh lúc preview/export rồi bỏ — draft IndexedDB không phình.
> **🔒 Export embedding theo W4 (Locked #7).** QR là artifact pipeline; nhúng vào file export chỉ làm trên **export thật của W4**.
>
> **📌 Trạng thái export W4 thực tế (nhánh `feature/W4-export-mvp`, kiểm 2026-06-24):** `export-html.ts` + `export-docx.ts` **đã là export thật** (chạy qua `prepareExport` + pipeline `unified`) → **nhúng QR/appendix vào HTML + DOCX làm ngay khi W5 chồng lên W4**. `export-pdf.ts` **vẫn là Puppeteer stub server-side** → QR-embed cho PDF là **follow-up** gắn với engine PDF, không làm tuần này. (TaskBrief `w5.md` đoạn "still typed-error stubs" đã cũ — cập nhật theo thực tế này.)

## 2. Scope

### In scope (`[C62]`/`[C63]`)
- `npm i -E qrcode` + `npm i -D @types/qrcode` (exact pin; ghi version sau khi cài).
- `src/modules/evidence/evidence-qr.ts`: `toQrDataUrl(url: string): Promise<string>` — `qrcode.toDataURL` (local, offline) → PNG data URL; throw/empty-url → trả chuỗi rỗng hoặc reject typed (không crash UI). Không lưu kết quả.
- `src/modules/evidence/EvidenceQrPreview.tsx`: nhận `url`, sinh QR client-side (`useEffect` + `toQrDataUrl`), render `<img alt="QR: {url}">`; chỉ render khi có url. Client-only.
- `src/components/PreviewPane.tsx` (MODIFY): với mỗi item `qrEnabled && url` trong appendix, hiển thị `EvidenceQrPreview` cạnh link (khu vực phụ lục).
- **Export embedding (W4-dependent):** `export-html.ts` + `export-docx.ts` đã thật → nhúng appendix + QR (HTML: `<img>` data URL; DOCX: `ImageRun`) khi W5 chồng lên W4. `export-pdf.ts` còn stub → **out of scope tuần này**, follow-up khi engine PDF có thật.
- Vitest: `evidence-qr` — `toQrDataUrl("https://x")` → chuỗi `data:image/png;base64,...`; url rỗng → rỗng/không throw; **không gọi mạng** (qrcode local). Export-embed test theo W4 nếu export thật.

### Out of scope
- ❌ Lưu QR vào draft/IndexedDB (chỉ `qrEnabled` persist — Locked #4).
- ❌ Dịch vụ QR online / fetch (offline).
- ❌ Nhúng vào export file khi W4 export còn stub (follow-up nhánh W4 — Locked #7).
- ❌ QR slide cho Present (Phase 3).

## 3. Checklist
- [ ] `qrcode` (+`@types/qrcode`) cài exact-pin; version ghi vào contract.
- [ ] `toQrDataUrl` local offline → data URL; url rỗng/ lỗi → không crash.
- [ ] `EvidenceQrPreview` client-only, `<img>` có alt; chỉ render khi có url.
- [ ] QR **không** lưu vào draft; chỉ sinh on-demand.
- [ ] Preview hiển thị QR cạnh link `qrEnabled`.
- [ ] Export-embed: nhúng QR vào HTML + DOCX (export thật); PDF stub → follow-up ghi rõ.
- [ ] `evidence-qr.test.ts` (data URL + url rỗng + no network); 4 gates xanh.

## 4. Expected Interfaces / Files

```ts
// src/modules/evidence/evidence-qr.ts
export function toQrDataUrl(url: string): Promise<string>; // local PNG data URL ("" nếu url rỗng)

// src/modules/evidence/EvidenceQrPreview.tsx
export function EvidenceQrPreview(props: { url: string }): JSX.Element; // client-only
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/evidence/evidence-qr.ts` | NEW | ~30 |
| `src/modules/evidence/EvidenceQrPreview.tsx` | NEW | ~45 |
| `src/components/PreviewPane.tsx` | MODIFY | ~+10 |
| `src/modules/evidence/index.ts` | MODIFY | export `toQrDataUrl`, `EvidenceQrPreview` |
| `src/modules/export/export-html.ts` · `export-docx.ts` | MODIFY (export thật) | embed QR/appendix |
| `src/modules/export/export-pdf.ts` | — (stub) | follow-up khi engine PDF thật |
| `package.json` / `lock` | MODIFY | `qrcode` |
| `src/modules/evidence/evidence-qr.test.ts` | NEW | ~40 |

> **Import boundary:** `evidence-qr` imports `qrcode` only. `EvidenceQrPreview` client-only. No `fetch`, offline. QR không persist.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| QR data URL phình draft | Medium | Sinh on-demand preview/export; chỉ `qrEnabled` persist (Locked #4). |
| `qrcode` gọi mạng | Low | `qrcode` sinh local; test khẳng định không network. |
| Export-embed kẹt vì W4 chưa xong | Medium | Decouple — builder + preview tuần này; embed theo W4 (Locked #7). |
| QR lỗi (url rỗng) crash UI | Low | `toQrDataUrl` trả rỗng/typed; `EvidenceQrPreview` chỉ render khi có url. |
| Dep leak ngoài matrix | Low | Chỉ `qrcode` (+types); pin exact. |

## 6. Verification Plan
- `toQrDataUrl("https://github.com/x")` → `data:image/png;base64,...` không rỗng.
- `toQrDataUrl("")` → `""`, không throw.
- Preview: item `qrEnabled:true` + url → hiện QR `<img>` cạnh link; `qrEnabled:false` → không QR.
- export HTML chứa `<img>` QR trong appendix; DOCX có `ImageRun` QR. (PDF stub → bỏ qua.)
- grep: không `fetch`/QR-service trong module.
- lint/typecheck/test/build xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `feat(evidence): install qrcode + local QR data URL`; (2) `feat(evidence): QR preview in appendix`; (+ `feat(export): embed QR` nếu W4 thật); +1 docs commit.
