'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Zap, Key, Cloud } from 'lucide-react';
import { FREE_MODELS, fetchOpenRouterModels, OpenRouterModel } from '@/lib/openrouter';
import { DEFAULT_CLOUDFLARE_MODELS, CloudflareModel } from '@/lib/cloudflare';
import { useApiKeyStore } from '@/store/api-key-store';
import { useChatStore } from '@/store/chat-store';

export default function ModelSelector() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [orModels, setOrModels] = useState<OpenRouterModel[]>([]);
  const [cfModels, setCfModels] = useState<CloudflareModel[]>(DEFAULT_CLOUDFLARE_MODELS);
  const [activeTab, setActiveTab] = useState<'free' | 'openrouter' | 'cloudflare'>('free');
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { openrouterKey, cloudflareToken, cloudflareAccountId } = useApiKeyStore();
  const { selectedModel, selectedProvider, setSelectedModel, setSelectedProvider } = useChatStore();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (openrouterKey && open && activeTab === 'openrouter') {
      setLoading(true);
      fetchOpenRouterModels(openrouterKey)
        .then(setOrModels)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [openrouterKey, open, activeTab]);

  const allFreeModels = FREE_MODELS;
  const filteredFree = allFreeModels.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.provider.toLowerCase().includes(search.toLowerCase())
  );
  const filteredOR = orModels.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.provider.toLowerCase().includes(search.toLowerCase())
  );
  const filteredCF = cfModels.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase())
  );

  const getDisplayName = () => {
    if (selectedProvider === 'cloudflare') {
      return cfModels.find((m) => m.id === selectedModel)?.name || selectedModel;
    }
    const all = [...allFreeModels, ...orModels];
    const found = all.find((m) => m.id === selectedModel);
    return found?.name || selectedModel.split('/').pop()?.split(':')[0] || selectedModel;
  };

  const selectModel = (id: string, provider: 'openrouter' | 'cloudflare') => {
    setSelectedModel(id);
    setSelectedProvider(provider);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 glass rounded-xl px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-all max-w-[200px]"
      >
        <Zap size={13} className="text-neon-purple flex-shrink-0" />
        <span className="truncate text-xs">{getDisplayName()}</span>
        <ChevronDown size={13} className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 z-50 w-80 glass rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
          >
            <div className="p-3 border-b border-white/10">
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                <Search size={13} className="text-gray-500 flex-shrink-0" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari model..."
                  className="bg-transparent text-sm text-white/80 placeholder-gray-600 outline-none flex-1"
                />
              </div>
            </div>

            <div className="flex border-b border-white/10">
              {[
                { key: 'free', label: 'Gratis', icon: <Zap size={11} /> },
                { key: 'openrouter', label: 'OpenRouter', icon: <Key size={11} /> },
                { key: 'cloudflare', label: 'Cloudflare', icon: <Cloud size={11} /> },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 text-[11px] transition-colors ${
                    activeTab === tab.key
                      ? 'text-neon-purple border-b-2 border-neon-purple'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="max-h-64 overflow-y-auto">
              {activeTab === 'free' && (
                <div className="p-2">
                  {filteredFree.length === 0 ? (
                    <p className="text-center text-xs text-gray-600 py-4">Tidak ada hasil</p>
                  ) : (
                    filteredFree.map((m) => (
                      <ModelItem
                        key={m.id}
                        id={m.id}
                        name={m.name}
                        provider={m.provider}
                        free
                        selected={selectedModel === m.id && selectedProvider === 'openrouter'}
                        onClick={() => selectModel(m.id, 'openrouter')}
                      />
                    ))
                  )}
                </div>
              )}
              {activeTab === 'openrouter' && (
                <div className="p-2">
                  {!openrouterKey ? (
                    <div className="py-6 text-center">
                      <Key size={20} className="text-neon-purple mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Masukkan OpenRouter API key</p>
                      <p className="text-xs text-gray-600 mt-1">untuk akses semua model</p>
                    </div>
                  ) : loading ? (
                    <div className="flex items-center justify-center py-8 gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-neon-purple animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-bounce [animation-delay:0.1s]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-neon-pink animate-bounce [animation-delay:0.2s]" />
                    </div>
                  ) : filteredOR.length === 0 ? (
                    <p className="text-center text-xs text-gray-600 py-4">Tidak ada model</p>
                  ) : (
                    filteredOR.slice(0, 80).map((m) => (
                      <ModelItem
                        key={m.id}
                        id={m.id}
                        name={m.name}
                        provider={m.provider}
                        free={m.free}
                        selected={selectedModel === m.id && selectedProvider === 'openrouter'}
                        onClick={() => selectModel(m.id, 'openrouter')}
                      />
                    ))
                  )}
                </div>
              )}
              {activeTab === 'cloudflare' && (
                <div className="p-2">
                  {!cloudflareToken ? (
                    <div className="py-4 text-center">
                      <Cloud size={20} className="text-neon-cyan mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Masukkan Cloudflare API key</p>
                    </div>
                  ) : (
                    filteredCF.map((m) => (
                      <ModelItem
                        key={m.id}
                        id={m.id}
                        name={m.name}
                        provider="Cloudflare"
                        free={false}
                        selected={selectedModel === m.id && selectedProvider === 'cloudflare'}
                        onClick={() => selectModel(m.id, 'cloudflare')}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModelItem({
  id, name, provider, free, selected, onClick,
}: {
  id: string; name: string; provider: string; free: boolean; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
        selected ? 'bg-neon-purple/20 border border-neon-purple/30' : 'hover:bg-white/5'
      }`}
    >
      <div className="min-w-0">
        <p className="text-xs text-white/90 truncate">{name}</p>
        <p className="text-[10px] text-gray-500 truncate">{provider}</p>
      </div>
      {free && (
        <span className="ml-2 px-1.5 py-0.5 text-[9px] rounded-md bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 flex-shrink-0">
          GRATIS
        </span>
      )}
    </button>
  );
}
