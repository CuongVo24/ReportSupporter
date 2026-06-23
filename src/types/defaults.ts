// Bootstrap defaults used when creating a new project bundle (W1 Group C).
import type { FormatSettings } from "./format";

export const SCHEMA_VERSION = 1;

export const DEFAULT_TEMPLATE_ID = "software-project";

export const DEFAULT_FORMAT_SETTINGS: FormatSettings = {
  presetId: "academic-default",
  includeToc: true,
  includeListOfFigures: false,
  includeListOfTables: false,
  captionNumbering: "continuous",
};
