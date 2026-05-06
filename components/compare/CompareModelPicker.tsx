"use client";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ModelProvider } from "@/types";

interface Option {
  label: string;
  provider: ModelProvider;
  model: string;
  free?: boolean;
}

const OPTIONS: Option[] = [
  { label: "NJIR LAH (built-in)", provider: "njiriah", model: "njir-lah-v2-turbo", free: true },
  { label: "Replit · GPT-5.4", provider: "replit", model: "gpt-5.4" },
  { label: "Replit · GPT-5 Mini", provider: "replit", model: "gpt-5-mini" },
  { label: "Replit · O3", provider: "replit", model: "o3" },
  { label: "Anthropic · Claude Opus 4.7", provider: "anthropic", model: "claude-opus-4-7" },
  { label: "Anthropic · Sonnet 4.6", provider: "anthropic", model: "claude-sonnet-4-6" },
  { label: "Gemini · 2.5 Pro", provider: "gemini", model: "gemini-2.5-pro" },
  { label: "Gemini · 2.5 Flash", provider: "gemini", model: "gemini-2.5-flash" },
  {
    label: "Cloudflare · Llama 3.1 8B",
    provider: "cloudflare",
    model: "@cf/meta/llama-3.1-8b-instruct",
  },
  {
    label: "Cloudflare · Mistral 7B",
    provider: "cloudflare",
    model: "@cf/mistral/mistral-7b-instruct-v0.1",
  },
];

export function CompareModelPicker({
  value,
  onChange,
}: {
  value: { provider: ModelProvider; model: string };
  onChange: (v: { provider: ModelProvider; model: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = OPTIONS.find(
    (o) => o.provider === value.provider && o.model === value.model
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full glass px-3 py-2 rounded-lg text-xs flex items-center gap-2 hover:bg-white/10 transition"
      >
        <span className="flex-1 truncate text-left">
          {selected?.label || `${value.provider}/${value.model}`}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute z-20 top-full mt-1 w-full glass-strong rounded-lg overflow-hidden shadow-xl max-h-72 overflow-y-auto scrollbar-neon"
          >
            {OPTIONS.map((o) => (
              <button
                key={`${o.provider}-${o.model}`}
                onClick={() => {
                  onChange({ provider: o.provider, model: o.model });
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition flex items-center gap-2"
              >
                <span className="flex-1 truncate">{o.label}</span>
                {o.free && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    FREE
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
