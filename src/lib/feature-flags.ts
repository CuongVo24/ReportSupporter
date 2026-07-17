export type FeatureFlagName =
  | "projectMigrationDualRead"
  | "pdfSubmission"
  | "pipelineWorker"
  | "smartImportAi"
  | "templateCatalog"
  | "pwa";

function enabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() !== "false";
}

export const FEATURE_FLAGS: Readonly<Record<FeatureFlagName, boolean>> = {
  projectMigrationDualRead: enabled(process.env.NEXT_PUBLIC_FF_PROJECT_MIGRATION_DUAL_READ),
  pdfSubmission: enabled(process.env.NEXT_PUBLIC_FF_PDF_SUBMISSION),
  pipelineWorker: enabled(process.env.NEXT_PUBLIC_FF_PIPELINE_WORKER),
  smartImportAi: enabled(process.env.NEXT_PUBLIC_FF_SMART_IMPORT_AI),
  templateCatalog: enabled(process.env.NEXT_PUBLIC_FF_TEMPLATE_CATALOG),
  pwa: enabled(process.env.NEXT_PUBLIC_FF_PWA),
};

export function isFeatureEnabled(name: FeatureFlagName): boolean {
  return FEATURE_FLAGS[name];
}
