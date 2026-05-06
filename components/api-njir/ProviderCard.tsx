"use client";
import { motion } from "framer-motion";
import { Settings, Trash2, Zap, Check, AlertCircle, Loader2 } from "lucide-react";
import { ProviderConfig } from "@/lib/provider-configs";
import { ProviderEntry, ProviderStatus } from "@/store/provider-store";
import { useState } from "react";

const STATUS_MAP: Record<ProviderStatus, { dot: string; label: string; bg: string; ring: string }> = {
  unconfigured: { dot: "bg-gray-500", label: "Belum dikonfigurasi", bg: "bg-gray-500/10", ring: "ring-gray-500/20" },
  untested: { dot: "bg-amber-400", label: "Belum diuji", bg: "bg-amber-500/10", ring: "ring-amber-500/20" },
  ok: { dot: "bg-green-400", label: "Terhubung", bg: "bg-green-500/10", ring: "ring-green-500/20" },
  error: { dot: "bg-red-400", label: "Gagal", bg: "bg-red-500/10", ring: "ring-red-500/20" },
};

interface Props {
  config: ProviderConfig;
  entry: ProviderEntry;
  onConfigure: () => void;
  onTest: () => Promise<boolean>;
  onRemove: () => void;
}

export function ProviderCard({ config, entry, onConfigure, onTest, onRemove }: Props) {
  const [testing, setTesting] = useState(false);
  const st = STATUS_MAP[entry.status];
  const Icon = config.icon;
  const configured = Object.keys(entry.values).length > 0;

  const handleTest = async () => {
    setTesting(true);
    await onTest();
    setTesting(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl overflow-hidden group"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(500px circle at 50% 0%, ${config.accent}22, transparent 60%)`,
        }}
      />

      <div className="relative flex items-start gap-3 mb-4">
        <div
          className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${config.accent}30, ${config.accent}10)`,
            boxShadow: `0 0 22px ${config.accent}22`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color: config.accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-[15px] leading-tight">{config.name}</h3>
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">{config.tagline}</p>
        </div>
      </div>

      <div className="relative flex items-center justify-between mb-4">
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ring-1 ${st.bg} ${st.ring}`}>
          <motion.span
            animate={entry.status === "ok" ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] } : {}}
            transition={{ duration: 1.6, repeat: Infinity }}
            className={`h-1.5 w-1.5 rounded-full ${st.dot}`}
          />
          <span className="text-[10px] font-medium text-gray-200">{st.label}</span>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">
          {entry.modelCount != null ? `${entry.modelCount} model` : config.modelCountLabel}
        </span>
      </div>

      {entry.message && entry.status === "error" && (
        <div className="relative mb-3 text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1.5 flex items-start gap-1.5">
          <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
          <span className="truncate">{entry.message}</span>
        </div>
      )}

      <div className="relative flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={onConfigure}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-gray-200 transition"
        >
          <Settings className="h-3.5 w-3.5" />
          {configured ? "Edit" : "Configure"}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleTest}
          disabled={!configured || testing}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(135deg, ${config.accent}30, ${config.accent}15)`,
            border: `1px solid ${config.accent}44`,
            color: config.accent,
          }}
        >
          {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : entry.status === "ok" ? <Check className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
          Test
        </motion.button>
        {configured && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={onRemove}
            className="p-2 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-gray-400 transition"
            title="Hapus konfigurasi"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
