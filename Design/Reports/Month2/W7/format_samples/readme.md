# Week 7 Format Hardening Samples

This directory provides the QA verification samples for the PDF page-break behavior and the DOCX layout verification checklist.

## 1. DOCX Layout Checklist Output

Running `verifyDocxLayout` on a project bundle generated from the standard `software-project` template yields the following checklist output:

| Check ID | Status | Outcome / Verification Detail |
| :--- | :---: | :--- |
| `page-setup-size` | **PASS** | Kích thước trang là A4. |
| `page-setup-margins` | **PASS** | Lề trang hợp lệ: Trên 20mm, Phải 20mm, Dưới 20mm, Trái 30mm. |
| `heading-hierarchy` | **PASS** | Cấu trúc phân cấp tiêu đề (Heading) hợp lệ, không nhảy cấp. |
| `caption-numbering-parity` | **PASS** | Đánh số chú thích khớp hoàn toàn với Caption Registry (1 mục). |
| `table-format` | **PASS** | Tất cả bảng (1 bảng) có cấu trúc hàng/cột hợp lệ. |
| `chapter-page-breaks` | **PASS** | Ngắt trang trước mỗi chương lớn được kích hoạt (Tổng cộng 7 chương). |

---

## 2. PDF Page-Break Behavior (Before vs After)

Here is a summary of the layout improvements in the generated PDF/print output before and after the Week 7 hardening phase:

### Chapter Start (H1)
* **Before**: New chapters (H1) started inline, immediately following the content of the previous chapter on the same page.
* **After**: Each H1 chapter starts clean on a **new page** (due to `break-before: page`), except for the first heading inside the document body (which prevents a double page break after the cover page/TOC).

### Heading Orphan Control
* **Before**: Headings (H2/H3) could appear alone at the very bottom of a page, with their corresponding paragraph text split onto the next page.
* **After**: Headings stay grouped with their following block (due to `break-after: avoid; page-break-after: avoid;`), ensuring no orphan headings exist at the bottom of pages.

### Figure & Table Caption Keeping
* **Before**: An image or a table could end up on one page, while its caption text ("Hình X.Y: ...") got pushed onto the next page.
* **After**: Captions and images/tables stay on the same page (due to `break-inside: avoid` on the containers, `break-before: avoid` on `.fig-caption`, and `break-after: avoid` on `.tbl-caption`).

### Widow/Orphan Paragraph Lines
* **Before**: A paragraph could print with a single trailing line at the start of a page, or a single leading line at the bottom of a page.
* **After**: Controlled by CSS `orphans: 3; widows: 3;`, ensuring a minimum of three lines stay together when paragraphs span across page breaks.

---

## 3. Running Headers & Footers
* **Before**: No running headers or page numbers existed in native print CSS.
* **After**: Enabled best-effort running headers and page numbers using standard `@page` rules with `@top-center` and `@bottom-center` margin boxes. The header/footer displays preset metadata, and is hidden on the first (cover) page using `@page :first`.
