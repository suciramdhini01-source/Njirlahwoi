"use client";
import { motion } from "framer-motion";
import { Monitor, Tablet, Smartphone } from "lucide-react";

export type DeviceKind = "desktop" | "tablet" | "mobile";

const OPTIONS: { id: DeviceKind; label: string; icon: any }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor },
  { id: "tablet", label: "Tablet", icon: Tablet },
  { id: "mobile", label: "Mobile", icon: Smartphone },
];

export function DeviceControls({
  value,
  onChange,
}: {
  value: DeviceKind;
  onChange: (v: DeviceKind) => void;
}) {
  return (
    <div className="relative flex items-center gap-1 glass rounded-xl p-1">
      {OPTIONS.map((o) => {
        const active = value === o.id;
        const Icon = o.icon;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`relative px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              active ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {active && (
              <motion.div
                layoutId="device-pill"
                className="absolute inset-0 rounded-lg bg-white/10 border border-white/20"
              />
            )}
            <Icon className="h-3.5 w-3.5 relative" />
            <span className="relative hidden sm:inline">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function deviceDims(d: DeviceKind) {
  switch (d) {
    case "mobile":
      return { w: 390, h: 720 };
    case "tablet":
      return { w: 820, h: 900 };
    default:
      return { w: 1280, h: 800 };
  }
}
