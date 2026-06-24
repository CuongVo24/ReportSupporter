import { getTemplate } from "@/modules/write";
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
 */
export function getFlatText(nodes: PhrasingContent[]): string {
  let text = "";
  for (const node of nodes) {
    if ("value" in node && typeof node.value === "string") {
      text += node.value;
    } else if ("children" in node && Array.isArray(node.children)) {
      text += getFlatText(node.children as PhrasingContent[]);
    }
  }
  return text;
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
