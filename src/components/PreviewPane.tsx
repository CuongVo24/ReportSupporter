"use client";

import { useEffect, useState, useMemo } from "react";
import { Info } from "lucide-react";
import { parseMarkdown, renderMdastToHtml } from "@/lib/markdown-pipeline";
import { resolveAssetRefs, MermaidRenderer } from "@/modules/write";
import { parseHeadings, numberHeadings, generateToc, buildCaptionRegistry, normalizeCaptions, generateListOfFigures, generateListOfTables, HeadingNode } from "@/modules/format";
import { buildEvidenceAppendix, toQrDataUrl, injectQrImages, type UnistNode as EvidenceUnistNode } from "@/modules/evidence";
import type { ReportAsset, FormatSettings, TocNode, EvidenceItem, CaptionEntry } from "@/types";
import type { Root as MdastRoot, Heading as MdastHeading, PhrasingContent } from "mdast";
import "@/lib/katex-styles"; // Import KaTeX CSS styles
import { EmptyState } from "@/components/states";

type PreviewPaneProps = {
  markdown: string;
  assets?: ReportAsset[];
  formatSettings?: FormatSettings;
  sections?: { id: string; order: number; markdown: string }[];
  activeSectionId?: string;
  evidence?: EvidenceItem[];
};

interface UnistNode {
  type: string;
  children?: UnistNode[];
}

function getHeadingText(nodes: PhrasingContent[]): string {
  let text = "";
  for (const node of nodes) {
    if ("value" in node && typeof node.value === "string") {
      text += node.value;
    } else if ("children" in node && Array.isArray(node.children)) {
      text += getHeadingText(node.children as PhrasingContent[]);
    }
  }
  return text;
}

/**
 * Traverses MDAST in-place to inject heading numbers before heading children.
 * Uses index state tracking to map back to the globalNumberedHeadings correctly across split blocks.
 */
export function injectHeadingNumbers(
  ast: MdastRoot,
  globalNumberedHeadings: { number: string; text: string; id: string }[],
  state: { index: number }
): MdastRoot {
  function walk(node: unknown) {
    if (!node || typeof node !== "object") {
      return;
    }
    const n = node as UnistNode;

    if (n.type === "heading") {
      const heading = n as unknown as MdastHeading;
      const text = getHeadingText(heading.children).trim();
      if (text !== "") {
        const numHeading = globalNumberedHeadings[state.index++];
        if (numHeading && numHeading.text) {
          // Unshift the text node representing the hierarchy prefix (e.g. "1.1 ")
          const numberTextNode: PhrasingContent = {
            type: "text",
            value: `${numHeading.number} `,
          };
          heading.children.unshift(numberTextNode);

          // Assign correct HTML element ID for TOC anchor linking
          heading.data = {
            ...heading.data,
            hProperties: {
              ...(heading.data?.hProperties || {}),
              id: numHeading.id,
            },
          };
        }
      }
    }

    if (n.children && Array.isArray(n.children)) {
      for (const child of n.children) {
        walk(child);
      }
    }
  }

  walk(ast);
  return ast;
}

/**
 * Component displaying the table of contents block.
 */
function TocBlock({ toc }: { toc: TocNode[] }) {
  if (toc.length === 0) {
    return null;
  }

  function renderNodes(nodes: TocNode[]) {
    return (
      <ul className="ws-toc-list">
        {nodes.map((node) => (
          <li key={node.id} className={`ws-toc-item ws-toc-level-${node.level}`}>
            <a href={`#${node.id}`} className="ws-toc-link">
              <span className="ws-toc-number">{node.number}</span>{" "}
              <span className="ws-toc-text">{node.text}</span>
            </a>
            {node.children && node.children.length > 0 && renderNodes(node.children)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="ws-toc-container">
      <div className="ws-toc-title">Mục lục</div>
      {renderNodes(toc)}
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
              <span className="ws-lof-number ws-toc-number">{node.label}</span>{" "}
              <span className="ws-lof-text ws-toc-text">{node.text}</span>
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
              <span className="ws-lot-number ws-toc-number">{node.label}</span>{" "}
              <span className="ws-lot-text ws-toc-text">{node.text}</span>
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
}: PreviewPaneProps) {
  const [debouncedMarkdown, setDebouncedMarkdown] = useState(markdown);

  // Debounce markdown changes to prevent rendering on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMarkdown(markdown);
    }, 250); // 250ms debounce threshold

    return () => {
      clearTimeout(handler);
    };
  }, [markdown]);

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

  // Parse ASTs of all sections once for consistent headings and captions numbering
  const parsedSections = useMemo(() => {
    if (!hasContent) {
      return [];
    }
    if (sections && sections.length > 0) {
      const sortedSections = [...sections].sort((a, b) => a.order - b.order);
      return sortedSections.map((sec) => {
        let content = sec.id === activeSectionId ? debouncedMarkdown : sec.markdown;
        if (sec.id === lastSectionId && appendixMarkdown) {
          content = content + "\n\n" + appendixMarkdown;
        }
        const resolvedMarkdown = resolveAssetRefs(content, assets);
        const ast = parseMarkdown(resolvedMarkdown);
        return { id: sec.id, ast };
      });
    } else {
      const ast = parseMarkdown(finalMarkdown);
      return [{ id: activeSectionId || "default", ast }];
    }
  }, [sections, activeSectionId, debouncedMarkdown, lastSectionId, appendixMarkdown, assets, finalMarkdown, hasContent]);

  // Compute global numbered headings once for correct counter ordering across split content parts
  const globalNumberedHeadings = useMemo(() => {
    const allHeadings: HeadingNode[] = [];
    for (const { id, ast } of parsedSections) {
      const secHeadings = parseHeadings(ast, id);
      allHeadings.push(...secHeadings);
    }
    const globalNumbered = numberHeadings(allHeadings);
    return globalNumbered.filter((h) => h.sectionId === activeSectionId);
  }, [parsedSections, activeSectionId]);

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

  if (!hasContent) {
    return (
      <div className="ws-preview-container-empty">
        <EmptyState title="Chưa có nội dung xem trước" message="Viết nội dung trong editor để bắt đầu hiển thị bản in thử." />
      </div>
    );
  }

  // Render cursor to track heading index across parts
  const renderState = { index: 0 };
  const captionState = { figIdx: 0, tableIdx: 0 };

  return (
    <div className="ws-preview-container">
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
      {contentParts.map((part, index) => {
        const isMermaid = part.startsWith("```mermaid") && part.endsWith("```");

        if (isMermaid) {
          // Extract the mermaid code content (strip block fences)
          const code = part
            .replace(/^```mermaid\s*/, "")
            .replace(/\s*```$/, "");

          return <MermaidRenderer key={index} code={code} />;
        } else {
          // Resolve offline asset references asset:<id> -> base64 data URLs on the markdown first
          const resolvedMarkdown = resolveAssetRefs(part, assets);
          
          // Parse resolved markdown text into AST
          const ast = parseMarkdown(resolvedMarkdown);
          
          // Inject correct heading prefix numbers
          const numberedAst = injectHeadingNumbers(ast, globalNumberedHeadings, renderState);

          // Normalize captions using registry and rendering state
          const activeRegistry = captionRegistry.filter((e) => e.sectionId === (activeSectionId || "default"));
          normalizeCaptions([{ id: activeSectionId || "default", ast: numberedAst }], activeRegistry, captionState);
          
          // Inject QR code images into AST before HTML generation
          injectQrImages(numberedAst as unknown as EvidenceUnistNode, qrMap);

          // Render HTML through the unified markdown pipeline
          const renderedHtml = renderMdastToHtml(numberedAst);

          return (
            <div
              key={index}
              className="ws-preview-html-section"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          );
        }
      })}
    </div>
  );
}
