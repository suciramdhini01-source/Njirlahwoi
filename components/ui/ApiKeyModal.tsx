'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Cloud, Eye, EyeOff, CheckCircle, AlertCircle, Loader, ExternalLink } from 'lucide-react';
import { useApiKeyStore } from '@/store/api-key-store';
import { fetchOpenRouterModels } from '@/lib/openrouter';
import { showToast } from '@/components/ui/ToastStack';

interface ApiKeyModalProps {
  open: boolean;
  onClose: () => void;
}

type Status = 'idle' | 'testing' | 'success' | 'error';

export default function ApiKeyModal({ open, onClose }: ApiKeyModalProps) {
  const [tab, setTab] = useState<'openrouter' | 'cloudflare'>('openrouter');
  const [showKey, setShowKey] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const { setOpenrouterKey, clearKey, openrouterKey, hasKey } = useApiKeyStore();

  const testAndSave = async () => {
    if (!inputKey.trim()) return;
    setStatus('testing');
    setErrorMsg('');
    try {
      await fetchOpenRouterModels(inputKey.trim());
      await setOpenrouterKey(inputKey.trim());
      setStatus('success');
      showToast('OpenRouter API key tersimpan!', 'success');
      setTimeout(onClose, 800);
    } catch {
      setStatus('error');
      setErrorMsg('API key tidak valid atau koneksi gagal');
    }
  };

  const handleClear = () => {
    clearKey();
    setInputKey('');
    setStatus('idle');
    showToast('API key dihapus', 'info');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 26, stiffness: 360 } }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            className="w-full max-w-md bg-[#0A0A14] rounded-2xl border border-white/[0.09] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.07]">
              <div>
                <h2 className="text-lg font-bold font-heading gradient-text">API Keys</h2>
                <p className="text-xs text-white/30 mt-0.5">Key disimpan terenkripsi di browser kamu</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/8 transition-colors"
              >
                <X size={16} />
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/[0.07]">
              {[
                { key: 'openrouter', label: 'OpenRouter', icon: <Key size={13} />, badge: 'BYOK', badgeClass: 'bg-brand-blue/10 text-brand-blue/70' },
                { key: 'cloudflare', label: 'Cloudflare', icon: <Cloud size={13} />, badge: 'Free', badgeClass: 'bg-brand-green/10 text-brand-green/70' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as 'openrouter' | 'cloudflare')}
                  className={`flex-1 flex flex-col items-center py-3 text-xs transition-all relative ${
                    tab === t.key ? 'text-brand-blue font-medium' : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">{t.icon}{t.label}</div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${t.badgeClass}`}>{t.badge}</span>
                  {tab === t.key && (
                    <motion.div layoutId="modal-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-blue" />
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === 'openrouter' ? (
                <motion.div key="or" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="p-5 space-y-4">
                  {hasKey() && !inputKey && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-brand-green/8 border border-brand-green/20">
                      <CheckCircle size={14} className="text-brand-green flex-shrink-0" />
                      <span className="text-xs text-brand-green">API key aktif dan tersimpan</span>
                    </motion.div>
                  )}
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block font-medium">OpenRouter API Key</label>
                    <div className="flex items-center gap-2 bg-[#111118] border border-white/[0.07] rounded-xl px-3 py-2.5 focus-within:border-brand-blue/30 transition-colors">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={inputKey}
                        onChange={(e) => { setInputKey(e.target.value); setStatus('idle'); }}
                        placeholder={hasKey() ? '••••••••••••• (tersimpan)' : 'sk-or-v1-...'}
                        className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/20 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && testAndSave()}
                      />
                      <button onClick={() => setShowKey(!showKey)} className="text-white/25 hover:text-white/60">
                        {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      {status === 'testing' && <Loader size={13} className="text-brand-blue animate-spin" />}
                      {status === 'success' && <CheckCircle size={13} className="text-brand-green" />}
                      {status === 'error' && <AlertCircle size={13} className="text-brand-red" />}
                    </div>
                    {errorMsg && <p className="text-xs text-brand-red mt-1">{errorMsg}</p>}
                    {status === 'success' && <p className="text-xs text-brand-green mt-1">✓ Tersambung! Key tersimpan terenkripsi.</p>}
                  </div>
                  <p className="text-xs text-white/25 flex items-center gap-1.5">
                    Daftar gratis di{' '}
                    <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" className="text-brand-blue underline flex items-center gap-0.5 hover:text-brand-pistachio transition-colors">
                      openrouter.ai/keys <ExternalLink size={10} />
                    </a>
                  </p>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={testAndSave}
                      disabled={!inputKey.trim() || status === 'testing'}
                      className="flex-1 py-2.5 rounded-xl text-sm border border-brand-blue/30 text-brand-blue hover:bg-brand-blue/10 transition-colors disabled:opacity-40 font-medium"
                    >
                      {status === 'testing' ? 'Testing...' : 'Test & Simpan'}
                    </motion.button>
                    {hasKey() && (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleClear}
                        className="px-4 py-2.5 rounded-xl text-xs text-brand-red border border-brand-red/20 hover:bg-brand-red/10 transition-colors">
                        Hapus
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="cf" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="p-5">
                  <div className="flex flex-col items-center py-6 text-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-blue/15 to-brand-green/15 border border-brand-green/25 flex items-center justify-center"
                    >
                      <Cloud size={24} className="text-brand-green" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-semibold text-white/90 mb-1">Cloudflare Workers AI</p>
                      <p className="text-xs text-white/30 max-w-[260px]">Dikelola oleh server NJIRLAH AI. Langsung tersedia tanpa konfigurasi tambahan.</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-green/8 border border-brand-green/20 w-full">
                      <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-brand-green flex-shrink-0" />
                      <span className="text-xs text-brand-green">Server aktif · Siap digunakan</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
