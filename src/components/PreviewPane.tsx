"use client";

import { useEffect, useState, useMemo } from "react";
import { renderMarkdown } from "@/lib/markdown-pipeline";
import { resolveAssetRefs, MermaidRenderer } from "@/modules/write";
import type { ReportAsset } from "@/types";
import "@/lib/katex-styles"; // Import KaTeX CSS styles

type PreviewPaneProps = {
  markdown: string;
  assets?: ReportAsset[];
};

export function PreviewPane({ markdown, assets = [] }: PreviewPaneProps) {
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

  const hasContent = debouncedMarkdown.trim().length > 0;

  // Split markdown to isolate Mermaid diagrams and render them client-only
  const contentParts = useMemo(() => {
    if (!hasContent) return [];
    return debouncedMarkdown.split(/(```mermaid[\s\S]*?```)/g);
  }, [debouncedMarkdown, hasContent]);

  if (!hasContent) {
    return (
      <div 
        className="ws-preview-empty" 
        style={{ color: "var(--rs-color-text-muted)", fontStyle: "italic", padding: "var(--rs-space-2)" }}
      >
        Chưa có nội dung xem trước.
      </div>
    );
  }

  return (
    <div 
      className="ws-preview-container" 
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--rs-space-3)",
        fontFamily: "var(--rs-font-family-ui)",
        fontSize: "var(--rs-font-size-md)",
        lineHeight: "1.6",
        color: "var(--rs-color-text)",
        backgroundColor: "var(--rs-color-surface)",
      }}
    >
      {contentParts.map((part, index) => {
        const isMermaid = part.startsWith("```mermaid") && part.endsWith("```");

        if (isMermaid) {
          // Extract the mermaid code content (strip block fences)
          const code = part
            .replace(/^```mermaid\s*/, "")
            .replace(/\s*```$/, "");
          
          return <MermaidRenderer key={index} code={code} />;
        } else {
          // Render HTML through the unified markdown pipeline
          const rawHtml = renderMarkdown(part);
          // Resolve offline asset references asset:<id> -> base64 data URLs
          const resolvedHtml = resolveAssetRefs(rawHtml, assets);

          return (
            <div
              key={index}
              className="ws-preview-html-section"
              style={{ display: "contents" }}
              dangerouslySetInnerHTML={{ __html: resolvedHtml }}
            />
          );
        }
      })}
    </div>
  );
}
