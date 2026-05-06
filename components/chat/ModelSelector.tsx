"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Search,
  Zap,
  Cloud,
  Sparkles,
  RefreshCw,
  Star,
} from "lucide-react";
import { useApiKeyStore } from "@/store/api-key";
import { useModelStore, NJIR_LAH_MODEL, REPLIT_MODELS, ANTHROPIC_MODELS, GEMINI_MODELS } from "@/store/model";
import { AIModel, ModelSource } from "@/types";

type Tab = "featured" | "all" | "openai" | "claude" | "gemini" | "cloudflare" | "openrouter";

interface Props {
  value: { id: string; source: ModelSource } | null;
  onChange: (m: { id: string; source: ModelSource; name: string }) => void;
}

export function ModelSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("featured");
  const [providerFilter, setProviderFilter] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const { openrouterKey, cloudflareToken, cloudflareAccountId } = useApiKeyStore();
  const { openrouterModels, cloudflareModels, loadingOR, loadingCF, fetchOpenrouter, fetchCloudflare } =
    useModelStore();

  useEffect(() => {
    if (openrouterKey && openrouterModels.length === 0) fetchOpenrouter(openrouterKey);
  }, [openrouterKey, openrouterModels.length, fetchOpenrouter]);

  useEffect(() => {
    if (cloudflareToken && cloudflareAccountId && cloudflareModels.length === 0)
      fetchCloudflare(cloudflareToken, cloudflareAccountId);
  }, [cloudflareToken, cloudflareAccountId, cloudflareModels.length, fetchCloudflare]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  // NJIR LAH always first, then built-in providers, then BYOK providers
  const allModels: AIModel[] = useMemo(
    () => [
      NJIR_LAH_MODEL,
      ...REPLIT_MODELS,
      ...ANTHROPIC_MODELS,
      ...GEMINI_MODELS,
      ...openrouterModels,
      ...cloudflareModels,
    ],
    [openrouterModels, cloudflareModels]
  );

  const featuredIds = useMemo(
    () =>
      new Set([
        NJIR_LAH_MODEL.id,
        "gpt-5.4",
        "claude-opus-4-7",
        "claude-sonnet-4-6",
        "gemini-3.1-pro-preview",
        "gemini-2.5-flash",
        "o3",
      ]),
    []
  );

  const providers = useMemo(() => {
    const s = new Set<string>();
    allModels.forEach((m) => s.add(m.provider));
    return Array.from(s).sort();
  }, [allModels]);

  const filtered = useMemo(() => {
    return allModels.filter((m) => {
      if (tab === "featured" && !featuredIds.has(m.id)) return false;
      if (tab === "openai" && m.source !== "replit") return false;
      if (tab === "claude" && m.source !== "anthropic") return false;
      if (tab === "gemini" && m.source !== "gemini") return false;
      if (tab === "openrouter" && m.source !== "openrouter") return false;
      if (tab === "cloudflare" && m.source !== "cloudflare") return false;
      if (providerFilter && m.provider !== providerFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !m.name.toLowerCase().includes(q) &&
          !m.id.toLowerCase().includes(q) &&
          !m.provider.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [allModels, tab, providerFilter, search, featuredIds]);

  const selected = allModels.find((m) => m.id === value?.id && m.source === value?.source);
  const isNjir = selected?.source === "njiriah";

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2.5 glass rounded-xl px-3 py-2 hover:bg-white/10 transition min-w-[260px] ${
          isNjir ? "border border-neon-pink/40" : ""
        }`}
      >
        <div
          className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
            isNjir
              ? "bg-gradient-to-br from-neon-pink via-neon-purple to-neon-cyan"
              : "bg-gradient-to-br from-neon-purple to-neon-pink"
          }`}
        >
          {isNjir ? (
            <span className="text-[10px] font-black text-white leading-none">NJ</span>
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-xs text-gray-400 leading-none mb-1">Model</p>
          <p className={`text-sm font-medium truncate ${isNjir ? "text-neon-pink" : ""}`}>
            {selected ? selected.name : "Pilih Model"}
          </p>
        </div>
        {isNjir && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 border border-green-500/40 text-green-400 shrink-0">
            GRATIS
          </span>
        )}
        <ChevronDown className={`h-4 w-4 transition shrink-0 ${open ? "rotate-180" : ""}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="absolute left-0 top-full mt-2 glass-strong rounded-2xl overflow-hidden shadow-2xl z-50 w-[560px] max-w-[90vw]"
          >
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari model, provider, ID..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-neon-purple"
                  autoFocus
                />
              </div>

              <div className="flex gap-1 mt-3 overflow-x-auto">
                {(["featured", "all", "openai", "claude", "gemini", "cloudflare", "openrouter"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 capitalize ${
                      tab === t ? "text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {tab === t && (
                      <motion.div
                        layoutId="model-tab"
                        className="absolute inset-0 rounded-lg bg-white/10 border border-white/20"
                      />
                    )}
                    <span className="relative flex items-center gap-1.5">
                      {t === "featured" && <Star className="h-3 w-3 fill-current text-neon-pink" />}
                      {t === "openrouter" && <Zap className="h-3 w-3" />}
                      {t === "cloudflare" && <Cloud className="h-3 w-3" />}
                      {t === "all" ? "Semua" : t}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => {
                    if (openrouterKey) fetchOpenrouter(openrouterKey);
                    if (cloudflareToken && cloudflareAccountId)
                      fetchCloudflare(cloudflareToken, cloudflareAccountId);
                  }}
                  className="ml-auto p-1.5 rounded-lg hover:bg-white/10 text-gray-400 shrink-0"
                  title="Refresh models"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingOR || loadingCF ? "animate-spin" : ""}`} />
                </button>
              </div>

              {providers.length > 1 && (
                <div className="flex gap-1 flex-wrap mt-3 max-h-[72px] overflow-y-auto scrollbar-neon">
                  <button
                    onClick={() => setProviderFilter(null)}
                    className={`px-2 py-0.5 text-[10px] rounded-full border transition ${
                      !providerFilter
                        ? "bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan"
                        : "border-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    All
                  </button>
                  {providers.map((p) => (
                    <motion.button
                      key={p}
                      whileHover={{ y: -1 }}
                      onClick={() => setProviderFilter(providerFilter === p ? null : p)}
                      className={`px-2 py-0.5 text-[10px] rounded-full border transition ${
                        providerFilter === p
                          ? "bg-neon-purple/20 border-neon-purple/50 text-neon-purple"
                          : "border-white/10 text-gray-400 hover:text-white hover:border-white/30"
                      }`}
                    >
                      {p}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            <div className="max-h-[380px] overflow-y-auto scrollbar-neon p-2">
              {filtered.length === 0 && (
                <p className="text-center py-8 text-sm text-gray-400">
                  Tidak ada model yang cocok.
                  {!openrouterKey && !cloudflareToken && (
                    <span className="block mt-1 text-xs">Tambah API key di sidebar untuk model OpenRouter/Cloudflare.</span>
                  )}
                </p>
              )}
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.008 } } }}
                className="space-y-1"
              >
                {filtered.slice(0, 120).map((m) => {
                  const active = value?.id === m.id && value?.source === m.source;
                  const isBuiltin = m.source === "njiriah";
                  return (
                    <motion.button
                      key={`${m.source}-${m.id}`}
                      variants={{ hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0 } }}
                      whileHover={{ x: 2 }}
                      onClick={() => { onChange({ id: m.id, source: m.source, name: m.name }); setOpen(false); }}
                      className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl transition text-left ${
                        active
                          ? isBuiltin
                            ? "bg-neon-pink/20 border border-neon-pink/50"
                            : "bg-neon-purple/20 border border-neon-purple/40"
                          : isBuiltin
                          ? "hover:bg-neon-pink/10 border border-transparent hover:border-neon-pink/25"
                          : "hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <div
                        className={`h-9 w-9 rounded-xl shrink-0 flex items-center justify-center text-[10px] font-bold ${
                          isBuiltin
                            ? "bg-gradient-to-br from-neon-pink via-neon-purple to-neon-cyan"
                            : m.source === "openrouter"
                            ? "bg-neon-purple/20 text-neon-purple"
                            : m.source === "cloudflare"
                            ? "bg-neon-cyan/20 text-neon-cyan"
                            : m.source === "replit"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : m.source === "anthropic"
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {isBuiltin ? (
                          <span className="font-black text-white text-xs leading-none">NJ</span>
                        ) : m.source === "openrouter" ? (
                          <Zap className="h-4 w-4" />
                        ) : m.source === "cloudflare" ? (
                          <Cloud className="h-4 w-4" />
                        ) : m.source === "replit" ? (
                          <span>AI</span>
                        ) : m.source === "anthropic" ? (
                          <span>C</span>
                        ) : (
                          <span>G</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={`text-sm font-semibold ${isBuiltin ? "text-neon-pink" : ""}`}>
                            {m.name}
                          </p>
                          {isBuiltin && (
                            <>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neon-pink/20 text-neon-pink border border-neon-pink/40">
                                BUILT-IN
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/40">
                                GRATIS
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40">
                                SUPABASE EDGE
                              </span>
                            </>
                          )}
                          {!isBuiltin && m.free && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/40">
                              GRATIS
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">
                          {m.description
                            ? m.description.slice(0, 80)
                            : `${m.provider} · ${m.id}`}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
              {filtered.length > 120 && (
                <p className="text-center text-[10px] text-gray-500 py-2">
                  Menampilkan 120 dari {filtered.length}. Ketik untuk cari.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
