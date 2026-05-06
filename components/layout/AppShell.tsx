"use client";
import { ReactNode, useEffect } from "react";
import { TopBar } from "./TopBar";
import { Footer } from "./Footer";
import { MatrixRain } from "./MatrixRain";
import { CommandPalette } from "./CommandPalette";
import { CursorTrail } from "./CursorTrail";
import { MouseGlow } from "./MouseGlow";
import { useAppearanceStore } from "@/store/appearance";
import { ErrorBoundary } from "./ErrorBoundary";

export function AppShell({
  children,
  hideFooter,
}: {
  children: ReactNode;
  hideFooter?: boolean;
}) {
  const hydrate = useAppearanceStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="relative min-h-screen bg-[#040706] text-white">
      <MatrixRain opacity={0.3} />
      <MouseGlow />
      <CursorTrail />
      <CommandPalette />

      <div className="relative z-20 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 flex flex-col min-h-0">
          <ErrorBoundary scope="AppShell" fallbackTitle="Halaman ini crash">
            {children}
          </ErrorBoundary>
        </main>
        {!hideFooter && <Footer />}
      </div>
    </div>
  );
}
