import type { ReportProjectBundle, ExportResult } from "@/types";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function exportHtml(bundle: ReportProjectBundle): ExportResult {
  try {
    const { project, schemaVersion } = bundle;
    
    // Sort sections by order
    const sortedSections = [...project.sections].sort((a, b) => a.order - b.order);
    
    // Build metadata list
    const metadataEntries = Object.entries(project.metadata)
      .map(([key, val]) => {
        const valStr = Array.isArray(val) ? val.join(", ") : val;
        return `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(valStr)}</li>`;
      })
      .join("\n");

    // Build sections HTML
    const sectionsHtml = sortedSections
      .map(sec => {
        return `
          <section id="section-${escapeHtml(sec.id)}">
            <h2>${escapeHtml(sec.title)}</h2>
            <div class="status-badge status-${escapeHtml(sec.status)}">${escapeHtml(sec.status)}</div>
            <pre class="raw-markdown">${escapeHtml(sec.markdown)}</pre>
          </section>
        `;
      })
      .join("\n");

    const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(project.title)}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      color: #333;
    }
    h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h2 { border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 40px; }
    .metadata {
      background: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      margin-bottom: 30px;
    }
    .metadata ul { list-style: none; padding: 0; margin: 0; }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 12px;
      border-radius: 3px;
      text-transform: uppercase;
      font-weight: bold;
    }
    .status-draft { background: #ffeeba; color: #856404; }
    .status-review { background: #b8daff; color: #004085; }
    .status-done { background: #c3e6cb; color: #155724; }
    .raw-markdown {
      background: #f4f4f4;
      padding: 15px;
      border-radius: 4px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(project.title)}</h1>
  <div class="metadata">
    <h3>Thông tin dự án</h3>
    <ul>
      <li><strong>Template ID:</strong> ${escapeHtml(project.templateId)}</li>
      <li><strong>Schema Version:</strong> ${schemaVersion}</li>
      <li><strong>Cập nhật lần cuối:</strong> ${escapeHtml(project.updatedAt)}</li>
      ${metadataEntries}
    </ul>
  </div>
  
  <div class="sections">
    ${sectionsHtml}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    return { ok: true, blob };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to render HTML stub.";
    return {
      ok: false,
      error: {
        stage: "render-html",
        message,
        recoverable: true,
      },
    };
  }
}
