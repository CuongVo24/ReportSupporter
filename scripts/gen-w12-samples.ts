import { test, expect } from "vitest";
import { ALL_TEMPLATES } from "../src/modules/write/templates";
import { createProjectFromTemplate } from "../src/modules/write";
import {
  exportHtml,
  exportDocx,
  packDocx,
  prepareExport,
  buildPrintableHtml,
} from "../src/modules/export";
import fs from "node:fs";
import path from "node:path";

test("Generate Week 12 Report Samples", async () => {
  const targetTemplates = ALL_TEMPLATES.filter((t) =>
    ["software-project", "lab-report", "internship-report"].includes(t.id)
  );

  const samplesDir = path.resolve(process.cwd(), "Design/Reports/Month3/W12/samples");
  if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
  }

  for (const template of targetTemplates) {
    const bundle = createProjectFromTemplate(template, {
      title: `Báo cáo mẫu ${template.name}`,
      metadata: {
        school: "Trường Đại học Bách Khoa Hà Nội",
        course: "Kiểm thử Phần mềm nâng cao",
        lecturer: "TS. Nguyễn Văn A",
        members: ["Nguyễn Văn An - 20261111", "Trần Thị Bình - 20262222"],
        date: "25/06/2026",
      }
    });

    // Inject an image and a table to verify caption numbering (continuous/per-chapter)
    if (bundle.project.sections.length > 0) {
      const firstSec = bundle.project.sections[0];
      firstSec.markdown = `# ${firstSec.title}\n\n![Mô tả hình minh họa](https://example.com/figure.png)\n\nBảng 1: Bảng dữ liệu mẫu kiểm thử\n| Cột 1 | Cột 2 |\n|---|---|\n| Giá trị A | Giá trị B |\n`;
    }

    // 1. Export HTML
    const htmlResult = exportHtml(bundle);
    expect(htmlResult.ok).toBe(true);
    if (htmlResult.ok) {
      const htmlText = await htmlResult.blob.text();
      fs.writeFileSync(path.join(samplesDir, `${template.id}.html`), htmlText);
      console.log(`Generated HTML for ${template.id}`);
    }

    // 2. Export PDF (Print HTML)
    const input = prepareExport(bundle);
    const printableHtml = buildPrintableHtml(input);
    fs.writeFileSync(path.join(samplesDir, `${template.id}.print.html`), printableHtml);
    console.log(`Generated PDF print-HTML for ${template.id}`);

    // 3. Export DOCX
    const docxResult = exportDocx(bundle);
    expect(docxResult.ok).toBe(true);
    if (docxResult.ok) {
      const docxBlob = await packDocx(docxResult.doc);
      const arrayBuffer = await docxBlob.arrayBuffer();
      fs.writeFileSync(path.join(samplesDir, `${template.id}.docx`), Buffer.from(arrayBuffer));
      console.log(`Generated DOCX for ${template.id}`);
    }
  }
});
