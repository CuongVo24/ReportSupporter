import type { Root as MdastRoot } from "mdast";

/**
 * A single section parsed into AST.
 * See Design/Modules/Other/CanonicalTypes.md §7.
 */
export type ParsedSection = {
  sectionId: string;
  markdown: string;
  ast: MdastRoot;         // mdast Root from remark-parse
  updatedAt: string;      // ISO 8601
};

/**
 * Output of the orchestrator after merging and parsing all sections.
 * See Design/Modules/Other/CanonicalTypes.md §7.
 */
export type PipelineResult = {
  projectId: string;
  sections: ParsedSection[];
  combinedMdast: MdastRoot;
  updatedAt: string;      // ISO 8601
};
