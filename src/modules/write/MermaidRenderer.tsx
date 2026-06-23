"use client";

import React, { useEffect, useRef, useState } from "react";

type MermaidRendererProps = {
  code: string;
};

export function MermaidRenderer({ code }: MermaidRendererProps) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    const renderDiagram = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
        });

        // Generate a unique ID for each mermaid rendering container
        const id = `mermaid-svg-${Math.random().toString(36).substring(2, 9)}`;
        const { svg: svgHtml } = await mermaid.render(id, code);

        if (active) {
          setSvg(svgHtml);
          setError("");
        }
      } catch (err: unknown) {
        if (active) {
          const errMsg = err instanceof Error ? err.message : "Failed to render Mermaid diagram";
          console.error("Mermaid render error:", err);
          setError(errMsg);
        }
      }
    };

    renderDiagram();

    return () => {
      active = false;
    };
  }, [code]);

  if (error) {
    return React.createElement(
      "div",
      {
        className: "mermaid-error",
        style: {
          padding: "var(--rs-space-2)",
          margin: "var(--rs-space-2) 0",
          backgroundColor: "#fde8e8",
          border: "1px solid #f8b4b4",
          borderRadius: "var(--rs-radius-sm)",
          color: "var(--rs-color-severity-error)",
          fontSize: "var(--rs-font-size-xs)",
          fontFamily: "var(--rs-font-family-mono)",
          whiteSpace: "pre-wrap",
        },
      },
      React.createElement("strong", null, "Lỗi biểu đồ Mermaid:"),
      React.createElement("p", { style: { margin: "var(--rs-space-1) 0 0 0" } }, error)
    );
  }

  return React.createElement("div", {
    ref: elementRef,
    className: "mermaid-container",
    style: {
      display: "flex",
      justifyContent: "center",
      padding: "var(--rs-space-4)",
      margin: "var(--rs-space-3) 0",
      backgroundColor: "var(--rs-slate-50)",
      border: "1px solid var(--rs-color-border)",
      borderRadius: "var(--rs-radius-md)",
      overflowX: "auto",
    },
    dangerouslySetInnerHTML: {
      __html: svg || '<span style="color: var(--rs-color-text-muted)">Đang vẽ biểu đồ...</span>',
    },
  });
}
