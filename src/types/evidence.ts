// Evidence Kit types — see Design/Modules/Other/CanonicalTypes.md §2.

export type EvidenceKind =
  | "video"
  | "github"
  | "deploy"
  | "drive"
  | "figma"
  | "account"
  | "api-docs"
  | "slide"
  | "other";

export type EvidenceItem = {
  id: string;
  kind: EvidenceKind;
  title: string;
  url?: string;
  note?: string;
  qrEnabled: boolean;
  createdAt: string; // ISO 8601
};
