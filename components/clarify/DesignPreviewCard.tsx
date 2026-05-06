"use client";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { AgentPlan } from "@/store/agent";

export interface PaletteOption {
  id: string;
  name: string;
  palette: Record<string, string>;
  typography: { heading: string; body: string };
  vibe: string;
}

const DEFAULT_ALTERNATIVES: PaletteOption[] = [
  {
    id: "neon-emerald",
    name: "Neon Emerald",
    palette: { bg: "#05050A", surface: "#0B0B12", primary: "#18C493", accent: "#7CF7D0", text: "#E6E6EC" },
    typography: { heading: "Space Grotesk", body: "Inter" },
    vibe: "Dark futurist with emerald glow",
  },
  {
    id: "deep-ocean",
    name: "Deep Ocean",
    palette: { bg: "#05070F", surface: "#0B1220", primary: "#38BDF8", accent: "#22D3EE", text: "#E5EEFA" },
    typography: { heading: "Space Grotesk", body: "Inter" },
    vibe: "Clean corporate dark-blue",
  },
  {
    id: "warm-sunset",
    name: "Warm Sunset",
    palette: { bg: "#0B0706", surface: "#14100E", primary: "#F97316", accent: "#FBBF24", text: "#FFF3E8" },
    typography: { heading: "Space Grotesk", body: "Inter" },
    vibe: "Energetic warm tones",
  },
];

export function buildOptions(plan: AgentPlan | null): PaletteOption[] {
  if (!plan) return DEFAULT_ALTERNATIVES;
  const planned: PaletteOption = {
    id: "plan",
    name: "Rekomendasi Agent",
    palette: plan.designTokens.palette,
    typography: plan.designTokens.typography,
    vibe: plan.designTokens.vibe || "Generated from your prompt",
  };
  return [planned, ...DEFAULT_ALTERNATIVES.slice(0, 2)];
}

interface Props {
  options: PaletteOption[];
  selectedId: string;
  onSelect: (opt: PaletteOption) => void;
}

export function DesignPreviewCard({ options, selectedId, onSelect }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[13px] font-semibold text-white">
          Pilih arah desain
        </h3>
        <span className="text-[10px] text-gray-500">
          Agent akan memakai palet ini saat generate
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {options.map((opt) => {
          const active = opt.id === selectedId;
          const swatches = Object.entries(opt.palette).slice(0, 5);
          return (
            <motion.button
              key={opt.id}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(opt)}
              className={`relative text-left rounded-xl border p-3 transition ${
                active
                  ? "border-[#18C493] bg-[#18C493]/[0.06] shadow-[0_0_16px_rgba(24,196,147,0.25)]"
                  : "border-white/[0.08] bg-[#070b09]/70 hover:bg-white/[0.03]"
              }`}
            >
              {active && (
                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[#18C493] flex items-center justify-center">
                  <Check className="h-3 w-3 text-[#052018]" />
                </div>
              )}
              <div
                className="rounded-lg h-16 relative overflow-hidden mb-2"
                style={{ background: opt.palette.bg || "#05050A" }}
              >
                <div
                  className="absolute inset-2 rounded-md flex items-center justify-center text-[10px] font-semibold"
                  style={{
                    background: opt.palette.surface || "#0B0B12",
                    color: opt.palette.text || "#E6E6EC",
                    fontFamily: opt.typography.heading,
                  }}
                >
                  <span style={{ color: opt.palette.primary }}>Aa</span>
                  <span className="ml-1">Preview</span>
                </div>
              </div>
              <p
                className="text-[12px] font-semibold text-white"
                style={{ fontFamily: opt.typography.heading }}
              >
                {opt.name}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                {opt.vibe}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {swatches.map(([k, v]) => (
                  <div
                    key={k}
                    title={`${k}: ${v}`}
                    className="h-3.5 w-3.5 rounded border border-white/10"
                    style={{ background: v }}
                  />
                ))}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
