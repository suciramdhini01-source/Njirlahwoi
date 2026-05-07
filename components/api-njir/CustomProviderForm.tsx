'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Globe, Cpu, Tag, Plus, Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { CustomProvider } from '@/store/all-api-keys-store';

interface CustomProviderFormProps {
  open: boolean;
  onClose: () => void;
  onAdd: (p: Omit<CustomProvider, 'id' | 'createdAt'>) => Promise<void>;
}

const PRESETS = [
  { name: 'SiliconFlow', baseUrl: 'https://api.siliconflow.cn/v1', modelId: 'Qwen/Qwen2.5-7B-Instruct' },
  { name: 'Ollama Local', baseUrl: 'http://localhost:11434/v1', modelId: 'llama3.1' },
  { name: 'LM Studio', baseUrl: 'http://localhost:1234/v1', modelId: 'local-model' },
  { name: 'Groq Direct', baseUrl: 'https://api.groq.com/openai/v1', modelId: 'mixtral-8x7b-32768' },
  { name: 'Together AI', baseUrl: 'https://api.together.xyz/v1', modelId: 'meta-llama/Llama-3-8b-chat-hf' },
];

export default function CustomProviderForm({ open, onClose, onAdd }: CustomProviderFormProps) {
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelId, setModelId] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');

  const reset = () => {
    setName(''); setBaseUrl(''); setApiKey(''); setModelId('');
    setTestStatus('idle');
  };

  const handleClose = () => { reset(); onClose(); };

  const applyPreset = (p: typeof PRESETS[0]) => {
    setName(p.name);
    setBaseUrl(p.baseUrl);
    setModelId(p.modelId);
  };

  const handleTest = async () => {
    if (!baseUrl.trim()) return;
    setTestStatus('testing');
    try {
      const url = `${baseUrl.replace(/\/$/, '')}/models`;
      const headers: Record<string, string> = {};
      if (apiKey.trim()) headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      const res = await fetch(url, { headers });
      setTestStatus(res.ok ? 'valid' : 'invalid');
    } catch {
      setTestStatus('invalid');
    }
  };

  const handleAdd = async () => {
    if (!name.trim() || !baseUrl.trim()) return;
    setSaving(true);
    try {
      await onAdd({ name: name.trim(), baseUrl: baseUrl.trim(), apiKey: apiKey.trim(), modelId: modelId.trim() });
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[520px] z-50 glass border border-white/15 rounded-2xl shadow-2xl shadow-black/60 max-h-[80vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div>
                <h2 className="font-heading font-bold text-white text-base gradient-text">Tambah Custom Provider</h2>
                <p className="text-xs text-gray-500 mt-0.5">OpenAI-compatible endpoint apa pun</p>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/10 transition-colors">
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Presets */}
              <div>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-2">Quick Presets</p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => applyPreset(p)}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:border-neon-purple/40 hover:text-white hover:bg-neon-purple/10 transition-all"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-[11px] text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <Tag size={10} /> Nama Provider
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Cline Local, SiliconFlow, ..."
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 placeholder-gray-700 outline-none focus:border-neon-purple/40 transition-colors"
                />
              </div>

              {/* Base URL */}
              <div>
                <label className="text-[11px] text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <Globe size={10} /> Base URL
                </label>
                <div className="flex gap-2">
                  <input
                    value={baseUrl}
                    onChange={(e) => { setBaseUrl(e.target.value); setTestStatus('idle'); }}
                    placeholder="https://api.example.com/v1"
                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 placeholder-gray-700 outline-none focus:border-neon-purple/40 transition-colors font-mono"
                  />
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={handleTest}
                    disabled={!baseUrl.trim() || testStatus === 'testing'}
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 hover:border-neon-cyan/30 hover:text-neon-cyan disabled:opacity-40 transition-all flex items-center gap-1.5"
                  >
                    {testStatus === 'testing' ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : testStatus === 'valid' ? (
                      <CheckCircle size={11} className="text-emerald-400" />
                    ) : testStatus === 'invalid' ? (
                      <XCircle size={11} className="text-red-400" />
                    ) : null}
                    Test
                  </motion.button>
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="text-[11px] text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <Lock size={10} /> API Key <span className="text-gray-700">(opsional)</span>
                </label>
                <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-3 py-2 focus-within:border-neon-purple/40 transition-colors">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="flex-1 bg-transparent text-xs text-white/80 placeholder-gray-700 outline-none font-mono"
                  />
                  <button onClick={() => setShowKey(!showKey)} className="text-gray-600 hover:text-gray-400">
                    <span className="text-[10px]">{showKey ? 'Sembunyikan' : 'Tampilkan'}</span>
                  </button>
                </div>
              </div>

              {/* Model ID */}
              <div>
                <label className="text-[11px] text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <Cpu size={10} /> Model ID Default
                </label>
                <input
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  placeholder="meta-llama/llama-3.1-8b-instruct"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 placeholder-gray-700 outline-none focus:border-neon-purple/40 transition-colors font-mono"
                />
              </div>

              {/* Add button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAdd}
                disabled={!name.trim() || !baseUrl.trim() || saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-neon-purple/15 border border-neon-purple/30 text-neon-purple font-medium text-sm hover:bg-neon-purple/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Tambah Provider
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
