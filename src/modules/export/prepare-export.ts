import type { ReportProjectBundle, FormattedReport, CaptionEntry } from "@/types";
import { parseMarkdown } from "@/lib/markdown-pipeline";
import { parseHeadings, numberHeadings, generateToc } from "@/modules/format";
import { resolveAssetRefs } from "@/modules/write";
import { buildEvidenceAppendix } from "@/modules/evidence";
import { unified } from "unified";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import type { Root as MdastRoot, Content as MdastContent } from "mdast";
import type { Root as HastRoot } from "hast";
import type { CoverPageData, ExportInput } from "./types";
import { getFlatText, injectHeadingNumbers, PRESETS } from "./helpers";

/**
 * Standard processing pipeline orchestrating:
 * 1. Merging section metadata and content
 * 2. Parsing to AST and resolving hierarchical numbering and Table of Contents
 * 3. Resolving figure and table captions
 * 4. Compiling the AST to HAST and MDAST formats
 */
export function prepareExport(bundle: ReportProjectBundle, qrDataUrls: Record<string, string> = {}): ExportInput {
  const { project, assets, formatSettings } = bundle;
  const sortedSections = [...project.sections].sort((a, b) => a.order - b.order);

  // 1. Map cover page data
  const metadata = project.metadata || {};
  const school = typeof metadata.school === "string" ? metadata.school : undefined;
  const course = typeof metadata.course === "string" ? metadata.course : undefined;
  const lecturer = typeof metadata.lecturer === "string" ? metadata.lecturer : undefined;

  let members: string[] | undefined;
  if (Array.isArray(metadata.members)) {
    members = metadata.members;
  } else if (typeof metadata.members === "string") {
    members = [metadata.members];
  }

  const date = typeof metadata.date === "string"
    ? metadata.date
    : new Date().toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" });

  const cover: CoverPageData = {
    title: project.title,
    school,
    course,
    lecturer,
    members,
    date,
  };

  // 2. Parse all sections once and resolve hierarchical numbering and Table of Contents
  const parsedSections = sortedSections.map((sec, idx) => {
    let markdown = sec.markdown;
    if (idx === sortedSections.length - 1) {
      const appendix = buildEvidenceAppendix(bundle.evidence || []);
      if (appendix) {
        markdown += "\n\n" + appendix;
      }
    }
    const resolvedMarkdown = resolveAssetRefs(markdown, assets);
    const ast = parseMarkdown(resolvedMarkdown);
    return { sec, ast };
  });

  const allHeadings = [];
  for (const { sec, ast } of parsedSections) {
    const secHeadings = parseHeadings(ast).map((h) => ({
      ...h,
      sectionId: sec.id,
    }));
    allHeadings.push(...secHeadings);
  }

  const globalNumberedHeadings = numberHeadings(allHeadings);
  const toc = generateToc(globalNumberedHeadings);

  const presetId = formatSettings.presetId || "academic-default";
  const preset = PRESETS[presetId] || PRESETS["academic-default"];

  // 3. Assemble combined AST, inject numbers, and collect figure/table captions
  const combinedChildren: MdastContent[] = [];
  const renderState = { index: 0 };

  const figures: CaptionEntry[] = [];
  const tables: CaptionEntry[] = [];

  let chapterNum = 0;
  let figChapterCount = 0;
  let tableChapterCount = 0;
  let figGlobalCount = 0;
  let tableGlobalCount = 0;

  for (const { sec, ast } of parsedSections) {
    const numberedAst = injectHeadingNumbers(ast, globalNumberedHeadings, renderState);

    const walkChildren = (nodeList: MdastContent[]) => {
      for (let i = 0; i < nodeList.length; i++) {
        const node = nodeList[i];

        if (node.type === "heading" && node.depth === 1) {
          chapterNum++;
          figChapterCount = 0;
          tableChapterCount = 0;
        }

        if (node.type === "image") {
          figChapterCount++;
          figGlobalCount++;
          const num = preset.captionNumbering === "per-chapter" ? figChapterCount : figGlobalCount;
          const label =
            preset.captionNumbering === "per-chapter"
              ? `Hình ${chapterNum}.${figChapterCount}`
              : `Hình ${figGlobalCount}`;

          node.data = {
            ...node.data,
            hProperties: { ...(node.data?.hProperties || {}), id: `fig-${figGlobalCount}` },
          };

          figures.push({
            id: `fig-${figGlobalCount}`,
            kind: "figure",
            number: num,
            label,
            text: node.alt || "",
            sectionId: sec.id,
          });
        }

        if (node.type === "table") {
          tableChapterCount++;
          tableGlobalCount++;
          const num = preset.captionNumbering === "per-chapter" ? tableChapterCount : tableGlobalCount;

          let captionText = "";
          const adjIndices = [i - 1, i + 1];
          for (const idx of adjIndices) {
            if (idx >= 0 && idx < nodeList.length) {
              const adj = nodeList[idx];
              if (adj.type === "paragraph") {
                const text = getFlatText(adj.children || []).trim();
                if (/^(bảng|table)/i.test(text)) {
                  captionText = text.replace(/^(bảng|table)\s*\d+(\.\d+)*\s*[:.-]?\s*/i, "");
                  break;
                }
              }
            }
          }

          const label =
            preset.captionNumbering === "per-chapter"
              ? `Bảng ${chapterNum}.${tableChapterCount}`
              : `Bảng ${tableGlobalCount}`;

          node.data = {
            ...node.data,
            hProperties: { ...(node.data?.hProperties || {}), id: `table-${tableGlobalCount}` },
          };

          tables.push({
            id: `table-${tableGlobalCount}`,
            kind: "table",
            number: num,
            label,
            text: captionText,
            sectionId: sec.id,
          });
        }

        if ("children" in node && Array.isArray(node.children)) {
          walkChildren(node.children as MdastContent[]);
        }
      }
    };

    walkChildren(numberedAst.children);
    combinedChildren.push(...(numberedAst.children as MdastContent[]));
  }

  const combinedMdast: MdastRoot = {
    type: "root",
    children: combinedChildren,
  };

  translateQrPlaceholders(combinedMdast as unknown as UnistNode, qrDataUrls);

  const customSchema = {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      span: [...(defaultSchema.attributes?.span || []), "className", "data-url"],
      div: [...(defaultSchema.attributes?.div || []), "className"],
      code: [...(defaultSchema.attributes?.code || []), "className"],
      pre: [...(defaultSchema.attributes?.pre || []), "className"],
    },
    protocols: {
      ...defaultSchema.protocols,
      src: [...(defaultSchema.protocols?.src || []), "data"],
    },
  };

  const hastProcessor = unified()
    .use(remarkRehype)
    .use(rehypeSanitize, customSchema)
    .use(rehypeKatex)
    .use(rehypeHighlight);

  const hast = hastProcessor.runSync(combinedMdast) as HastRoot;

  const formatted: FormattedReport = {
    projectId: project.id,
    toc,
    figures,
    tables,
    preset,
    hast,
    mdast: combinedMdast,
  };

  return {
    bundle,
    cover,
    formatted,
  };
}

function translateQrPlaceholders(node: UnistNode, qrDataUrls: Record<string, string>) {
  if (!node) return;
  if (node.children && Array.isArray(node.children)) {
    const newChildren: UnistNode[] = [];
    for (const child of node.children) {
      if (child.type === "html" && typeof child.value === "string" && child.value.includes("ws-evidence-qr-placeholder")) {
        const match = child.value.match(/data-url="([^"]+)"/);
        const url = match ? match[1] : "";
        if (url && qrDataUrls[url]) {
          newChildren.push({
            type: "image",
            url: qrDataUrls[url],
            alt: `QR: ${url}`,
          });
          continue;
        }
      }
      translateQrPlaceholders(child, qrDataUrls);
      newChildren.push(child);
    }
    node.children = newChildren;
  }
}

interface UnistNode {
  type: string;
  value?: string;
  url?: string;
  alt?: string;
  children?: UnistNode[];
}
