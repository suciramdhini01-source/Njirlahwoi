"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";
import { ProviderEntry } from "@/store/provider-store";

interface Props {
  entry: ProviderEntry | null;
  accent: string;
}

export function ModelList({ entry, accent }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!entry?.models) return [];
    const q = query.trim().toLowerCase();
    if (!q) return entry.models;
    return entry.models.filter(
      (m) => m.id.toLowerCase().includes(q) || (m.name || "").toLowerCase().includes(q)
    );
  }, [entry, query]);

  if (!entry || !entry.models || entry.models.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
        <Sparkles className="h-5 w-5 text-gray-500 mx-auto mb-2" />
        <p className="text-xs text-gray-500">
          Test koneksi untuk memuat daftar model
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Cari di ${entry.models.length} model...`}
          className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition"
        />
      </div>

      <div className="max-h-72 overflow-y-auto scrollbar-neon space-y-1 pr-1">
        <AnimatePresence mode="popLayout">
          {filtered.slice(0, 100).map((m) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="group flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-mono text-gray-200 truncate">{m.name || m.id}</p>
                <p className="text-[10px] text-gray-500 truncate">{m.id}</p>
              </div>
              {m.context && (
                <span
                  className="shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: `${accent}20`, color: accent }}
                >
                  {(m.context / 1000).toFixed(0)}K
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length > 100 && (
          <p className="text-[10px] text-gray-500 text-center py-2">
            +{filtered.length - 100} lainnya (sempitkan pencarian)
          </p>
        )}
      </div>
    </div>
  );
}
