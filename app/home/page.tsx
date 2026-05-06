import { AppShell } from "@/components/layout/AppShell";
import { ChatPanel } from "@/components/chat/ChatPanel";

export default function HomePage() {
  return (
    <AppShell>
      <ChatPanel />
    </AppShell>
  );
}
