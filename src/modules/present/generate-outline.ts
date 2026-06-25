import type { ReportSection, EvidenceItem, SlideOutline } from "@/types";
import { parseMarkdown, flattenNodeText } from "@/lib/markdown-pipeline";
import { parseHeadings, numberHeadings, type HeadingNode, type NumberedHeading } from "@/modules/format";

interface ASTNode {
  type: string;
  depth?: number;
  url?: string;
  alt?: string;
  children?: ASTNode[];
}

/**
 * Normalizes a URL to a standard comparison format by stripping protocols,
 * prefixes like www., and trailing slashes.
 */
function normalizeUrl(urlStr: string): string {
  let cleaned = urlStr.trim().toLowerCase();
  cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?/, "");
  cleaned = cleaned.replace(/\/$/, "");
  return cleaned;
}

/**
 * Compares two URLs for equivalence ignoring protocol/www/trailing slash.
 */
function matchUrl(urlA: string, urlB: string): boolean {
  return normalizeUrl(urlA) === normalizeUrl(urlB);
}

/**
 * Recursively collects direct list item texts from a list node and its sub-lists.
 */
function extractListBullets(listNode: ASTNode, bulletsList: string[]) {
  if (!listNode || listNode.type !== "list") return;
  if (listNode.children && Array.isArray(listNode.children)) {
    for (const listItem of listNode.children) {
      if (listItem.type === "listItem" && listItem.children && Array.isArray(listItem.children)) {
        for (const child of listItem.children) {
          if (child.type === "paragraph") {
            const text = flattenNodeText(child).trim();
            if (text) {
              bulletsList.push(text);
            }
          } else if (child.type === "list") {
            extractListBullets(child, bulletsList);
          }
        }
      }
    }
  }
}

/**
 * Recursively collects image and link URLs from a node's children.
 */
function collectUrls(node: ASTNode, urls: { url: string; text: string }[]) {
  if (!node) return;
  if ((node.type === "link" || node.type === "image") && typeof node.url === "string") {
    const text = (flattenNodeText(node).trim() || node.alt || "").trim();
    urls.push({ url: node.url, text });
  }
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      collectUrls(child, urls);
    }
  }
}

/**
 * Extracts bullet points and maps evidence references from a list of AST nodes.
 */
function extractBulletsAndEvidence(
  nodes: ASTNode[],
  evidenceList: EvidenceItem[]
): { bullets: string[]; evidenceRefs: string[] } {
  const bullets: string[] = [];
  const evidenceRefs = new Set<string>();

  // Helper to extract first sentence from text
  function getFirstSentence(text: string): string {
    if (!text) return "";
    const sentenceEnd = /([.!?])(\s+|$)/;
    const parts = text.split(sentenceEnd);
    if (parts && parts.length > 0) {
      const first = parts[0].trim();
      const punct = parts[1] || "";
      return first + punct;
    }
    return text.trim();
  }

  for (const node of nodes) {
    // 1. Extract bullets
    if (node.type === "paragraph") {
      const text = flattenNodeText(node).trim();
      if (text) {
        bullets.push(getFirstSentence(text));
      }
    } else if (node.type === "list") {
      extractListBullets(node, bullets);
    } else if (node.type === "heading" && node.depth && node.depth >= 3) {
      const text = flattenNodeText(node).trim();
      if (text) {
        bullets.push(text);
      }
    }

    // 2. Extract evidence references & detect broken links
    const urls: { url: string; text: string }[] = [];
    collectUrls(node, urls);

    const keywords = ["github", "demo", "deploy", "source", "repo", "video", "figma", "minh chứng"];

    for (const entry of urls) {
      const matchedEv = evidenceList.find((e) => e.url && matchUrl(entry.url, e.url));
      if (matchedEv) {
        evidenceRefs.add(matchedEv.id);
      } else {
        const lowerUrl = entry.url.toLowerCase();
        const lowerText = entry.text.toLowerCase();
        const hasKeyword = keywords.some(
          (kw) => lowerUrl.includes(kw) || lowerText.includes(kw)
        );
        if (hasKeyword) {
          bullets.push(`[Cảnh báo: Minh chứng đã bị xóa]`);
        }
      }
    }
  }

  return {
    bullets: bullets.slice(0, 5),
    evidenceRefs: Array.from(evidenceRefs),
  };
}

/**
 * Deterministically generates slide outlines from a report project's sections.
 */
export function generateSlideOutline(
  sections: ReportSection[],
  evidence: EvidenceItem[] = []
): SlideOutline[] {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  // Parse all headings to build a global numbered heading index
  const allHeadings: HeadingNode[] = [];
  for (const s of sortedSections) {
    if (!s.markdown || s.markdown.trim() === "") {
      continue;
    }
    const ast = parseMarkdown(s.markdown);
    const secHeadings = parseHeadings(ast, s.id);
    allHeadings.push(...secHeadings);
  }

  const globalNumbered = numberHeadings(allHeadings);

  const outlines: SlideOutline[] = [];
  let globalSlideIdx = 0;
  let globalHeadingIdx = 0;

  for (const s of sortedSections) {
    if (!s.markdown || s.markdown.trim() === "") {
      continue;
    }

    const ast = parseMarkdown(s.markdown);

    // Segment the children of AST by H1/H2 headings
    const segments: { headingNode?: NumberedHeading; title: string; nodes: ASTNode[] }[] = [];
    let currentSegment: { headingNode?: NumberedHeading; title: string; nodes: ASTNode[] } = {
      title: s.title,
      nodes: [],
    };
    segments.push(currentSegment);

    for (const child of ast.children as ASTNode[]) {
      if (child.type === "heading" && child.depth && child.depth <= 2) {
        const headingText = flattenNodeText(child).trim();
        let numberedHeading: NumberedHeading | undefined;

        while (globalHeadingIdx < globalNumbered.length) {
          const h = globalNumbered[globalHeadingIdx];
          if (h.sectionId === s.id && h.depth === child.depth && h.text === headingText) {
            numberedHeading = h;
            globalHeadingIdx++;
            break;
          }
          globalHeadingIdx++;
        }

        currentSegment = {
          headingNode: numberedHeading,
          title: numberedHeading ? `${numberedHeading.number}. ${numberedHeading.text}` : headingText,
          nodes: [],
        };
        segments.push(currentSegment);
      } else {
        currentSegment.nodes.push(child);
      }
    }

    let segmentIndex = 0;
    for (const segment of segments) {
      const { bullets, evidenceRefs } = extractBulletsAndEvidence(segment.nodes, evidence);
      const isHeadingSlide = !!segment.headingNode;
      const hasContent = bullets.length > 0 || evidenceRefs.length > 0;

      if (isHeadingSlide || hasContent) {
        outlines.push({
          id: `${s.id}-slide-${segmentIndex}`,
          fromSectionId: s.id,
          order: globalSlideIdx++,
          title: segment.title,
          bullets,
          evidenceRefs,
        });
        segmentIndex++;
      }
    }
  }

  return outlines;
}
