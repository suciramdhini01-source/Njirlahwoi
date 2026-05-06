import { AppShell } from "@/components/layout/AppShell";
import { AgentWizard } from "@/components/agents/AgentWizard";

export default function NewAgentPage() {
  return (
    <AppShell>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <AgentWizard />
      </div>
    </AppShell>
  );
}
