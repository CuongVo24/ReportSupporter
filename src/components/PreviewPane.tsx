"use client";

import { useEffect, useState, useMemo } from "react";
import { parseMarkdown, renderMdastToHtml } from "@/lib/markdown-pipeline";
import { resolveAssetRefs, MermaidRenderer } from "@/modules/write";
import { parseHeadings, numberHeadings, generateToc } from "@/modules/format";
import { buildEvidenceAppendix, toQrDataUrl, injectQrImages, type UnistNode as EvidenceUnistNode } from "@/modules/evidence";
import type { ReportAsset, FormatSettings, TocNode, EvidenceItem } from "@/types";
import type { Root as MdastRoot, Heading as MdastHeading, PhrasingContent } from "mdast";
import "@/lib/katex-styles"; // Import KaTeX CSS styles

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

  // Compute global numbered headings once for correct counter ordering across split content parts
  const globalNumberedHeadings = useMemo(() => {
    if (!hasContent) {
      return [];
    }
    if (sections && sections.length > 0) {
      const sortedSections = [...sections].sort((a, b) => a.order - b.order);
      const allHeadings = [];
      for (const sec of sortedSections) {
        let content = sec.id === activeSectionId ? debouncedMarkdown : sec.markdown;
        if (sec.id === lastSectionId && appendixMarkdown) {
          content = content + "\n\n" + appendixMarkdown;
        }
        const resolvedMarkdown = resolveAssetRefs(content, assets);
        const ast = parseMarkdown(resolvedMarkdown);
        const secHeadings = parseHeadings(ast, sec.id);
        allHeadings.push(...secHeadings);
      }
      const globalNumbered = numberHeadings(allHeadings);
      return globalNumbered.filter((h) => h.sectionId === activeSectionId);
    } else {
      const ast = parseMarkdown(finalMarkdown);
      const headings = parseHeadings(ast, activeSectionId);
      return numberHeadings(headings);
    }
  }, [sections, activeSectionId, debouncedMarkdown, finalMarkdown, lastSectionId, appendixMarkdown, assets, hasContent]);

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
    return <div className="ws-preview-empty">Chưa có nội dung xem trước.</div>;
  }

  // Render cursor to track heading index across parts
  const renderState = { index: 0 };

  return (
    <div className="ws-preview-container">
      {formatSettings?.includeToc && <TocBlock toc={tocData} />}
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
