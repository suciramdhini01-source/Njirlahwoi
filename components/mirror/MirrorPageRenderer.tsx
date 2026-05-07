'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';
import {
  AnimatedBar, StatCard, FeaturePill, PricingTierCard,
  RankItem, ModelCompareCard, GlowDivider,
} from './MirrorAnimations';
import MirrorMarkdown from './MirrorMarkdown';
import { cleanMirrorMarkdown } from '@/lib/mirror-clean';

// ── helpers ──────────────────────────────────────────────────────────────────

function parsePercent(s: string): number {
  const m = s.match(/([\d.]+)%/);
  return m ? parseFloat(m[1]) : 0;
}

function extractBenchmarks(md: string): { label: string; pct: number }[] {
  const results: { label: string; pct: number }[] = [];
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const m = l.match(/^(Intelligence|Coding|Agentic|Reasoning|Math|Science)\s*([\d.]+)%/i);
    if (m) results.push({ label: m[1], pct: parseFloat(m[2]) });
  }
  return results;
}

function extractDesignArena(md: string): { label: string; elo: number; pct: number }[] {
  const results: { label: string; elo: number; pct: number }[] = [];
  const re = /^([\w\s]+)\s*(\d{4})\s*ELO\s*([\d]+)%/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    results.push({ label: m[1].trim(), elo: parseInt(m[2]), pct: parseInt(m[3]) });
  }
  return results;
}

function extractPricing(md: string) {
  const input = md.match(/Input\s*\$([\d.]+)\s*\/\s*M/)?.[1];
  const output = md.match(/Output\s*\$([\d.]+)\s*\/\s*M/)?.[1];
  return { input: input ? `$${input}` : null, output: output ? `$${output}` : null };
}

function extractContext(md: string) {
  const m = md.match(/(\d[\d,]+(?:,\d{3})*)\s*context/i)
    || md.match(/Context\s*Length\s*([^\n]+)/i);
  return m ? m[1].replace(/,/g, '').trim() : null;
}

function extractModelPairs(md: string): { name: string; provider: string; description?: string; inputPrice?: string; outputPrice?: string; contextLen?: string; scores: { label: string; pct: number }[] }[] {
  const modelBlocks: string[] = [];
  const lines = md.split('\n');
  let current: string[] = [];
  let inModel = false;
  for (const line of lines) {
    if (/^#{1,2}\s+\S/.test(line) && inModel) {
      if (current.length > 3) modelBlocks.push(current.join('\n'));
      current = [line]; inModel = true;
    } else if (/^Author/.test(line) || /###.*(Pricing|Activity|Provider|Features)/.test(line)) {
      inModel = true;
      current.push(line);
    } else {
      current.push(line);
    }
  }
  if (current.length > 3) modelBlocks.push(current.join('\n'));

  const titleRe = /^# (.+)\s*vs\s*(.+)/m;
  const m = md.match(titleRe);
  if (!m) return [];

  const parts = [m[1].trim(), m[2].trim()];
  return parts.map((name) => {
    const provRe = new RegExp(`\\[?${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\]\\[]`, 'i');
    const idx = md.search(provRe);
    const slice = idx >= 0 ? md.slice(idx, idx + 2000) : md.slice(0, 2000);

    const priceParts = extractPricing(slice);
    const ctx = extractContext(slice);
    const benchmarks = extractBenchmarks(slice);

    let provider = 'Unknown';
    const provLine = slice.match(/\[([a-z\-]+)\]\(https:\/\/openrouter\.ai\/[a-z\-]+\)/);
    if (provLine) provider = provLine[1];

    return {
      name, provider,
      inputPrice: priceParts.input || undefined,
      outputPrice: priceParts.output || undefined,
      contextLen: ctx || undefined,
      scores: benchmarks,
    };
  });
}

function extractRankings(md: string): { rank: number; name: string; tokens: string; trend?: string }[] {
  const ranks: { rank: number; name: string; tokens: string; trend?: string }[] = [];
  const lines = md.split('\n');
  let i = 0;
  while (i < lines.length && ranks.length < 20) {
    const numMatch = lines[i].match(/^(\d+)\.\s*$/);
    if (numMatch) {
      const rank = parseInt(numMatch[1]);
      let name = '', tokens = '', trend: string | undefined;
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        const l = lines[j].trim();
        if (!name && /\[.+\]/.test(l)) {
          const nm = l.match(/\[([^\]]+)\]/);
          if (nm) name = nm[1];
        }
        if (!tokens && /^\d+\.?\d*[BKM]\s*tokens/.test(l)) tokens = l.replace(' tokens', '');
        if (!trend && /^[\d,]+%$/.test(l)) trend = l;
      }
      if (name) ranks.push({ rank, name, tokens, trend });
    }
    i++;
  }
  return ranks;
}

function extractDocsHeadings(md: string): { level: number; text: string }[] {
  return md.split('\n')
    .filter(l => /^#{1,4}\s/.test(l))
    .map(l => {
      const m = l.match(/^(#{1,4})\s+(.+)/);
      return m ? { level: m[1].length, text: m[2].trim() } : null;
    })
    .filter(Boolean) as { level: number; text: string }[];
}

// ── page type detectors ───────────────────────────────────────────────────────

type PageKind = 'compare' | 'model' | 'pricing' | 'rankings' | 'docs' | 'collections' | 'spawn' | 'home' | 'generic';

function detectKind(cleanPath: string): PageKind {
  if (cleanPath.startsWith('/compare/')) return 'compare';
  if (cleanPath === '/pricing') return 'pricing';
  if (cleanPath === '/rankings') return 'rankings';
  if (cleanPath.startsWith('/docs/')) return 'docs';
  if (cleanPath === '/collections') return 'collections';
  if (cleanPath.startsWith('/spawn') && cleanPath !== '/spawn') return 'spawn';
  if (cleanPath === '/') return 'home';
  const knownProviders = [
    'anthropic', 'openai', 'google', 'meta-llama', 'deepseek', 'mistralai',
    'qwen', 'nvidia', 'microsoft', 'baidu', 'bytedance', 'tencent', 'x-ai',
    'liquid', 'prime-intellect', 'poolside', 'kwaivgi', 'openrouter', '~anthropic',
  ];
  const firstSeg = cleanPath.replace(/^\//, '').split('/')[0];
  if (knownProviders.includes(firstSeg)) return 'model';
  return 'generic';
}

// ── sub-renderers ─────────────────────────────────────────────────────────────

function HomeRenderer({ markdown }: { markdown: string }) {
  const stats = [
    { label: 'Monthly Tokens', value: '80T', color: 'cyan' as const },
    { label: 'Global Users', value: '8M+', color: 'pink' as const },
    { label: 'Active Providers', value: '60+', color: 'fuchsia' as const },
    { label: 'Models Available', value: '400+', color: 'amber' as const },
  ];
  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-pink-500/5 to-transparent backdrop-blur-md"
      >
        <p className="text-white/70 leading-relaxed text-base">
          OpenRouter is the unified interface for LLMs — better prices, better uptime, no subscriptions.
          Access 400+ models from 60+ providers through a single standardized API.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} color={s.color} delay={i * 0.07} />
        ))}
      </div>

      <GlowDivider />

      <div className="space-y-3">
        <div className="text-xs uppercase tracking-widest text-white/50">Capabilities</div>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { title: 'Smart Routing', desc: 'Auto-selects the best provider for every request based on price, latency, and uptime.' },
            { title: 'BYOK Support', desc: 'Use your own API keys for any supported provider with no extra overhead.' },
            { title: 'Custom Policies', desc: 'Fine-grained data policies to control which providers handle your prompts.' },
          ].map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 22 }}
              whileHover={{ y: -3 }}
              className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md"
            >
              <div className="text-sm font-semibold text-cyan-200 mb-1">{c.title}</div>
              <div className="text-xs text-white/60 leading-relaxed">{c.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <GlowDivider />
      <MirrorMarkdown markdown={cleanMirrorMarkdown(markdown)} />
    </div>
  );
}

function ModelRenderer({ markdown, cleanPath }: { markdown: string; cleanPath: string }) {
  const pricing = extractPricing(markdown);
  const ctx = extractContext(markdown);
  const benchmarks = extractBenchmarks(markdown);
  const arena = extractDesignArena(markdown);
  const [tab, setTab] = useState<'overview' | 'benchmarks' | 'arena'>('overview');

  const providerSlug = cleanPath.replace(/^\//, '').split('/')[0];

  const featureMap: Record<string, boolean> = {};
  ['Stream cancellation', 'Supports Tools', 'Caching', 'Reasoning'].forEach(f => {
    featureMap[f] = markdown.includes(f);
  });
  const hasTraining = markdown.includes('No Prompt Training');

  const statCards = [
    ctx ? { label: 'Context Length', value: formatCtx(ctx), color: 'cyan' as const } : null,
    pricing.input ? { label: 'Input / 1M tokens', value: pricing.input, color: 'pink' as const } : null,
    pricing.output ? { label: 'Output / 1M tokens', value: pricing.output, color: 'fuchsia' as const } : null,
  ].filter(Boolean) as { label: string; value: string; color: 'cyan' | 'pink' | 'fuchsia' }[];

  const tabs = ['overview', benchmarks.length > 0 ? 'benchmarks' : null, arena.length > 0 ? 'arena' : null].filter(Boolean) as typeof tab[];

  return (
    <div className="space-y-8">
      {statCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {statCards.map((s, i) => (
            <StatCard key={s.label} label={s.label} value={s.value} color={s.color} delay={i * 0.07} />
          ))}
        </div>
      )}

      {tabs.length > 1 && (
        <div className="flex gap-2 border-b border-white/10 pb-0">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-2 text-sm font-medium capitalize transition-colors ${tab === t ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              {t}
              {tab === t && (
                <motion.div
                  layoutId="model-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {tab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {Object.entries(featureMap).map(([f, en]) => (
                <FeaturePill key={f} label={f} enabled={en} />
              ))}
              <FeaturePill label="No Prompt Training" enabled={hasTraining} />
            </div>
            <MirrorMarkdown markdown={cleanMirrorMarkdown(markdown)} />
          </motion.div>
        )}

        {tab === 'benchmarks' && benchmarks.length > 0 && (
          <motion.div key="benchmarks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md space-y-4">
            <div className="text-sm font-semibold text-white/70 uppercase tracking-widest">Artificial Analysis</div>
            {benchmarks.map((b, i) => (
              <AnimatedBar key={b.label} label={b.label} value={`${b.pct}%`} pct={b.pct}
                color={i % 3 === 0 ? 'cyan' : i % 3 === 1 ? 'pink' : 'fuchsia'} delay={i * 0.1} />
            ))}
          </motion.div>
        )}

        {tab === 'arena' && arena.length > 0 && (
          <motion.div key="arena" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md space-y-3">
            <div className="text-sm font-semibold text-white/70 uppercase tracking-widest">Design Arena ELO</div>
            {arena.map((a, i) => (
              <AnimatedBar key={a.label} label={`${a.label} (${a.elo} ELO)`} value={`${a.pct}%`} pct={a.pct}
                color={i % 4 === 0 ? 'cyan' : i % 4 === 1 ? 'pink' : i % 4 === 2 ? 'fuchsia' : 'amber'} delay={i * 0.07} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatCtx(raw: string): string {
  const n = parseInt(raw.replace(/\D/g, ''));
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return raw;
}

function CompareRenderer({ markdown, cleanPath }: { markdown: string; cleanPath: string }) {
  const pairs = extractModelPairs(markdown);
  const clean = cleanMirrorMarkdown(markdown);

  return (
    <div className="space-y-10">
      {pairs.length >= 2 ? (
        <>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white/70 text-sm leading-relaxed"
          >
            Side-by-side comparison of two models available on OpenRouter. Prices shown per 1M tokens.
          </motion.p>
          <div className="grid md:grid-cols-2 gap-4">
            {pairs.slice(0, 2).map((p, i) => (
              <ModelCompareCard key={p.name} {...p} delay={i * 0.12} />
            ))}
          </div>
          <GlowDivider />
          <MirrorMarkdown markdown={clean} />
        </>
      ) : (
        <MirrorMarkdown markdown={clean} />
      )}
    </div>
  );
}

function PricingRenderer({ markdown }: { markdown: string }) {
  const tiers = [
    {
      tier: 'Free',
      price: '$0',
      highlight: false,
      features: [
        '25+ free models',
        '4 free providers',
        'Chat & API access',
        '50 requests/day',
        'Community support',
        'Activity logs',
      ],
    },
    {
      tier: 'Pay-as-you-go',
      price: '5.5% fee',
      highlight: true,
      features: [
        '400+ models',
        '60+ providers',
        'High global rate limits',
        'Prompt caching',
        'BYOK support',
        'Auto-routing',
        'Spend controls',
        'Credit card & crypto',
      ],
    },
    {
      tier: 'Enterprise',
      price: 'Custom',
      highlight: false,
      features: [
        'Everything in PAYG',
        'Contractual SLAs',
        'SSO / SAML',
        'Managed policy enforcement',
        'Provider data explorer',
        'Invoicing options',
        'Custom bulk discounts',
        'Dedicated support',
      ],
    },
  ];
  return (
    <div className="space-y-10">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-white/70 leading-relaxed"
      >
        OpenRouter pricing plans for indie hackers, AI-native startups, and enterprises.
      </motion.p>
      <div className="grid sm:grid-cols-3 gap-4">
        {tiers.map((t, i) => (
          <PricingTierCard key={t.tier} {...t} delay={i * 0.1} />
        ))}
      </div>
      <GlowDivider />
      <div className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
        <div className="text-xs uppercase tracking-widest text-white/50 mb-4">Platform fee breakdown</div>
        <div className="space-y-3">
          {[
            { label: 'Free', value: 'N/A', pct: 0 },
            { label: 'Pay-as-you-go', value: '5.5%', pct: 5.5 },
            { label: 'Enterprise', value: 'Custom', pct: 3 },
          ].map((r, i) => (
            <AnimatedBar key={r.label} label={r.label} value={r.value} pct={Math.max(r.pct * 10, 2)}
              color={i === 0 ? 'cyan' : i === 1 ? 'pink' : 'fuchsia'} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RankingsRenderer({ markdown }: { markdown: string }) {
  const ranks = extractRankings(markdown);
  const [cat, setCat] = useState('Trending');
  const categories = ['Trending', 'Top Models', 'Coding', 'Translation'];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Models', value: '400+', color: 'cyan' as const },
          { label: 'Active Providers', value: '60+', color: 'pink' as const },
          { label: 'Monthly Tokens', value: '80T', color: 'fuchsia' as const },
          { label: 'Global Users', value: '8M+', color: 'amber' as const },
        ].map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * 0.06} />
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <motion.button
            key={c}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              cat === c
                ? 'bg-cyan-400/15 border-cyan-400/50 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
            }`}
          >
            {c}
          </motion.button>
        ))}
      </div>

      {ranks.length > 0 ? (
        <div className="space-y-1">
          {ranks.map((r, i) => (
            <RankItem key={`${r.rank}-${r.name}`} {...r} delay={i * 0.04} />
          ))}
        </div>
      ) : (
        <MirrorMarkdown markdown={cleanMirrorMarkdown(markdown)} />
      )}
    </div>
  );
}

function DocsRenderer({ markdown, cleanPath }: { markdown: string; cleanPath: string }) {
  const headings = extractDocsHeadings(markdown);
  const clean = cleanMirrorMarkdown(markdown);
  const [activeH, setActiveH] = useState('');

  return (
    <div className="lg:grid lg:grid-cols-[200px_1fr] gap-8">
      {headings.length > 2 && (
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-0.5">
            <div className="text-xs uppercase tracking-widest text-white/40 mb-3">On this page</div>
            {headings.map((h, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setActiveH(h.text)}
                className={`block w-full text-left text-xs py-1 px-2 rounded transition-colors truncate ${
                  h.level === 1 ? 'font-semibold' : h.level === 2 ? 'pl-3' : 'pl-5 text-white/50'
                } ${activeH === h.text ? 'text-cyan-300 bg-cyan-400/10' : 'text-white/60 hover:text-white/90 hover:bg-white/5'}`}
              >
                {h.text}
              </motion.button>
            ))}
          </div>
        </aside>
      )}
      <article className="space-y-4">
        <div className="flex flex-wrap gap-2 mb-6">
          {cleanPath.split('/').filter(Boolean).map((seg) => (
            <span key={seg} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs font-mono text-cyan-300">
              {seg}
            </span>
          ))}
        </div>
        <MirrorMarkdown markdown={clean} />
      </article>
    </div>
  );
}

function CollectionsRenderer({ markdown }: { markdown: string }) {
  const clean = cleanMirrorMarkdown(markdown);
  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { name: 'Coding', icon: '💻', color: 'cyan' as const, desc: 'Best models for software development and code generation' },
          { name: 'Roleplay', icon: '🎭', color: 'pink' as const, desc: 'Creative, expressive models for interactive fiction and roleplay' },
          { name: 'Science', icon: '🔬', color: 'fuchsia' as const, desc: 'Research-grade models for scientific analysis and reasoning' },
          { name: 'Translation', icon: '🌐', color: 'amber' as const, desc: 'Multi-lingual models optimized for accurate translation' },
          { name: 'Finance', icon: '📈', color: 'cyan' as const, desc: 'Models specialized in financial data and market analysis' },
          { name: 'Medical', icon: '🏥', color: 'pink' as const, desc: 'Healthcare AI with clinical knowledge and biomedical reasoning' },
        ].map((c, i) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 200, damping: 22 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md cursor-default"
          >
            <div className="text-3xl mb-3">{c.icon}</div>
            <div className="font-semibold text-white mb-1">{c.name}</div>
            <div className="text-xs text-white/60 leading-relaxed">{c.desc}</div>
          </motion.div>
        ))}
      </div>
      <GlowDivider />
      <MirrorMarkdown markdown={clean} />
    </div>
  );
}

// ── main export ───────────────────────────────────────────────────────────────

export default function MirrorPageRenderer({ markdown, cleanPath }: {
  markdown: string;
  cleanPath: string;
}) {
  const kind = detectKind(cleanPath);

  return (
    <div className="space-y-6">
      {kind === 'home' && <HomeRenderer markdown={markdown} />}
      {kind === 'model' && <ModelRenderer markdown={markdown} cleanPath={cleanPath} />}
      {kind === 'compare' && <CompareRenderer markdown={markdown} cleanPath={cleanPath} />}
      {kind === 'pricing' && <PricingRenderer markdown={markdown} />}
      {kind === 'rankings' && <RankingsRenderer markdown={markdown} />}
      {kind === 'docs' && <DocsRenderer markdown={markdown} cleanPath={cleanPath} />}
      {kind === 'collections' && <CollectionsRenderer markdown={markdown} />}
      {(kind === 'spawn' || kind === 'generic') && (
        <MirrorMarkdown markdown={cleanMirrorMarkdown(markdown)} />
      )}
    </div>
  );
}
