import { AppShell } from "@/components/layout/AppShell";
import { ClarifyPanel } from "@/components/clarify/ClarifyPanel";

export const dynamic = "force-dynamic";

export default function ClarifyPage() {
  return (
    <AppShell>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ClarifyPanel />
      </div>
    </AppShell>
  );
}
