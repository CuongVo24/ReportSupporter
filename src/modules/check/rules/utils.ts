import { getTemplate } from "@/modules/write";
import { flattenNodeText } from "@/lib/markdown-pipeline";
import type { TemplateSchema } from "@/types";
import type { Root as MdastRoot, PhrasingContent } from "mdast";

/**
 * Returns the template schema registered for the given template ID.
 */
export function getTemplateSchema(templateId: string): TemplateSchema | undefined {
  return getTemplate(templateId);
}

interface UnistNode {
  type: string;
  children?: UnistNode[];
}

/**
 * Helper to extract flat text from AST phrasing content children.
 * Reuses the shared flattenNodeText helper from @/lib.
 */
export function getFlatText(nodes: PhrasingContent[]): string {
  return flattenNodeText({ children: nodes });
}

/**
 * Traverses MDAST to collect all nodes matching a specific type.
 */
export function findNodes(ast: MdastRoot, type: string): unknown[] {
  const results: unknown[] = [];
  function walk(node: unknown) {
    if (!node || typeof node !== "object") {
      return;
    }
    const n = node as UnistNode;
    if (n.type === type) {
      results.push(n);
    }
    if (n.children && Array.isArray(n.children)) {
      for (const child of n.children) {
        walk(child);
      }
    }
  }
  walk(ast);
  return results;
}
