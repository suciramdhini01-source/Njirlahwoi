import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export default function WorkspacePage({ params }: { params: { projectId: string } }) {
  return <WorkspaceShell projectId={params.projectId} />;
}
