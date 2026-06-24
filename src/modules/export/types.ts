import type { ReportProjectBundle, FormattedReport } from "@/types";

/**
 * Metadata data used to generate the document cover page.
 * Derived from the project metadata map.
 */
export type CoverPageData = {
  title: string;
  school?: string;
  course?: string;
  lecturer?: string;
  members?: string[];
  date?: string;
};

/**
 * Standard input structure passed to all exporters.
 * Consolidates the original bundle, cover page data, and the formatted report.
 */
export type ExportInput = {
  bundle: ReportProjectBundle;
  cover: CoverPageData;
  formatted: FormattedReport;
};
