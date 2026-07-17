import type { ReportProjectBundle, ExportResult } from "@/types";
import { prepareExport } from "./prepare-export";
import { buildPrintableHtml } from "./print-preview";
import mermaid from "mermaid";

/**
 * Triggers PDF export via a hidden print iframe.
 * Renders KaTeX styles locally by inheriting parent styles, renders Mermaid diagrams
 * to static SVGs, decodes local image references, and reports export progress phases.
 */
export async function exportPdfViaBrowserPrint(
  bundle: ReportProjectBundle,
  onPhaseChange?: (phase: "preparing" | "rendering-assets" | "ready" | "printing") => void
): Promise<ExportResult> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      ok: false,
      error: {
        stage: "render-pdf",
        message: "PDF export via browser print can only run in a client environment.",
        recoverable: true,
      },
    };
  }

  onPhaseChange?.("preparing");

  let iframe: HTMLIFrameElement | null = null;
  try {
    // 1. Prepare printable HTML content
    const input = prepareExport(bundle);
    const htmlContent = buildPrintableHtml(input);

    onPhaseChange?.("rendering-assets");

    // 2. Create a hidden print iframe
    iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const iframeWindow = iframe.contentWindow;
    const iframeDoc = iframeWindow?.document;
    if (!iframeWindow || !iframeDoc) {
      throw new Error("Failed to create printing iframe context.");
    }

    // 3. Write raw HTML structure
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    // 4. Set titled context to avoid about:blank in printed headers
    iframeDoc.title = bundle.project.title;

    // 5. Inherit parent stylesheets (resolves local KaTeX and app-compiled rules)
    const parentStyles = document.querySelectorAll("style, link[rel='stylesheet']");
    parentStyles.forEach((styleNode) => {
      iframeDoc.head.appendChild(styleNode.cloneNode(true));
    });

    // 6. Compile Mermaid diagrams to static SVGs locally
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "strict",
      flowchart: { htmlLabels: false },
    });
    const mermaidBlocks = iframeDoc.querySelectorAll("pre code.language-mermaid");
    for (let i = 0; i < mermaidBlocks.length; i++) {
      const block = mermaidBlocks[i];
      const code = block.textContent || "";
      const id = `mermaid-print-${i}`;
      try {
        const { svg } = await mermaid.render(id, code);
        const pre = block.parentElement;
        if (pre) {
          const div = iframeDoc.createElement("div");
          div.className = "mermaid-container";
          div.innerHTML = svg;
          pre.replaceWith(div);
        }
      } catch (err) {
        console.error("Mermaid print render failed:", err);
      }
    }

    // 7. Await all images to fully load and decode
    const imgs = Array.from(iframeDoc.querySelectorAll("img"));
    const imgPromises = imgs.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });
    await Promise.all(imgPromises);

    onPhaseChange?.("ready");
    
    // Give browser a frame to compute lay-outs (with fallback for testing/node environments)
    const raf = typeof window !== "undefined" && window.requestAnimationFrame
      ? window.requestAnimationFrame
      : (cb: FrameRequestCallback | (() => void)) => setTimeout(cb, 0);
    await new Promise((resolve) => raf(resolve as () => void));

    onPhaseChange?.("printing");
    iframeWindow.focus();
    if (typeof iframeWindow.print === "function") {
      iframeWindow.print();
    } else {
      console.warn("iframeWindow.print is not supported in this environment.");
    }

    // Delay cleanup to ensure browser print dialog initializes safely
    const targetIframe = iframe;
    setTimeout(() => {
      try {
        if (targetIframe.parentNode) {
          document.body.removeChild(targetIframe);
        }
      } catch {
        // ignore if already removed
      }
    }, 2000);

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    return { ok: true, blob };
  } catch (error: unknown) {
    if (iframe && iframe.parentNode) {
      document.body.removeChild(iframe);
    }
    const message = error instanceof Error ? error.message : "Failed to render PDF print surface.";
    console.error("PDF export error details:", error);
    return {
      ok: false,
      error: {
        stage: "render-pdf",
        message,
        recoverable: true,
      },
    };
  }
}

/**
 * Server-side Puppeteer PDF rendering engine stub.
 * Disabled by default in MVP. Does not import the puppeteer package.
 */
export function renderPdfWithPuppeteer(_bundle: ReportProjectBundle): ExportResult {
  void _bundle;
  return {
    ok: false,
    error: {
      stage: "render-pdf",
      message: "Puppeteer hardening disabled in MVP.",
      recoverable: false,
    },
  };
}

/**
 * PDF Exporter entry point.
 */
export async function exportPdf(
  bundle: ReportProjectBundle,
  onPhaseChange?: (phase: "preparing" | "rendering-assets" | "ready" | "printing") => void
): Promise<ExportResult> {
  return exportPdfViaBrowserPrint(bundle, onPhaseChange);
}
