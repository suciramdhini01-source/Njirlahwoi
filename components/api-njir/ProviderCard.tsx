'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, Loader2, Save, Zap, ExternalLink } from 'lucide-react';

type Status = 'idle' | 'valid' | 'invalid' | 'testing';

interface ProviderCardProps {
  name: string;
  description?: string;
  placeholder?: string;
  docsUrl?: string;
  value: string | null;
  status?: Status;
  onSave: (key: string) => Promise<void>;
  onTest: (key: string) => Promise<boolean>;
  extraFields?: {
    label: string;
    placeholder: string;
    value: string | null;
    key: string;
  }[];
  onSaveExtra?: (values: Record<string, string>) => Promise<void>;
}

function StatusDot({ status }: { status: Status }) {
  if (status === 'idle') return <div className="w-2 h-2 rounded-full bg-white/20" />;
  if (status === 'testing') return (
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
      <Loader2 size={12} className="text-yellow-400" />
    </motion.div>
  );
  if (status === 'valid') return (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
      <CheckCircle size={14} className="text-emerald-400" />
    </motion.div>
  );
  return (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
      <XCircle size={14} className="text-red-400" />
    </motion.div>
  );
}

export default function ProviderCard({
  name, description, placeholder, docsUrl, value, status = 'idle',
  onSave, onTest, extraFields, onSaveExtra,
}: ProviderCardProps) {
  const [input, setInput] = useState(value ?? '');
  const [extraInputs, setExtraInputs] = useState<Record<string, string>>(
    Object.fromEntries((extraFields ?? []).map((f) => [f.key, f.value ?? '']))
  );
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [localStatus, setLocalStatus] = useState<Status>(status);

  const isDirty = input !== (value ?? '') || (extraFields?.some((f) => extraInputs[f.key] !== (f.value ?? '')));

  const handleSave = async () => {
    if (!input.trim()) return;
    setSaving(true);
    try {
      if (extraFields && onSaveExtra) {
        await onSaveExtra({ mainKey: input.trim(), ...extraInputs });
      } else {
        await onSave(input.trim());
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    const key = input.trim();
    if (!key) return;
    setTesting(true);
    setLocalStatus('testing');
    try {
      const ok = await onTest(key);
      setLocalStatus(ok ? 'valid' : 'invalid');
    } finally {
      setTesting(false);
    }
  };

  const effectiveStatus = testing ? 'testing' : localStatus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 300 }}
      className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 hover:border-white/20 transition-colors group"
    >
      {/* Glow on valid */}
      <AnimatePresence>
        {effectiveStatus === 'valid' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at top left, rgba(52,211,153,0.06) 0%, transparent 70%)' }}
          />
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white/90 font-heading truncate">{name}</h3>
            <StatusDot status={effectiveStatus} />
          </div>
          {description && <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{description}</p>}
        </div>
        {docsUrl && (
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-1 rounded-lg text-gray-600 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
          >
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Main key input */}
      <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-3 py-2 focus-within:border-neon-purple/40 transition-colors">
        <Lock size={11} className="text-gray-600 flex-shrink-0" />
        <input
          type={show ? 'text' : 'password'}
          value={input}
          onChange={(e) => { setInput(e.target.value); setLocalStatus('idle'); }}
          placeholder={placeholder ?? 'sk-...'}
          className="flex-1 bg-transparent text-xs text-white/80 placeholder-gray-700 outline-none font-mono"
        />
        <button
          onClick={() => setShow(!show)}
          className="text-gray-600 hover:text-gray-400 transition-colors"
        >
          {show ? <EyeOff size={12} /> : <Eye size={12} />}
        </button>
      </div>

      {/* Extra fields (e.g. Account ID for Cloudflare) */}
      {extraFields?.map((field) => (
        <div key={field.key} className="mt-2 flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-3 py-2 focus-within:border-neon-purple/40 transition-colors">
          <Lock size={11} className="text-gray-600 flex-shrink-0" />
          <input
            type="text"
            value={extraInputs[field.key] ?? ''}
            onChange={(e) => setExtraInputs((prev) => ({ ...prev, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
            className="flex-1 bg-transparent text-xs text-white/80 placeholder-gray-700 outline-none font-mono"
          />
          <span className="text-[10px] text-gray-600 flex-shrink-0 whitespace-nowrap">{field.label}</span>
        </div>
      ))}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleTest}
          disabled={!input.trim() || testing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:border-neon-cyan/30 hover:bg-neon-cyan/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Zap size={10} />
          Test
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={!input.trim() || saving || !isDirty}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-purple/10 border border-neon-purple/30 text-xs text-neon-purple hover:bg-neon-purple/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {saving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
          Simpan
        </motion.button>

        <AnimatePresence>
          {effectiveStatus === 'valid' && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-[10px] text-emerald-400"
            >
              Terkoneksi ✓
            </motion.span>
          )}
          {effectiveStatus === 'invalid' && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-[10px] text-red-400"
            >
              Key tidak valid
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
