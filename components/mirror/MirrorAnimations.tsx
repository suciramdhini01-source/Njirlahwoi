'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export function AnimatedBar({ pct, color = 'cyan', delay = 0, label, value }: {
  pct: number; color?: 'cyan' | 'pink' | 'fuchsia' | 'amber'; delay?: number; label: string; value: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const colorMap = {
    cyan: 'from-cyan-500 to-cyan-300',
    pink: 'from-pink-500 to-pink-300',
    fuchsia: 'from-fuchsia-500 to-fuchsia-300',
    amber: 'from-amber-500 to-amber-300',
  };
  const shadow = {
    cyan: 'shadow-[0_0_12px_rgba(6,182,212,0.5)]',
    pink: 'shadow-[0_0_12px_rgba(236,72,153,0.5)]',
    fuchsia: 'shadow-[0_0_12px_rgba(217,70,239,0.5)]',
    amber: 'shadow-[0_0_12px_rgba(245,158,11,0.5)]',
  };
  return (
    <div ref={ref} className="space-y-1">
      <div className="flex justify-between text-xs text-white/70">
        <span>{label}</span>
        <span className="font-mono font-semibold text-white">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${Math.min(pct, 100)}%` } : {}}
          transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full rounded-full bg-gradient-to-r ${colorMap[color]} ${shadow[color]}`}
        />
      </div>
    </div>
  );
}

export function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="tabular-nums"
    >
      {value}{suffix}
    </motion.span>
  );
}

export function StatCard({ label, value, icon, color = 'cyan', delay = 0 }: {
  label: string; value: string; icon?: string; color?: 'cyan' | 'pink' | 'fuchsia' | 'amber'; delay?: number;
}) {
  const colors = {
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-300',
    pink: 'from-pink-500/20 to-pink-500/5 border-pink-500/30 text-pink-300',
    fuchsia: 'from-fuchsia-500/20 to-fuchsia-500/5 border-fuchsia-500/30 text-fuchsia-300',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-300',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 220, damping: 22, delay }}
      whileHover={{ y: -3, scale: 1.02 }}
      className={`p-4 rounded-xl border bg-gradient-to-br ${colors[color]} backdrop-blur-md`}
    >
      {icon && <div className="text-2xl mb-2">{icon}</div>}
      <div className={`text-2xl font-bold ${colors[color].split(' ').pop()}`}>{value}</div>
      <div className="text-xs text-white/60 mt-0.5">{label}</div>
    </motion.div>
  );
}

export function FeaturePill({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-md ${
        enabled
          ? 'bg-cyan-400/10 border-cyan-400/40 text-cyan-200'
          : 'bg-white/5 border-white/10 text-white/40 line-through'
      }`}
    >
      <span className={enabled ? 'text-cyan-400' : 'text-white/30'}>{enabled ? '✓' : '✗'}</span>
      {label}
    </motion.div>
  );
}

export function PricingTierCard({ tier, price, highlight, features, delay = 0 }: {
  tier: string; price: string; highlight?: boolean; features: string[]; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 180, damping: 22, delay }}
      whileHover={{ y: -4 }}
      className={`relative p-6 rounded-2xl border backdrop-blur-md overflow-hidden ${
        highlight
          ? 'border-cyan-400/50 bg-gradient-to-br from-cyan-500/15 via-pink-500/10 to-fuchsia-500/5 shadow-[0_0_40px_rgba(6,182,212,0.2)]'
          : 'border-white/10 bg-white/5'
      }`}
    >
      {highlight && (
        <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-gradient-to-r from-cyan-500 to-pink-500 text-xs font-bold text-white">
          Popular
        </div>
      )}
      <div className="text-xs uppercase tracking-widest text-white/50 mb-1">{tier}</div>
      <div className="text-3xl font-bold text-white mb-1">{price}</div>
      <ul className="mt-4 space-y-2">
        {features.map((f, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: delay + i * 0.05 }}
            className="flex items-start gap-2 text-sm text-white/70"
          >
            <span className="text-cyan-400 mt-0.5 flex-shrink-0">✓</span>
            {f}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

export function RankItem({ rank, name, tokens, trend, delay = 0 }: {
  rank: number; name: string; tokens: string; trend?: string; delay?: number;
}) {
  const isPositive = trend && !trend.startsWith('-');
  const rankColors = ['text-amber-300', 'text-slate-300', 'text-amber-600'];
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 200, damping: 22, delay }}
      whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
      className="flex items-center gap-3 p-3 rounded-xl border border-white/5 transition-colors cursor-default"
    >
      <span className={`w-7 text-center font-bold text-sm ${rankColors[rank - 1] || 'text-white/40'}`}>
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{name}</div>
        <div className="text-xs text-white/50">{tokens} tokens</div>
      </div>
      {trend && (
        <span className={`text-xs font-mono font-semibold ${isPositive ? 'text-cyan-300' : 'text-pink-300'}`}>
          {trend}
        </span>
      )}
    </motion.div>
  );
}

export function DocsSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 200, damping: 24, delay }}
    >
      {children}
    </motion.div>
  );
}

export function GlowDivider() {
  return (
    <div className="relative my-10 flex items-center justify-center">
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      <div className="relative w-2 h-2 rounded-full bg-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
    </div>
  );
}

export function ModelCompareCard({ name, provider, contextLen, inputPrice, outputPrice, features, scores, delay = 0 }: {
  name: string; provider: string; contextLen?: string; inputPrice?: string; outputPrice?: string;
  features?: string[]; scores?: { label: string; pct: number }[]; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 180, damping: 22, delay }}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 space-y-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-pink-500/20 border border-white/10 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {name.charAt(0)}
        </div>
        <div>
          <div className="font-bold text-white leading-tight">{name}</div>
          <div className="text-xs text-cyan-300 mt-0.5">{provider}</div>
        </div>
      </div>

      {(inputPrice || contextLen) && (
        <div className="grid grid-cols-2 gap-2">
          {contextLen && (
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-center">
              <div className="text-xs text-white/50">Context</div>
              <div className="text-sm font-bold text-cyan-300 mt-0.5">{contextLen}</div>
            </div>
          )}
          {inputPrice && (
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-center">
              <div className="text-xs text-white/50">Input / M</div>
              <div className="text-sm font-bold text-pink-300 mt-0.5">{inputPrice}</div>
            </div>
          )}
          {outputPrice && (
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-center">
              <div className="text-xs text-white/50">Output / M</div>
              <div className="text-sm font-bold text-fuchsia-300 mt-0.5">{outputPrice}</div>
            </div>
          )}
        </div>
      )}

      {scores && scores.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-white/50 uppercase tracking-widest">Scores</div>
          {scores.map((s, i) => (
            <AnimatedBar key={s.label} label={s.label} value={`${s.pct}%`} pct={s.pct}
              color={i % 3 === 0 ? 'cyan' : i % 3 === 1 ? 'pink' : 'fuchsia'} delay={delay + i * 0.08} />
          ))}
        </div>
      )}

      {features && features.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {features.map((f) => (
            <FeaturePill key={f} label={f} enabled />
          ))}
        </div>
      )}
    </motion.div>
  );
}
