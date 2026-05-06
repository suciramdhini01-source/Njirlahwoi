'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { ChevronDown, Search, Zap, Key, Cloud, RefreshCw } from 'lucide-react';
import { FREE_MODELS, fetchOpenRouterModels, OpenRouterModel } from '@/lib/openrouter';
import { useApiKeyStore } from '@/store/api-key-store';
import { useChatStore } from '@/store/chat-store';
import ProviderFolder from '@/components/ui/ProviderFolder';

interface CfModel { id: string; name: string; }

function TiltCard({ children, onClick, selected }: {
  children: React.ReactNode; onClick: () => void; selected: boolean;
}) {
  const [spring, api] = useSpring(() => ({ rotateX: 0, rotateY: 0, scale: 1 }));
  return (
    <animated.div
      style={{ rotateX: spring.rotateX, rotateY: spring.rotateY, scale: spring.scale, transformStyle: 'preserve-3d' }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        api.start({
          rotateX: ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * 6,
          rotateY: -((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 6,
          scale: 1.02,
        });
      }}
      onMouseLeave={() => api.start({ rotateX: 0, rotateY: 0, scale: 1 })}
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors ${
        selected ? 'bg-neon-purple/20 border border-neon-purple/30' : 'hover:bg-white/5'
      }`}
    >
      {children}
    </animated.div>
  );
}

function MagneticChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const [spring, api] = useSpring(() => ({ x: 0, y: 0 }));
  return (
    <animated.button
      style={spring}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        api.start({ x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.3 });
      }}
      onMouseLeave={() => api.start({ x: 0, y: 0 })}
      onClick={onClick}
      className={`px-2 py-0.5 rounded-full text-[10px] border transition-all whitespace-nowrap ${
        active
          ? 'bg-neon-purple/20 border-neon-purple/40 text-neon-purple'
          : 'bg-white/5 border-white/10 text-gray-500 hover:border-neon-purple/30 hover:text-gray-300'
      }`}
    >
      {label}
    </animated.button>
  );
}

export default function ModelSelector() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'openrouter' | 'cloudflare'>('cloudflare');
  const [viewMode, setViewMode] = useState<'flat' | 'folders'>('flat');
  const [orModels, setOrModels] = useState<OpenRouterModel[]>([]);
  const [cfModels, setCfModels] = useState<CfModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [cfFetched, setCfFetched] = useState(false);
  const [providerFilter, setProviderFilter] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const { openrouterKey, hasKey } = useApiKeyStore();
  const { selectedModel, selectedProvider, setSelectedModel, setSelectedProvider } = useChatStore();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!cfFetched) {
      setCfFetched(true);
      fetch('/api/cloudflare/models').then((r) => r.json()).then((d) => setCfModels(d.models || [])).catch(() => {});
    }
  }, [cfFetched]);

  useEffect(() => {
    if (open && tab === 'openrouter' && openrouterKey && orModels.length === 0) {
      setLoading(true);
      fetchOpenRouterModels(openrouterKey).then(setOrModels).catch(() => {}).finally(() => setLoading(false));
    }
  }, [open, tab, openrouterKey]);

  // Group OR models by provider for folder view
  const orByProvider = orModels.reduce<Record<string, OpenRouterModel[]>>((acc, m) => {
    const p = m.provider;
    if (!acc[p]) acc[p] = [];
    acc[p].push(m);
    return acc;
  }, {});

  const providers = Object.keys(orByProvider).sort();

  const filteredOR = orModels.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.provider.toLowerCase().includes(search.toLowerCase());
    const matchProvider = !providerFilter || m.provider === providerFilter;
    return matchSearch && matchProvider;
  });

  const filteredCF = cfModels.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase())
  );
  const filteredFree = FREE_MODELS.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.provider.toLowerCase().includes(search.toLowerCase())
  );

  const getDisplayName = () => {
    if (selectedProvider === 'cloudflare') {
      return cfModels.find((m) => m.id === selectedModel)?.name || selectedModel.split('/').pop() || 'CF Model';
    }
    const all = [...FREE_MODELS, ...orModels];
    return all.find((m) => m.id === selectedModel)?.name || selectedModel.split('/').pop()?.split(':')[0] || selectedModel;
  };

  const selectModel = (id: string, provider: 'openrouter' | 'cloudflare') => {
    setSelectedModel(id); setSelectedProvider(provider); setOpen(false); setSearch('');
  };

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 glass rounded-xl px-3 py-2 text-sm hover:bg-white/10 transition-all border border-white/10"
      >
        <Zap size={12} className="text-neon-purple flex-shrink-0" />
        <span className="text-xs text-white/80 max-w-[140px] truncate">{getDisplayName()}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={12} className="text-gray-500 flex-shrink-0" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            className="absolute top-full mt-2 right-0 z-50 w-96 glass rounded-2xl border border-white/10 shadow-2xl shadow-black/60 overflow-hidden"
          >
            {/* Search */}
            <div className="p-3 border-b border-white/10">
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                <Search size={12} className="text-gray-500 flex-shrink-0" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari model atau provider..."
                  className="flex-1 bg-transparent text-sm text-white/80 placeholder-gray-600 outline-none"
                />
                {loading && (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                    <RefreshCw size={12} className="text-neon-purple" />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {[
                { key: 'cloudflare', label: '☁️ Cloudflare', icon: <Cloud size={11} /> },
                { key: 'openrouter', label: '🔗 OpenRouter', icon: <Key size={11} /> },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs transition-all relative ${
                    tab === t.key ? 'text-neon-purple font-medium' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {t.icon}{t.label}
                  {tab === t.key && (
                    <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-purple" />
                  )}
                </button>
              ))}
            </div>

            {/* Provider filter chips + view toggle (OR only, flat view) */}
            <AnimatePresence>
              {tab === 'openrouter' && hasKey() && !loading && orModels.length > 0 && !search && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-white/10"
                >
                  <div className="px-3 py-2 flex flex-wrap gap-1.5 items-center">
                    <MagneticChip label="Semua" active={!providerFilter && viewMode === 'flat'} onClick={() => { setProviderFilter(''); setViewMode('flat'); }} />
                    <MagneticChip label="📁 Folder" active={viewMode === 'folders'} onClick={() => { setViewMode('folders'); setProviderFilter(''); }} />
                    {providers.slice(0, 8).map((p) => (
                      <MagneticChip key={p} label={p} active={providerFilter === p && viewMode === 'flat'} onClick={() => { setProviderFilter(p === providerFilter ? '' : p); setViewMode('flat'); }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Model list */}
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.14 }}
                className="max-h-72 overflow-y-auto"
              >
                {tab === 'cloudflare' ? (
                  <div className="p-2 space-y-0.5">
                    <p className="px-2 py-1 text-[9px] font-bold text-gray-600 uppercase tracking-wider">Cloudflare Workers AI</p>
                    {filteredCF.length === 0 ? (
                      <p className="text-center text-xs text-gray-600 py-4">Memuat model...</p>
                    ) : filteredCF.map((m) => (
                      <TiltCard key={m.id} selected={selectedModel === m.id && selectedProvider === 'cloudflare'} onClick={() => selectModel(m.id, 'cloudflare')}>
                        <div className="min-w-0">
                          <p className="text-xs text-white/90 truncate">{m.name}</p>
                          <p className="text-[10px] text-gray-500">Cloudflare · Gratis</p>
                        </div>
                        <span className="ml-2 px-1.5 py-0.5 text-[9px] rounded-md bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 flex-shrink-0">☁️</span>
                      </TiltCard>
                    ))}
                  </div>
                ) : (
                  <div className="p-2 space-y-0.5">
                    {!hasKey() ? (
                      <div className="py-8 text-center px-4">
                        <Key size={22} className="text-neon-purple mx-auto mb-3" />
                        <p className="text-sm text-gray-400 mb-1">OpenRouter BYOK</p>
                        <p className="text-xs text-gray-600">Masukkan API key OpenRouter untuk akses 55+ provider</p>
                      </div>
                    ) : loading ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <motion.div key={i} className="w-2 h-2 rounded-full bg-neon-purple" animate={{ y: [0, -8, 0] }} transition={{ duration: 0.5, delay: i * 0.12, repeat: Infinity }} />
                          ))}
                        </div>
                        <p className="text-xs text-gray-600">Memuat model...</p>
                      </div>
                    ) : viewMode === 'folders' && !search ? (
                      /* iOS App Folder view */
                      <div>
                        {/* Free models always at top */}
                        <p className="px-2 py-1 text-[9px] font-bold text-gray-600 uppercase tracking-wider">Model Gratis</p>
                        {filteredFree.map((m) => (
                          <TiltCard key={m.id} selected={selectedModel === m.id && selectedProvider === 'openrouter'} onClick={() => selectModel(m.id, 'openrouter')}>
                            <div className="min-w-0">
                              <p className="text-xs text-white/90 truncate">{m.name}</p>
                              <p className="text-[10px] text-gray-500">{m.provider}</p>
                            </div>
                            <span className="ml-2 px-1.5 py-0.5 text-[9px] rounded-md bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 flex-shrink-0">GRATIS</span>
                          </TiltCard>
                        ))}
                        <p className="px-2 py-1.5 text-[9px] font-bold text-gray-600 uppercase tracking-wider mt-1">Provider Folders</p>
                        {providers.map((p) => (
                          <ProviderFolder
                            key={p}
                            provider={p}
                            models={orByProvider[p].map((m) => ({ id: m.id, name: m.name, free: m.free }))}
                            selectedModel={selectedModel}
                            onSelect={(id) => selectModel(id, 'openrouter')}
                          />
                        ))}
                      </div>
                    ) : (
                      /* Flat list */
                      <>
                        {filteredFree.length > 0 && !providerFilter && (
                          <>
                            <p className="px-2 py-1 text-[9px] font-bold text-gray-600 uppercase tracking-wider">Model Gratis</p>
                            {filteredFree.map((m) => (
                              <TiltCard key={m.id} selected={selectedModel === m.id && selectedProvider === 'openrouter'} onClick={() => selectModel(m.id, 'openrouter')}>
                                <div className="min-w-0">
                                  <p className="text-xs text-white/90 truncate">{m.name}</p>
                                  <p className="text-[10px] text-gray-500">{m.provider}</p>
                                </div>
                                <span className="ml-2 px-1.5 py-0.5 text-[9px] rounded-md bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 flex-shrink-0">GRATIS</span>
                              </TiltCard>
                            ))}
                          </>
                        )}
                        {filteredOR.length > 0 && (
                          <>
                            <p className="px-2 py-1 text-[9px] font-bold text-gray-600 uppercase tracking-wider mt-1">
                              {providerFilter || 'Semua Model'} ({filteredOR.length})
                            </p>
                            {filteredOR.slice(0, 60).map((m) => (
                              <TiltCard key={m.id} selected={selectedModel === m.id && selectedProvider === 'openrouter'} onClick={() => selectModel(m.id, 'openrouter')}>
                                <div className="min-w-0">
                                  <p className="text-xs text-white/90 truncate">{m.name}</p>
                                  <p className="text-[10px] text-gray-500">{m.provider}</p>
                                </div>
                                {m.free ? (
                                  <span className="ml-2 px-1.5 py-0.5 text-[9px] rounded-md bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 flex-shrink-0">GRATIS</span>
                                ) : m.pricing ? (
                                  <span className="ml-2 text-[9px] text-gray-600 flex-shrink-0">${parseFloat(m.pricing.prompt || '0').toFixed(4)}</span>
                                ) : null}
                              </TiltCard>
                            ))}
                          </>
                        )}
                        {filteredOR.length === 0 && filteredFree.length === 0 && (
                          <p className="text-center text-xs text-gray-600 py-4">Tidak ada model ditemukan</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
