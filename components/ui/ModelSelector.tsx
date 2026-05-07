'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { ChevronDown, Search, Zap, Key, Cloud, RefreshCw, X, Code2, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { FREE_MODELS, fetchOpenRouterModels, OpenRouterModel } from '@/lib/openrouter';
import { useApiKeyStore } from '@/store/api-key-store';
import { useChatStore } from '@/store/chat-store';
import ProviderFolder from '@/components/ui/ProviderFolder';

interface CfModel { id: string; name: string; }

function TiltCard({ children, onClick, selected }: { children: React.ReactNode; onClick: () => void; selected: boolean }) {
  const [spring, api] = useSpring(() => ({ rotateX: 0, rotateY: 0, scale: 1 }));
  return (
    <animated.div
      style={{ rotateX: spring.rotateX, rotateY: spring.rotateY, scale: spring.scale, transformStyle: 'preserve-3d' }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        api.start({
          rotateX: ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * 5,
          rotateY: -((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 5,
          scale: 1.02,
        });
      }}
      onMouseLeave={() => api.start({ rotateX: 0, rotateY: 0, scale: 1 })}
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${
        selected ? 'bg-brand-blue/12 border border-brand-blue/20' : 'hover:bg-white/[0.04]'
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
        api.start({ x: (e.clientX - r.left - r.width / 2) * 0.28, y: (e.clientY - r.top - r.height / 2) * 0.28 });
      }}
      onMouseLeave={() => api.start({ x: 0, y: 0 })}
      onClick={onClick}
      className={`px-2 py-0.5 rounded-full text-[10px] border transition-all whitespace-nowrap ${
        active
          ? 'bg-brand-blue/15 border-brand-blue/35 text-brand-blue'
          : 'bg-white/[0.04] border-white/[0.08] text-white/35 hover:border-brand-blue/25 hover:text-white/60'
      }`}
    >
      {label}
    </animated.button>
  );
}

function ModelBadge({ type }: { type?: string }) {
  if (!type) return null;
  const lower = type.toLowerCase();
  if (lower.includes('code')) return <span className="px-1.5 py-0.5 text-[9px] rounded-md bg-brand-amber/10 text-brand-amber border border-brand-amber/20 flex-shrink-0">CODE</span>;
  if (lower.includes('image') || lower.includes('vision')) return <span className="px-1.5 py-0.5 text-[9px] rounded-md bg-brand-pistachio/10 text-brand-pistachio border border-brand-pistachio/20 flex-shrink-0">IMAGE</span>;
  return <span className="px-1.5 py-0.5 text-[9px] rounded-md bg-brand-blue/10 text-brand-blue border border-brand-blue/20 flex-shrink-0">CHAT</span>;
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
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

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

  const orByProvider = orModels.reduce<Record<string, OpenRouterModel[]>>((acc, m) => {
    if (!acc[m.provider]) acc[m.provider] = [];
    acc[m.provider].push(m);
    return acc;
  }, {});
  const providers = Object.keys(orByProvider).sort();

  const filteredOR = orModels.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.provider.toLowerCase().includes(search.toLowerCase());
    const matchProvider = !providerFilter || m.provider === providerFilter;
    return matchSearch && matchProvider;
  });
  const filteredCF = cfModels.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase()));
  const filteredFree = FREE_MODELS.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.provider.toLowerCase().includes(search.toLowerCase()));

  const getDisplayName = () => {
    if (selectedProvider === 'cloudflare') {
      const found = cfModels.find((m) => m.id === selectedModel);
      return found?.name || selectedModel.split('/').pop()?.replace(/-/g, ' ') || 'CF Model';
    }
    const found = [...FREE_MODELS, ...orModels].find((m) => m.id === selectedModel);
    return found?.name || selectedModel.split('/').pop()?.split(':')[0] || selectedModel;
  };

  const selectModel = (id: string, provider: 'openrouter' | 'cloudflare') => {
    setSelectedModel(id);
    setSelectedProvider(provider);
    setOpen(false);
    setSearch('');
  };

  const dropdownContent = (
    <div className="flex flex-col h-full max-h-[80vh] sm:max-h-[440px]">
      {/* Search */}
      <div className="p-3 border-b border-white/[0.07] flex-shrink-0">
        <div className="flex items-center gap-2 bg-[#111118] rounded-xl px-3 py-2 border border-white/[0.07]">
          <Search size={12} className="text-white/30 flex-shrink-0" />
          <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari model atau provider..." className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/20 outline-none min-w-0" />
          {loading && <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}><RefreshCw size={12} className="text-brand-blue flex-shrink-0" /></motion.div>}
          {search && <button onClick={() => setSearch('')} className="text-white/25 hover:text-white/60"><X size={11} /></button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.07] flex-shrink-0">
        {[
          { key: 'cloudflare', label: '☁️ Cloudflare' },
          { key: 'openrouter', label: '🔗 OpenRouter' },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as 'openrouter' | 'cloudflare')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs transition-all relative ${tab === t.key ? 'text-brand-blue font-medium' : 'text-white/30 hover:text-white/60'}`}>
            {t.label}
            {tab === t.key && <motion.div layoutId="tab-indicator-ms" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-blue" />}
          </button>
        ))}
      </div>

      {/* Provider chips */}
      <AnimatePresence>
        {tab === 'openrouter' && hasKey() && !loading && orModels.length > 0 && !search && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-white/[0.07] flex-shrink-0">
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
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.12 }}>
            {tab === 'cloudflare' ? (
              <div className="p-2 space-y-0.5">
                <p className="px-2 py-1 text-[9px] font-bold text-white/20 uppercase tracking-wider">Cloudflare Workers AI — Gratis</p>
                {filteredCF.length === 0 ? (
                  <p className="text-center text-xs text-white/25 py-4">Memuat model...</p>
                ) : filteredCF.map((m) => (
                  <TiltCard key={m.id} selected={selectedModel === m.id && selectedProvider === 'cloudflare'} onClick={() => selectModel(m.id, 'cloudflare')}>
                    <div className="min-w-0">
                      <p className="text-xs text-white/90 truncate">{m.name}</p>
                      <p className="text-[10px] text-white/30">Cloudflare · Server-side · Gratis</p>
                    </div>
                    <ModelBadge type="chat" />
                  </TiltCard>
                ))}
              </div>
            ) : !hasKey() ? (
              <div className="py-8 text-center px-4">
                <Key size={22} className="text-brand-blue mx-auto mb-3" />
                <p className="text-sm text-white/60 mb-1">OpenRouter BYOK</p>
                <p className="text-xs text-white/25">Masukkan API key OpenRouter untuk akses 400+ model dari 60+ provider</p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-brand-blue" animate={{ y: [0, -8, 0] }} transition={{ duration: 0.5, delay: i * 0.12, repeat: Infinity }} />
                  ))}
                </div>
                <p className="text-xs text-white/30">Memuat model...</p>
              </div>
            ) : viewMode === 'folders' && !search ? (
              <div className="p-2 space-y-0.5">
                <p className="px-2 py-1 text-[9px] font-bold text-white/20 uppercase tracking-wider">Model Gratis</p>
                {filteredFree.map((m) => (
                  <TiltCard key={m.id} selected={selectedModel === m.id && selectedProvider === 'openrouter'} onClick={() => selectModel(m.id, 'openrouter')}>
                    <div className="min-w-0"><p className="text-xs text-white/90 truncate">{m.name}</p><p className="text-[10px] text-white/30">{m.provider}</p></div>
                    <span className="ml-2 px-1.5 py-0.5 text-[9px] rounded-md bg-brand-green/10 text-brand-green border border-brand-green/20 flex-shrink-0">GRATIS</span>
                  </TiltCard>
                ))}
                <p className="px-2 py-1.5 text-[9px] font-bold text-white/20 uppercase tracking-wider mt-1">Provider Folders</p>
                {providers.map((p) => (
                  <ProviderFolder key={p} provider={p} models={orByProvider[p].map((m) => ({ id: m.id, name: m.name, free: m.free }))} selectedModel={selectedModel} onSelect={(id) => selectModel(id, 'openrouter')} />
                ))}
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {filteredFree.length > 0 && !providerFilter && (
                  <>
                    <p className="px-2 py-1 text-[9px] font-bold text-white/20 uppercase tracking-wider">Model Gratis</p>
                    {filteredFree.map((m) => (
                      <TiltCard key={m.id} selected={selectedModel === m.id && selectedProvider === 'openrouter'} onClick={() => selectModel(m.id, 'openrouter')}>
                        <div className="min-w-0"><p className="text-xs text-white/90 truncate">{m.name}</p><p className="text-[10px] text-white/30">{m.provider}</p></div>
                        <span className="ml-2 px-1.5 py-0.5 text-[9px] rounded-md bg-brand-green/10 text-brand-green border border-brand-green/20 flex-shrink-0">GRATIS</span>
                      </TiltCard>
                    ))}
                  </>
                )}
                {filteredOR.length > 0 && (
                  <>
                    <p className="px-2 py-1 text-[9px] font-bold text-white/20 uppercase tracking-wider mt-1">{providerFilter || 'Semua Model'} ({filteredOR.length})</p>
                    {filteredOR.slice(0, 80).map((m) => (
                      <TiltCard key={m.id} selected={selectedModel === m.id && selectedProvider === 'openrouter'} onClick={() => selectModel(m.id, 'openrouter')}>
                        <div className="min-w-0"><p className="text-xs text-white/90 truncate">{m.name}</p><p className="text-[10px] text-white/30">{m.provider}</p></div>
                        {m.free ? (
                          <span className="ml-2 px-1.5 py-0.5 text-[9px] rounded-md bg-brand-green/10 text-brand-green border border-brand-green/20 flex-shrink-0">GRATIS</span>
                        ) : m.pricing ? (
                          <span className="ml-2 text-[9px] text-white/25 flex-shrink-0 whitespace-nowrap">${parseFloat(m.pricing.prompt || '0').toFixed(4)}/K</span>
                        ) : <ModelBadge type={m.name} />}
                      </TiltCard>
                    ))}
                  </>
                )}
                {filteredOR.length === 0 && filteredFree.length === 0 && (
                  <p className="text-center text-xs text-white/25 py-4">Tidak ada model ditemukan</p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-[#111118] border border-white/[0.08] rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 hover:bg-[#16161F] hover:border-white/[0.12] transition-all"
      >
        <Zap size={11} className="text-brand-blue flex-shrink-0" />
        <span className="text-[11px] sm:text-xs text-white/75 max-w-[90px] sm:max-w-[130px] truncate">{getDisplayName()}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={11} className="text-white/30 flex-shrink-0" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="sm:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 32, stiffness: 360 }}
              className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A14] border-t border-white/[0.09] rounded-t-2xl shadow-2xl overflow-hidden"
              style={{ maxHeight: '80vh' }}
            >
              <div className="flex justify-center pt-2.5 pb-1"><div className="w-10 h-1 rounded-full bg-white/15" /></div>
              {dropdownContent}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', damping: 28, stiffness: 380 }}
              className="hidden sm:block absolute top-full mt-2 right-0 z-50 w-96 bg-[#0A0A14] border border-white/[0.09] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
            >
              {dropdownContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
