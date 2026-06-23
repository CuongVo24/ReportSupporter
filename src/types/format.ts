// Format types — see Design/Modules/Other/CanonicalTypes.md §3.
// W1 only needs FormatPreset + FormatSettings; TocNode/CaptionEntry/FormattedReport land with Format (W3).

export type FormatPreset = {
  id: string;
  page: "A4";
  margin: { top: string; right: string; bottom: string; left: string };
  fontFamily: string;
  fontSizePt: 13 | 14;
  lineHeight: number;
  bodyAlign: "justify" | "left";
  chapterStartsNewPage: boolean;
  captionNumbering: "continuous" | "per-chapter";
  header?: string;
  footer?: string;
};

export type FormatSettings = {
  presetId: string;
  includeToc: boolean;
  includeListOfFigures: boolean;
  includeListOfTables: boolean;
  captionNumbering: "continuous" | "per-chapter";
};

/**
 * TOC node generated from numbered headings.
 */
export type TocNode = {
  id: string;            // anchor slug, e.g. "1-1-kien-truc" (see lib/slugify)
  number: string;        // "1.1"
  text: string;          // "Kiến trúc hệ thống"
  level: number;         // 1..6 (h1..h6)
  sectionId: string;     // ReportSection containing this heading
  children: TocNode[];   // hierarchical tree
};

/**
 * Numbered figure/table caption entry.
 */
export type CaptionEntry = {
  id: string;            // anchor for cross-reference
  kind: "figure" | "table";
  number: number;        // running number (continuous or per-chapter)
  label: string;         // "Hình 1", "Bảng 2"
  text: string;          // caption description
  sectionId: string;
};

