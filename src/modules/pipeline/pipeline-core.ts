import type { PipelineRequest, PipelineResponse } from "@/types";
import { parseMarkdown } from "@/lib/markdown-pipeline";
import { resolveAssetRefs, transformUnembeddedImages } from "@/modules/write/resolve-assets";
import { runChecker } from "@/modules/check/run-checker";
import { prepareExport } from "@/modules/export/prepare-export";

export async function executePipelineRequest(request: PipelineRequest): Promise<PipelineResponse> {
  try {
    if (request.operation === "preview") {
      const parse = (markdown: string) => {
        const ast = parseMarkdown(resolveAssetRefs(markdown, request.payload.assets));
        transformUnembeddedImages(ast, request.payload.assets);
        return ast;
      };
      return {
        requestId: request.requestId,
        projectId: request.projectId,
        operation: "preview",
        sectionRevisions: request.sectionRevisions,
        ok: true,
        result: {
          parsedParts: request.payload.parts.map((content) => {
            const isMermaid = content.startsWith("```mermaid") && content.endsWith("```");
            return { isMermaid, content, ast: isMermaid ? null : parse(content) };
          }),
          parsedSections: request.payload.sections.map((section) => ({ id: section.id, ast: parse(section.markdown) })),
        },
      };
    }
    if (request.operation === "check") {
      return {
        requestId: request.requestId,
        projectId: request.projectId,
        operation: "check",
        sectionRevisions: request.sectionRevisions,
        ok: true,
        result: runChecker(request.payload.bundle),
      };
    }
    const { formatted } = prepareExport(request.payload.bundle, request.payload.qrDataUrls);
    return {
      requestId: request.requestId,
      projectId: request.projectId,
      operation: "format",
      sectionRevisions: request.sectionRevisions,
      ok: true,
      result: { formatted },
    };
  } catch (error: unknown) {
    return {
      requestId: request.requestId,
      projectId: request.projectId,
      operation: request.operation,
      sectionRevisions: request.sectionRevisions,
      ok: false,
      error: error instanceof Error ? error.message : "Pipeline worker failed.",
    };
  }
}
