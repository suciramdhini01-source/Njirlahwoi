import { AppShell } from "@/components/layout/AppShell";
import { AgentCodePanel } from "@/components/agent/AgentCodePanel";

export default function AgentPage() {
  return (
    <AppShell>
      <div className="flex-1 min-h-0">
        <AgentCodePanel />
      </div>
    </AppShell>
  );
}
