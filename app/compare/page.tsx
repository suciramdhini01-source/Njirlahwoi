"use client";
import { AppShell } from "@/components/layout/AppShell";
import { CompareView } from "@/components/compare/CompareView";

export default function Page() {
  return (
    <AppShell>
      <CompareView />
    </AppShell>
  );
}
