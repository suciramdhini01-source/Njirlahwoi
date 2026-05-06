'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Cloud, Eye, EyeOff, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useApiKeyStore } from '@/store/api-key-store';
import { fetchOpenRouterModels } from '@/lib/openrouter';
import { fetchCloudflareModels } from '@/lib/cloudflare';

interface ApiKeyModalProps {
  open: boolean;
  onClose: () => void;
}

type Tab = 'openrouter' | 'cloudflare';
type Status = 'idle' | 'testing' | 'success' | 'error';

export default function ApiKeyModal({ open, onClose }: ApiKeyModalProps) {
  const [tab, setTab] = useState<Tab>('openrouter');
  const [showOR, setShowOR] = useState(false);
  const [showCF, setShowCF] = useState(false);
  const [orKey, setOrKey] = useState('');
  const [cfToken, setCfToken] = useState('');
  const [cfAccount, setCfAccount] = useState('');
  const [orStatus, setOrStatus] = useState<Status>('idle');
  const [cfStatus, setCfStatus] = useState<Status>('idle');
  const [orError, setOrError] = useState('');
  const [cfError, setCfError] = useState('');

  const store = useApiKeyStore();

  const testOR = async () => {
    if (!orKey.trim()) return;
    setOrStatus('testing');
    setOrError('');
    try {
      await fetchOpenRouterModels(orKey.trim());
      setOrStatus('success');
      store.setOpenrouterKey(orKey.trim());
    } catch (e: any) {
      setOrStatus('error');
      setOrError('API key tidak valid atau koneksi gagal');
    }
  };

  const testCF = async () => {
    if (!cfToken.trim() || !cfAccount.trim()) return;
    setCfStatus('testing');
    setCfError('');
    try {
      await fetchCloudflareModels(cfAccount.trim(), cfToken.trim());
      setCfStatus('success');
      store.setCloudflareToken(cfToken.trim());
      store.setCloudflareAccountId(cfAccount.trim());
    } catch (e: any) {
      setCfStatus('error');
      setCfError('Token atau Account ID tidak valid');
    }
  };

  const saveOR = () => {
    store.setOpenrouterKey(orKey.trim());
    onClose();
  };

  const saveCF = () => {
    store.setCloudflareToken(cfToken.trim());
    store.setCloudflareAccountId(cfAccount.trim());
    onClose();
  };

  const StatusIcon = ({ status }: { status: Status }) => {
    if (status === 'testing') return <Loader size={14} className="text-neon-cyan animate-spin" />;
    if (status === 'success') return <CheckCircle size={14} className="text-green-400" />;
    if (status === 'error') return <AlertCircle size={14} className="text-red-400" />;
    return null;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md glass rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold font-heading gradient-text">API Keys — BYOK</h2>
                <p className="text-xs text-gray-500 mt-0.5">Kunci hanya disimpan lokal, tidak ke server</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex border-b border-white/10">
              {([
                { key: 'openrouter', label: 'OpenRouter', icon: <Key size={13} /> },
                { key: 'cloudflare', label: 'Cloudflare', icon: <Cloud size={13} /> },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-all ${
                    tab === t.key
                      ? 'text-neon-purple border-b-2 border-neon-purple font-medium'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {tab === 'openrouter' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">OpenRouter API Key</label>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                      <input
                        type={showOR ? 'text' : 'password'}
                        value={orKey}
                        onChange={(e) => { setOrKey(e.target.value); setOrStatus('idle'); }}
                        placeholder={store.openrouterKey ? '••••••••••••••••' : 'sk-or-v1-...'}
                        className="flex-1 bg-transparent text-sm text-white/80 placeholder-gray-600 outline-none"
                      />
                      <button onClick={() => setShowOR(!showOR)} className="text-gray-500 hover:text-gray-300">
                        {showOR ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <StatusIcon status={orStatus} />
                    </div>
                    {orError && <p className="text-xs text-red-400 mt-1">{orError}</p>}
                    {orStatus === 'success' && (
                      <p className="text-xs text-green-400 mt-1">✓ Koneksi berhasil! Semua model tersedia.</p>
                    )}
                    {store.openrouterKey && !orKey && (
                      <p className="text-xs text-neon-cyan mt-1">✓ API key sudah tersimpan</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    Dapatkan API key gratis di{' '}
                    <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" className="text-neon-purple underline">
                      openrouter.ai/keys
                    </a>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={testOR}
                      disabled={!orKey.trim() || orStatus === 'testing'}
                      className="flex-1 py-2.5 rounded-xl text-sm border border-neon-purple/40 text-neon-purple hover:bg-neon-purple/10 transition-colors disabled:opacity-40"
                    >
                      Test Koneksi
                    </button>
                    <button
                      onClick={saveOR}
                      disabled={!orKey.trim()}
                      className="flex-1 py-2.5 rounded-xl text-sm bg-neon-purple/20 border border-neon-purple/40 text-neon-purple hover:bg-neon-purple/30 transition-colors disabled:opacity-40"
                    >
                      Simpan
                    </button>
                  </div>
                  {store.openrouterKey && (
                    <button
                      onClick={() => { store.setOpenrouterKey(''); setOrKey(''); setOrStatus('idle'); }}
                      className="w-full py-2 rounded-xl text-xs text-red-400 hover:bg-red-400/10 border border-red-400/20 transition-colors"
                    >
                      Hapus API Key
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Account ID</label>
                    <input
                      type="text"
                      value={cfAccount}
                      onChange={(e) => { setCfAccount(e.target.value); setCfStatus('idle'); }}
                      placeholder={store.cloudflareAccountId || 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/80 placeholder-gray-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">API Token</label>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                      <input
                        type={showCF ? 'text' : 'password'}
                        value={cfToken}
                        onChange={(e) => { setCfToken(e.target.value); setCfStatus('idle'); }}
                        placeholder={store.cloudflareToken ? '••••••••••••••••' : 'Cloudflare API Token'}
                        className="flex-1 bg-transparent text-sm text-white/80 placeholder-gray-600 outline-none"
                      />
                      <button onClick={() => setShowCF(!showCF)} className="text-gray-500 hover:text-gray-300">
                        {showCF ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <StatusIcon status={cfStatus} />
                    </div>
                    {cfError && <p className="text-xs text-red-400 mt-1">{cfError}</p>}
                    {cfStatus === 'success' && (
                      <p className="text-xs text-green-400 mt-1">✓ Koneksi Cloudflare berhasil!</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={testCF}
                      disabled={!cfToken.trim() || !cfAccount.trim() || cfStatus === 'testing'}
                      className="flex-1 py-2.5 rounded-xl text-sm border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10 transition-colors disabled:opacity-40"
                    >
                      Test Koneksi
                    </button>
                    <button
                      onClick={saveCF}
                      disabled={!cfToken.trim() || !cfAccount.trim()}
                      className="flex-1 py-2.5 rounded-xl text-sm bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/30 transition-colors disabled:opacity-40"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
