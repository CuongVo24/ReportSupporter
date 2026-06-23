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
