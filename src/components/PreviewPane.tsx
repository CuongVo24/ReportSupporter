"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Info } from "lucide-react";
import { renderMdastToHtml } from "@/lib/markdown-pipeline";
import { MermaidRenderer } from "@/modules/write/MermaidRenderer";
import { parseHeadings, numberHeadings, generateToc, buildCaptionRegistry, normalizeCaptions, generateListOfFigures, generateListOfTables, HeadingNode, injectHeadingNumbers, renderTocToHtml } from "@/modules/format";
import { buildEvidenceAppendix, toQrDataUrl, injectQrImages, type UnistNode as EvidenceUnistNode } from "@/modules/evidence";
import type { ReportAsset, FormatSettings, TocNode, EvidenceItem, CaptionEntry } from "@/types";
import { PRESETS } from "@/modules/export/helpers";
import "@/lib/katex-styles"; // Import KaTeX CSS styles
import { EmptyState } from "@/components/states";
import { contentHash } from "@/lib/content-hash";
import { clearPipelineCache, runPipelineRequest, StalePipelineResponseError } from "@/modules/pipeline/pipeline-client";
import type { PipelinePreviewResult } from "@/types";

type PreviewPaneProps = {
  projectId?: string;
  markdown: string;
  assets?: ReportAsset[];
  formatSettings?: FormatSettings;
  sections?: { id: string; order: number; markdown: string; revision?: number }[];
  activeSectionId?: string;
  evidence?: EvidenceItem[];
  darkPreview?: boolean;
  onAttachImageRequest?: (sectionId: string, originalRef: string) => void;
};

function TocBlock({ toc }: { toc: TocNode[] }) {
  if (toc.length === 0) {
    return null;
  }
  const html = renderTocToHtml(toc);
  return (
    <div className="ws-toc-container">
      <div className="ws-toc-title">Mục lục</div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

function LofBlock({ lof }: { lof: CaptionEntry[] }) {
  if (lof.length === 0) {
    return null;
  }
  return (
    <div className="ws-lof-container ws-toc-container">
      <div className="ws-lof-title ws-toc-title">Danh mục hình ảnh</div>
      <ul className="ws-lof-list ws-toc-list">
        {lof.map((node) => (
          <li key={node.id} className="ws-lof-item ws-toc-item">
            <a href={`#${node.id}`} className="ws-lof-link ws-toc-link">
              <span className="ws-toc-left">
                <span className="ws-lof-number ws-toc-number">{node.label}</span>{" "}
                <span className="ws-lof-text ws-toc-text">{node.text}</span>
              </span>
              <span className="ws-toc-leader"></span>
              <span className="ws-toc-page">...</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LotBlock({ lot }: { lot: CaptionEntry[] }) {
  if (lot.length === 0) {
    return null;
  }
  return (
    <div className="ws-lot-container ws-toc-container">
      <div className="ws-lot-title ws-toc-title">Danh mục bảng biểu</div>
      <ul className="ws-lot-list ws-toc-list">
        {lot.map((node) => (
          <li key={node.id} className="ws-lot-item ws-toc-item">
            <a href={`#${node.id}`} className="ws-lot-link ws-toc-link">
              <span className="ws-toc-left">
                <span className="ws-lot-number ws-toc-number">{node.label}</span>{" "}
                <span className="ws-lot-text ws-toc-text">{node.text}</span>
              </span>
              <span className="ws-toc-leader"></span>
              <span className="ws-toc-page">...</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PreviewPane({
  projectId = "preview",
  markdown,
  assets = [],
  formatSettings,
  sections,
  activeSectionId,
  evidence = [],
  darkPreview = false,
  onAttachImageRequest,
}: PreviewPaneProps) {
  const [debouncedMarkdown, setDebouncedMarkdown] = useState(markdown);
  const assetSignature = useMemo(
    () => assets.map((asset) => `${asset.id}:${asset.insertedAt}:${asset.mimeType}:${asset.data.length}`).join("|"),
    [assets],
  );

  // Debounce markdown changes to prevent rendering on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMarkdown(markdown);
    }, 250); // 250ms debounce threshold

    return () => {
      clearTimeout(handler);
    };
  }, [markdown]);

  const handlePreviewClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const button = target.closest("button");
      if (!button) return;

      const action = button.getAttribute("data-action");
      if (action === "attach-image" || button.classList.contains("ws-preview-image-missing-btn")) {
        const src = button.getAttribute("data-original-src") || "";
        if (src && onAttachImageRequest) {
          onAttachImageRequest(activeSectionId || "default", src);
        }
      } else if (action === "load-remote-image" || button.classList.contains("ws-preview-image-remote-btn")) {
        const container = button.closest(".ws-preview-image-remote");
        const src = button.getAttribute("data-original-src") || "";
        const alt = button.getAttribute("data-alt") || "";
        if (container && src) {
          const img = document.createElement("img");
          img.src = src;
          img.alt = alt;
          img.setAttribute("referrerpolicy", "no-referrer");
          img.setAttribute("crossorigin", "anonymous");
          img.className = "ws-preview-image-loaded";
          container.replaceWith(img);
        }
      }
    },
    [activeSectionId, onAttachImageRequest],
  );

  const lastSectionId = useMemo(() => {
    if (!sections || sections.length === 0) {
      return null;
    }
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    return sorted[sorted.length - 1]?.id || null;
  }, [sections]);

  const appendixMarkdown = useMemo(() => {
    return buildEvidenceAppendix(evidence);
  }, [evidence]);

  const finalMarkdown = useMemo(() => {
    const isLast = !sections || sections.length === 0 || activeSectionId === lastSectionId;
    if (isLast && appendixMarkdown) {
      return debouncedMarkdown + "\n\n" + appendixMarkdown;
    }
    return debouncedMarkdown;
  }, [debouncedMarkdown, sections, activeSectionId, lastSectionId, appendixMarkdown]);

  const hasContent = finalMarkdown.trim().length > 0;

  // Split markdown to isolate Mermaid diagrams and render them client-only
  const contentParts = useMemo(() => {
    if (!hasContent) {
      return [];
    }
    return finalMarkdown.split(/(```mermaid[\s\S]*?```)/g);
  }, [finalMarkdown, hasContent]);

  const previewSections = useMemo(() => {
    if (!hasContent) return [];
    if (!sections?.length) return [{ id: activeSectionId || "default", markdown: finalMarkdown }];
    return [...sections].sort((a, b) => a.order - b.order).map((section) => {
      let content = section.id === activeSectionId ? debouncedMarkdown : section.markdown;
      if (section.id === lastSectionId && appendixMarkdown) content += `\n\n${appendixMarkdown}`;
      return { id: section.id, markdown: content };
    });
  }, [activeSectionId, appendixMarkdown, debouncedMarkdown, finalMarkdown, hasContent, lastSectionId, sections]);
  const [pipelinePreview, setPipelinePreview] = useState<PipelinePreviewResult>({ parsedParts: [], parsedSections: [] });
  // W24-I: when the worker crashes/times out we keep the last good preview and
  // surface a recoverable banner instead of blanking the pane silently.
  const [previewInterrupted, setPreviewInterrupted] = useState(false);
  const [retryTick, setRetryTick] = useState(0);

  // W24-J: drop this project's cached pipeline responses when the pane unmounts
  // or the project changes, so the bounded cache does not retain stale bytes.
  useEffect(() => () => clearPipelineCache(projectId), [projectId]);

  useEffect(() => {
    if (!hasContent) {
      setPipelinePreview({ parsedParts: [], parsedSections: [] });
      setPreviewInterrupted(false);
      return;
    }
    let active = true;
    const sectionRevisions = Object.fromEntries((sections ?? []).map((section) => [section.id, section.revision ?? 0]));
    const revisionHash = contentHash(previewSections.map((section) => `${section.id}\0${section.markdown}`).join("\0"));
    void runPipelineRequest({
      requestId: crypto.randomUUID(),
      projectId,
      operation: "preview",
      sectionRevisions,
      cacheKey: `preview:${projectId}:${revisionHash}:${contentHash(assetSignature)}`,
      payload: { parts: contentParts, sections: previewSections, assets },
    }).then((response) => {
      if (active && response.ok && response.operation === "preview") {
        setPipelinePreview(response.result);
        setPreviewInterrupted(false);
      }
    }).catch((error: unknown) => {
      // Stale responses are expected (superseded keystroke) — ignore quietly.
      // A real worker crash/timeout keeps the last-known-good preview and flags retry.
      if (!(error instanceof StalePipelineResponseError) && active) {
        setPreviewInterrupted(true);
      }
    });
    return () => { active = false; };
  }, [assetSignature, assets, contentParts, hasContent, previewSections, projectId, sections, retryTick]);

  const parsedParts = pipelinePreview.parsedParts;
  const parsedSections = pipelinePreview.parsedSections;

  // Compute global numbered headings once for correct counter ordering across split content parts
  const globalNumberedHeadings = useMemo(() => {
    const allHeadings: HeadingNode[] = [];
    for (const { id, ast } of parsedSections) {
      const secHeadings = parseHeadings(ast, id);
      allHeadings.push(...secHeadings);
    }
    const globalNumbered = numberHeadings(allHeadings, formatSettings);
    return globalNumbered.filter((h) => h.sectionId === activeSectionId);
  }, [parsedSections, activeSectionId, formatSettings]);

  // Build the unified caption registry
  const captionRegistry = useMemo(() => {
    return buildCaptionRegistry(
      parsedSections,
      formatSettings || { captionNumbering: "continuous" }
    );
  }, [parsedSections, formatSettings]);

  // Extract Lists of Figures and Tables
  const lofData = useMemo(() => {
    if (!formatSettings?.includeListOfFigures) {
      return [];
    }
    return generateListOfFigures(captionRegistry);
  }, [captionRegistry, formatSettings?.includeListOfFigures]);

  const lotData = useMemo(() => {
    if (!formatSettings?.includeListOfTables) {
      return [];
    }
    return generateListOfTables(captionRegistry);
  }, [captionRegistry, formatSettings?.includeListOfTables]);

  // Build the Table of Contents tree
  const tocData = useMemo(() => {
    if (!hasContent || !formatSettings?.includeToc) {
      return [];
    }
    return generateToc(globalNumberedHeadings);
  }, [globalNumberedHeadings, hasContent, formatSettings?.includeToc]);

  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    async function loadQrs() {
      const urlsToResolve = evidence
        .filter((item) => item.qrEnabled && item.url)
        .map((item) => item.url as string);

      if (urlsToResolve.length === 0) {
        if (active) setQrMap({});
        return;
      }

      const uniqueUrls = Array.from(new Set(urlsToResolve));
      const resolvedMap: Record<string, string> = {};

      await Promise.all(
        uniqueUrls.map(async (url) => {
          const dataUrl = await toQrDataUrl(url);
          resolvedMap[url] = dataUrl;
        })
      );

      if (active) {
        setQrMap(resolvedMap);
      }
    }

    loadQrs();
    return () => {
      active = false;
    };
  }, [evidence]);

  useEffect(() => {
    const pageEl = document.querySelector(".ws-preview-page");
    if (pageEl) {
      if (darkPreview) {
        pageEl.classList.add("ws-preview-page--dark");
      } else {
        pageEl.classList.remove("ws-preview-page--dark");
      }
    }
    return () => {
      if (pageEl) {
        pageEl.classList.remove("ws-preview-page--dark");
      }
    };
  }, [darkPreview]);

  const activeCaptionRegistry = useMemo(
    () => captionRegistry.filter((entry) => entry.sectionId === (activeSectionId || "default")),
    [captionRegistry, activeSectionId],
  );

  const renderedParts = useMemo(() => {
    const renderState = { index: 0 };
    const captionState = { figIdx: 0, tableIdx: 0 };

    return parsedParts.map((part, index) => {
      if (part.isMermaid) {
        return {
          key: `mermaid-${index}`,
          isMermaid: true as const,
          code: part.content.replace(/^```mermaid\s*/, "").replace(/\s*```$/, ""),
        };
      }

      const clonedAst = JSON.parse(JSON.stringify(part.ast));
      const numberedAst = injectHeadingNumbers(clonedAst, globalNumberedHeadings, renderState);
      normalizeCaptions(
        [{ id: activeSectionId || "default", ast: numberedAst }],
        activeCaptionRegistry,
        captionState,
      );
      injectQrImages(numberedAst as unknown as EvidenceUnistNode, qrMap);

      return {
        key: `html-${index}`,
        isMermaid: false as const,
        html: renderMdastToHtml(numberedAst),
      };
    });
  }, [parsedParts, globalNumberedHeadings, activeSectionId, activeCaptionRegistry, qrMap]);

  if (!hasContent) {
    return (
      <div className="ws-preview-container-empty">
        <EmptyState title="Chưa có nội dung xem trước" message="Viết nội dung trong editor để bắt đầu hiển thị bản in thử." />
      </div>
    );
  }

  const presetId = formatSettings?.presetId || "academic-default";
  const preset = PRESETS[presetId] || PRESETS["academic-default"];
  const fontFamily = `"${preset.fontFamily || "Times New Roman"}", Times, serif`;
  const fontPt = preset.fontSizePt || 13;
  const lh = preset.lineHeight || 1.5;
  const align = preset.bodyAlign || "justify";
  const { top, right, bottom, left } = preset.margin || { top: "20mm", right: "20mm", bottom: "20mm", left: "30mm" };

  return (
    <div className="ws-preview-container">
      {previewInterrupted && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            padding: "0.5rem 0.75rem",
            margin: "0 0 0.5rem",
            borderRadius: "var(--rs-radius-sm, 6px)",
            background: "var(--rs-color-warning-surface, #fff4e5)",
            color: "var(--rs-color-warning-text, #7a4b00)",
            fontSize: "0.85rem",
          }}
        >
          <span>Xem trước tạm gián đoạn. Nội dung dưới đây là bản mới nhất còn hiển thị được.</span>
          <button type="button" onClick={() => setRetryTick((tick) => tick + 1)} className="ws-preview-retry">
            Thử lại
          </button>
        </div>
      )}
      <style>{`
        .ws-preview-page {
          font-family: ${fontFamily} !important;
          font-size: ${fontPt}pt !important;
          line-height: ${lh} !important;
          text-align: ${align} !important;
          padding-top: ${top} !important;
          padding-right: ${right} !important;
          padding-bottom: ${bottom} !important;
          padding-left: ${left} !important;
          --rs-preview-margin-top: ${top};
          --rs-preview-margin-right: ${right};
          --rs-preview-margin-left: ${left};
        }
        .ws-preview-page p, .ws-preview-page li {
          text-align: ${align} !important;
        }
        .ws-preview-page h1, .ws-preview-page h2, .ws-preview-page h3, .ws-preview-page h4, .ws-preview-page h5, .ws-preview-page h6 {
          font-family: ${fontFamily} !important;
        }
        .ws-preview-page table {
          width: 100%;
          border-collapse: collapse;
          margin: 15pt 0;
        }
        .ws-preview-page table, .ws-preview-page th, .ws-preview-page td {
          border: 1px solid #000;
        }
        .ws-preview-page th, .ws-preview-page td {
          padding: 8pt !important;
          text-align: left;
        }
        
        /* Dark Preview overrides (screen-only; export page stays black-and-white) */
        .ws-preview-page.ws-preview-page--dark {
          background-color: var(--rs-dark-surface-muted) !important;
          color: var(--rs-dark-text) !important;
          box-shadow: var(--rs-elevation-2) !important;
        }
        .ws-preview-page.ws-preview-page--dark table,
        .ws-preview-page.ws-preview-page--dark th,
        .ws-preview-page.ws-preview-page--dark td {
          border-color: var(--rs-dark-border) !important;
        }
        .ws-preview-page.ws-preview-page--dark .ws-toc-leader {
          border-bottom-color: var(--rs-dark-border) !important;
        }
        .ws-preview-page.ws-preview-page--dark .ws-toc-link {
          color: var(--rs-dark-text) !important;
        }
        .ws-preview-page.ws-preview-page--dark .ws-toc-number {
          color: var(--rs-dark-text) !important;
        }
        .ws-preview-page.ws-preview-page--dark .ws-toc-page {
          color: var(--rs-dark-text) !important;
        }
        .ws-preview-page.ws-preview-page--dark h1,
        .ws-preview-page.ws-preview-page--dark h2,
        .ws-preview-page.ws-preview-page--dark h3,
        .ws-preview-page.ws-preview-page--dark h4,
        .ws-preview-page.ws-preview-page--dark h5,
        .ws-preview-page.ws-preview-page--dark h6 {
          color: var(--rs-white) !important;
        }
      `}</style>

      <div className="ws-preview-header-info">
        <span className="ws-preview-scope-label">
          <Info size={14} aria-hidden="true" />
          {sections && sections.length > 0 ? "Xem trước: chương hiện tại" : "Xem trước: toàn báo cáo"}
        </span>
        <span className="ws-preview-heading-hint">
          Tiêu đề được tự động đánh số khi xuất bản — bạn không cần tự gõ số.
        </span>
      </div>
      {formatSettings?.includeToc && <TocBlock toc={tocData} />}
      {formatSettings?.includeListOfFigures && <LofBlock lof={lofData} />}
      {formatSettings?.includeListOfTables && <LotBlock lot={lotData} />}
      {renderedParts.map((part) => {
        if (part.isMermaid) {
          return <MermaidRenderer key={part.key} code={part.code} />;
        }

        return (
          <div
            key={part.key}
            className="ws-preview-html-section"
            dangerouslySetInnerHTML={{ __html: part.html }}
            onClick={handlePreviewClick}
          />
        );
      })}
    </div>
  );
}
