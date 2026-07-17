"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Info } from "lucide-react";
import { parseMarkdown, renderMdastToHtml } from "@/lib/markdown-pipeline";
import { resolveAssetRefs, transformUnembeddedImages, MermaidRenderer } from "@/modules/write";
import { parseHeadings, numberHeadings, generateToc, buildCaptionRegistry, normalizeCaptions, generateListOfFigures, generateListOfTables, HeadingNode, injectHeadingNumbers, renderTocToHtml } from "@/modules/format";
import { buildEvidenceAppendix, toQrDataUrl, injectQrImages, type UnistNode as EvidenceUnistNode } from "@/modules/evidence";
import type { ReportAsset, FormatSettings, TocNode, EvidenceItem, CaptionEntry } from "@/types";
import { PRESETS } from "@/modules/export/helpers";
import "@/lib/katex-styles"; // Import KaTeX CSS styles
import { EmptyState } from "@/components/states";

type PreviewPaneProps = {
  markdown: string;
  assets?: ReportAsset[];
  formatSettings?: FormatSettings;
  sections?: { id: string; order: number; markdown: string }[];
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

  const handlePreviewClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const btn = target.closest(".ws-preview-image-missing-btn");
    if (btn && onAttachImageRequest) {
      const originalSrc = btn.getAttribute("data-original-src");
      if (originalSrc) {
        onAttachImageRequest(activeSectionId || "default", originalSrc);
      }
    }
  }, [activeSectionId, onAttachImageRequest]);

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

  // Cache for parsed ASTs of content parts
  const partAstCacheRef = useRef<Map<string, ReturnType<typeof parseMarkdown>>>(new Map());

  const parsedParts = useMemo(() => {
    const newCache = new Map<string, ReturnType<typeof parseMarkdown>>();
    const oldCache = partAstCacheRef.current;
    
    const parts = contentParts.map((part) => {
      const isMermaid = part.startsWith("```mermaid") && part.endsWith("```");
      if (isMermaid) {
        return { isMermaid, content: part, ast: null };
      }
      
      const cacheKey = `${assetSignature}\u0000${part}`;
      let ast = oldCache.get(cacheKey);
      if (!ast) {
        const resolvedMarkdown = resolveAssetRefs(part, assets);
        ast = parseMarkdown(resolvedMarkdown);
        transformUnembeddedImages(ast, assets);
      }
      newCache.set(cacheKey, ast);
      return { isMermaid, content: part, ast };
    });
    
    partAstCacheRef.current = newCache;
    return parts;
  }, [contentParts, assets, assetSignature]);

  // Parse ASTs of all sections once for consistent headings and captions numbering
  const sectionAstCacheRef = useRef<Map<string, {
    content: string;
    assetSignature: string;
    ast: ReturnType<typeof parseMarkdown>;
  }>>(new Map());

  const parsedSections = useMemo(() => {
    if (!hasContent) {
      return [];
    }
    if (sections && sections.length > 0) {
      const sortedSections = [...sections].sort((a, b) => a.order - b.order);
      const nextCache = new Map<string, {
        content: string;
        assetSignature: string;
        ast: ReturnType<typeof parseMarkdown>;
      }>();
      const parsed = sortedSections.map((sec) => {
        let content = sec.id === activeSectionId ? debouncedMarkdown : sec.markdown;
        if (sec.id === lastSectionId && appendixMarkdown) {
          content = content + "\n\n" + appendixMarkdown;
        }
        const cached = sectionAstCacheRef.current.get(sec.id);
        if (cached && cached.content === content && cached.assetSignature === assetSignature) {
          nextCache.set(sec.id, cached);
          return { id: sec.id, ast: cached.ast };
        }
        const resolvedMarkdown = resolveAssetRefs(content, assets);
        const ast = parseMarkdown(resolvedMarkdown);
        transformUnembeddedImages(ast, assets);
        nextCache.set(sec.id, { content, assetSignature, ast });
        return { id: sec.id, ast };
      });
      sectionAstCacheRef.current = nextCache;
      return parsed;
    } else {
      const id = activeSectionId || "default";
      const cached = sectionAstCacheRef.current.get(id);
      if (cached && cached.content === finalMarkdown && cached.assetSignature === assetSignature) {
        return [{ id, ast: cached.ast }];
      }
      const resolvedMarkdown = resolveAssetRefs(finalMarkdown, assets);
      const ast = parseMarkdown(resolvedMarkdown);
      transformUnembeddedImages(ast, assets);
      sectionAstCacheRef.current = new Map([[id, { content: finalMarkdown, assetSignature, ast }]]);
      return [{ id, ast }];
    }
  }, [sections, activeSectionId, debouncedMarkdown, lastSectionId, appendixMarkdown, assets, assetSignature, finalMarkdown, hasContent]);

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
