import type { ExportArtifact, ReportProjectBundle } from "@/types";

export function artifactBelongsToProject(artifact: ExportArtifact, bundle: ReportProjectBundle): boolean {
  return artifact.verified && artifact.fileName.length > 0 && bundle.project.id.length > 0;
}
