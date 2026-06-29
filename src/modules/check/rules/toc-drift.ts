import type { CheckRule, CheckContext, ReportIssue } from "@/types";
import type { Heading as MdastHeading, List as MdastList, ListItem as MdastListItem, Link as MdastLink, Root as MdastRoot } from "mdast";
import { findNodes } from "./utils";
import { flattenNodeText } from "@/lib/markdown-pipeline";
import { parseHeadings, type HeadingNode } from "@/modules/format/parse-headings";
import { numberHeadings, type NumberedHeading } from "@/modules/format/number-headings";

interface TocItem {
  text: string;
  anchorId?: string;
  line?: number;
}

/**
 * Rule: toc-drift
 * Warns if a manually-written Table of Contents list diverges in text,
 * numbering, or link anchors from the actual headings of the document.
 */
export const tocDriftRule: CheckRule = {
  id: "toc-drift",
  severity: "warning",
  detect: ["ast"],
  run(ctx: CheckContext): ReportIssue[] {
    const issues: ReportIssue[] = [];

    // 1. Gather all actual headings in document order
    const allHeadings: HeadingNode[] = [];
    for (const [sectionId, ast] of Object.entries(ctx.sectionAsts)) {
      const secHeadings = parseHeadings(ast).map((h) => ({
        ...h,
        sectionId,
      }));
      allHeadings.push(...secHeadings);
    }
    const numberedHeadings = numberHeadings(allHeadings, ctx.bundle.formatSettings);
    const headingsMap = new Map<string, NumberedHeading>();
    const headingsByText = new Map<string, NumberedHeading>();

    for (const h of numberedHeadings) {
      headingsMap.set(h.id, h);
      headingsByText.set(h.text.toLowerCase().trim(), h);
    }

    // 2. Search for the Table of Contents section
    for (const [sectionId, ast] of Object.entries(ctx.sectionAsts)) {
      const children = ast.children || [];
      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        if (node.type === "heading") {
          const heading = node as MdastHeading;
          const headingText = flattenNodeText(heading).trim().toLowerCase();

          if (
            headingText === "mục lục" ||
            headingText === "table of contents" ||
            headingText === "toc"
          ) {
            // Collect the list immediately following the TOC heading
            let j = i + 1;
            let listNode: MdastList | null = null;
            while (j < children.length) {
              const sibling = children[j];
              // If there's a paragraph/space, skip to find list, but stop if another heading
              if (sibling.type === "heading") break;
              if (sibling.type === "list") {
                listNode = sibling as MdastList;
                break;
              }
              j++;
            }

            if (listNode) {
              const tocItems: TocItem[] = [];
              collectListItems(listNode, tocItems);

              // Validate each item
              for (const item of tocItems) {
                const cleanedTocText = item.text.trim().toLowerCase();

                if (item.anchorId) {
                  const actualHeading = headingsMap.get(item.anchorId);
                  if (!actualHeading) {
                    issues.push({
                      id: "toc-drift",
                      severity: "warning",
                      module: "check",
                      message: `Mục lục liên kết tới neo không tồn tại: "#${item.anchorId}".`,
                      suggestion: "Cập nhật lại đường liên kết neo của mục lục để khớp với tiêu đề.",
                      sectionId,
                      line: item.line,
                    });
                  } else {
                    // Check if text (stripped of number prefix) matches
                    const tocTextNoPrefix = cleanedTocText.replace(/^\s*(?:\d+(?:\.\d+)*)\s*[.)-]?\s+/, "").trim();
                    const expectedShort = actualHeading.text.trim().toLowerCase();
                    const isMatched = tocTextNoPrefix === expectedShort;

                    if (!isMatched) {
                      issues.push({
                        id: "toc-drift",
                        severity: "warning",
                        module: "check",
                        message: `Nội dung mục lục bị lệch so với tiêu đề thực tế: "${item.text}" (thực tế: "${actualHeading.number}. ${actualHeading.text}").`,
                        suggestion: "Cập nhật lại nhãn tiêu đề hoặc số thứ tự trong mục lục.",
                        sectionId,
                        line: item.line,
                      });
                    }
                  }
                } else {
                  // Text-only TOC item (no link)
                  const textWithoutPrefix = cleanedTocText.replace(/^\s*(?:\d+(?:\.\d+)*)\s*[.)-]?\s+/, "").trim();
                  const actualHeading = headingsByText.get(textWithoutPrefix);

                  if (!actualHeading) {
                    issues.push({
                      id: "toc-drift",
                      severity: "warning",
                      module: "check",
                      message: `Mục lục chứa tiêu đề không tồn tại trong tài liệu: "${item.text}".`,
                      suggestion: "Xóa mục lục thừa hoặc cập nhật đúng tên tiêu đề.",
                      sectionId,
                      line: item.line,
                    });
                  } else {
                    const expectedNum = actualHeading.number.toLowerCase();
                    if (!cleanedTocText.includes(expectedNum)) {
                      issues.push({
                        id: "toc-drift",
                        severity: "warning",
                        module: "check",
                        message: `Số thứ tự mục lục bị lệch: "${item.text}" (Số thực tế: "${actualHeading.number}").`,
                        suggestion: "Sửa lại số thứ tự trong mục lục để đồng bộ với tài liệu.",
                        sectionId,
                        line: item.line,
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return issues;
  },
};

function collectListItems(listNode: MdastList, items: TocItem[]) {
  const children = listNode.children || [];
  for (const child of children) {
    if (child.type === "listItem") {
      const listItem = child as MdastListItem;
      const firstChild = listItem.children?.[0];
      if (!firstChild) continue;

      const links = findNodes(firstChild as unknown as MdastRoot, "link");
      const text = flattenNodeText(firstChild as { value?: string; children?: unknown[] }).trim();

      if (links.length > 0) {
        const linkNode = links[0] as unknown as MdastLink;
        const linkText = flattenNodeText(linkNode).trim();
        const url = linkNode.url || "";
        const anchorId = url.startsWith("#") ? url.slice(1) : undefined;
        
        items.push({
          text: linkText || text,
          anchorId,
          line: linkNode.position?.start?.line || listItem.position?.start?.line,
        });
      } else if (text) {
        items.push({
          text,
          line: listItem.position?.start?.line,
        });
      }

      // Traverse sublists from secondary children onwards
      const itemChildren = listItem.children || [];
      for (let k = 1; k < itemChildren.length; k++) {
        const subNode = itemChildren[k];
        if (subNode.type === "list") {
          collectListItems(subNode as MdastList, items);
        }
      }
    }
  }
}
