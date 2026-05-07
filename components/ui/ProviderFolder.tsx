'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface FolderModel {
  id: string;
  name: string;
  free?: boolean;
}

interface ProviderFolderProps {
  provider: string;
  models: FolderModel[];
  selectedModel: string;
  onSelect: (id: string) => void;
}

const PROVIDER_COLORS: Record<string, string> = {
  'Meta': '#0668E1',
  'Google': '#4285F4',
  'Mistral': '#F7931E',
  'Qwen': '#1677FF',
  'NVIDIA': '#76B900',
  'Microsoft': '#00A4EF',
  'Anthropic': '#D97706',
  'OpenAI': '#10A37F',
  'DeepSeek': '#5B6EF5',
};

function getProviderColor(p: string) {
  return PROVIDER_COLORS[p] || '#A855F7';
}

export default function ProviderFolder({ provider, models, selectedModel, onSelect }: ProviderFolderProps) {
  const [open, setOpen] = useState(false);
  const hasSelected = models.some((m) => m.id === selectedModel);
  const color = getProviderColor(provider);

  return (
    <div>
      {/* Folder header */}
      <motion.button
        whileHover={{ x: 3 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${
          open || hasSelected ? 'bg-white/8' : 'hover:bg-white/5'
        }`}
      >
        {/* iOS-style folder icon */}
        <motion.div
          animate={{ scale: open ? 1.1 : 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-inner flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${color}99, ${color}44)`, border: `1px solid ${color}44` }}
        >
          {provider.slice(0, 2).toUpperCase()}
        </motion.div>

        <div className="flex-1 text-left min-w-0">
          <p className="text-xs text-white/80 truncate font-medium">{provider}</p>
          <p className="text-[10px] text-gray-600">{models.length} model</p>
        </div>

        <div className="flex items-center gap-1.5">
          {hasSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: color }}
            />
          )}
          <motion.div
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          >
            <ChevronRight size={12} className="text-gray-600" />
          </motion.div>
        </div>
      </motion.button>

      {/* iOS App Folder expand */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="folder-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300, opacity: { duration: 0.15 } }}
            style={{ overflow: 'hidden' }}
          >
            <div className="ml-3 pl-3 border-l-2 mt-0.5 mb-1 space-y-0.5" style={{ borderColor: `${color}30` }}>
              {models.map((m, i) => (
                <motion.button
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', damping: 22 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSelect(m.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-colors ${
                    selectedModel === m.id
                      ? 'bg-brand-blue/15 border border-brand-blue/25'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <span className="flex-1 text-xs text-white/75 truncate">{m.name}</span>
                  {m.free && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-brand-green/15 text-brand-green border border-brand-green/20 flex-shrink-0">
                      GRATIS
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
