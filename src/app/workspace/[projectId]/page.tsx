import { WorkspaceLoader } from "@/components/WorkspaceLoader";

export default async function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <WorkspaceLoader projectId={decodeURIComponent(projectId)} />;
}
