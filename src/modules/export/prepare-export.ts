import type { ReportProjectBundle, FormattedReport, CaptionEntry } from "@/types";
import { parseMarkdown } from "@/lib/markdown-pipeline";
import { parseHeadings, numberHeadings, generateToc, buildCaptionRegistry, normalizeCaptions } from "@/modules/format";
import { resolveAssetRefs } from "@/modules/write";
import { buildEvidenceAppendix, injectQrImages, type UnistNode } from "@/modules/evidence";
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

  // 3. Build unified caption registry and normalize captions in-place
  const captionRegistry = buildCaptionRegistry(
    parsedSections.map((p) => ({ id: p.sec.id, ast: p.ast })),
    preset
  );
  normalizeCaptions(
    parsedSections.map((p) => ({ id: p.sec.id, ast: p.ast })),
    captionRegistry
  );

  const figures = captionRegistry.filter((e) => e.kind === "figure");
  const tables = captionRegistry.filter((e) => e.kind === "table");

  // 4. Assemble combined AST and inject heading numbers
  const combinedChildren: MdastContent[] = [];
  const renderState = { index: 0 };

  for (const { sec, ast } of parsedSections) {
    const numberedAst = injectHeadingNumbers(ast, globalNumberedHeadings, renderState);
    combinedChildren.push(...(numberedAst.children as MdastContent[]));
  }

  const combinedMdast: MdastRoot = {
    type: "root",
    children: combinedChildren,
  };

  injectQrImages(combinedMdast as unknown as UnistNode, qrDataUrls);

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
