"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Loader2, Check, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { ProviderConfig } from "@/lib/provider-configs";
import { ProviderEntry } from "@/store/provider-store";

interface Props {
  open: boolean;
  config: ProviderConfig | null;
  entry: ProviderEntry | null;
  onClose: () => void;
  onSave: (values: Record<string, string>) => Promise<void>;
  onSaveAndTest: (values: Record<string, string>) => Promise<{ ok: boolean; message?: string }>;
}

export function ProviderModal({ open, config, entry, onClose, onSave, onSaveAndTest }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message?: string } | null>(null);

  useEffect(() => {
    if (open && config) {
      setValues(entry?.values || {});
      setResult(null);
    }
  }, [open, config, entry]);

  if (!config) return null;

  const canSubmit = config.fields.every((f) => !f.required || !!(values[f.key] || "").trim());

  const handleSave = async () => {
    await onSave(values);
    onClose();
  };

  const handleSaveAndTest = async () => {
    setTesting(true);
    setResult(null);
    const res = await onSaveAndTest(values);
    setResult(res);
    setTesting(false);
    if (res.ok) setTimeout(onClose, 900);
  };

  const Icon = config.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0a14]/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
          >
            <div
              className="absolute inset-x-0 top-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, transparent, ${config.accent}, transparent)` }}
            />

            <div className="flex items-start justify-between p-5 border-b border-white/10">
              <div className="flex items-start gap-3">
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${config.accent}30, ${config.accent}10)`,
                    boxShadow: `0 0 22px ${config.accent}33`,
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: config.accent }} />
                </div>
                <div>
                  <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-white">
                    {config.name}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">{config.tagline}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                <p className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                  Cara mendapatkan kredensial
                </p>
                <ol className="space-y-1.5">
                  {config.instructions.map((ins, i) => (
                    <li key={i} className="flex gap-2 text-xs text-gray-400">
                      <span
                        className="shrink-0 h-4 w-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                        style={{ background: `${config.accent}22`, color: config.accent }}
                      >
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{ins}</span>
                    </li>
                  ))}
                </ol>
                <a
                  href={config.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: config.accent }}
                >
                  Buka dokumentasi resmi <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {config.fields.map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-gray-300 mb-1.5 block">
                    {f.label} {f.required && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type={f.type}
                    value={values[f.key] || ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 focus:bg-black/60 transition font-mono"
                  />
                </div>
              ))}

              <p className="text-[11px] text-gray-500 leading-relaxed">
                Kredensial disimpan terenkripsi (AES-GCM) di localStorage browser ini. Server NJIRLAH tidak menyimpan atau mencatat key apapun.
              </p>

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                    result.ok
                      ? "bg-green-500/10 border border-green-500/30 text-green-300"
                      : "bg-red-500/10 border border-red-500/30 text-red-300"
                  }`}
                >
                  {result.ok ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {result.message || (result.ok ? "Koneksi berhasil" : "Koneksi gagal")}
                </motion.div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/10 bg-black/30">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition"
              >
                Batal
              </button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleSave}
                disabled={!canSubmit}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-white/10 bg-white/[0.05] hover:bg-white/10 text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Simpan
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleSaveAndTest}
                disabled={!canSubmit || testing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${config.accent}, ${config.accent}cc)`,
                  boxShadow: `0 0 24px ${config.accent}55`,
                }}
              >
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Simpan & Test
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
