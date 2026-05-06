"use client";
import { motion } from "framer-motion";
import { RefreshCw, Lock } from "lucide-react";
import { ReactNode, useState } from "react";
import { DeviceKind, deviceDims } from "./DeviceControls";
import { PreviewErrorBoundary } from "./PreviewErrorBoundary";

export function BrowserFrame({
  children,
  device = "desktop",
  url = "https://njirlah.ai/preview",
}: {
  children: ReactNode;
  device?: DeviceKind;
  url?: string;
}) {
  const [spin, setSpin] = useState(false);
  const dims = deviceDims(device);
  const scale = device === "desktop" ? undefined : undefined;

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 180, damping: 22 }}
      style={{ maxWidth: "100%", width: "100%" }}
      className="flex items-center justify-center"
    >
      <motion.div
        layout
        style={{ width: dims.w, height: dims.h, maxWidth: "100%" }}
        className="relative rounded-2xl overflow-hidden glass-strong shadow-2xl border border-white/10"
      >
        <div className="h-10 border-b border-white/10 flex items-center gap-2 px-3 bg-black/40 backdrop-blur-xl">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 mx-3 flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-gray-300 truncate">
            <Lock className="h-3 w-3 text-green-400 shrink-0" />
            <span className="truncate">{url}</span>
          </div>
          <button
            onClick={() => {
              setSpin(true);
              setTimeout(() => setSpin(false), 700);
            }}
            className="p-1.5 rounded-md hover:bg-white/10 text-gray-300"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 transition ${spin ? "animate-spin" : ""}`}
            />
          </button>
        </div>
        <div className="absolute inset-0 top-10 bg-white">
          <PreviewErrorBoundary>{children}</PreviewErrorBoundary>
        </div>
      </motion.div>
    </motion.div>
  );
}
