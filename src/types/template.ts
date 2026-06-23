// Template schema — see Design/Modules/Other/CanonicalTypes.md §5.
import type { EvidenceKind } from "./evidence";

export type MetadataFieldSpec = {
  key: string;
  label: string;
  type: "text" | "textList";
  required: boolean;
  placeholder?: string;
};

export type TemplateSectionSeed = {
  title: string; // "Mở đầu" — never hard-code "1. ..."
  order: number;
  starterMarkdown: string;
  status: "draft";
};

export type TemplateSchema = {
  id: string;
  name: string;
  description: string;
  metadataFields: MetadataFieldSpec[];
  sections: TemplateSectionSeed[];
  requiredSections: string[];
  requiredEvidenceKinds: EvidenceKind[];
  requiresToc: boolean;
};
