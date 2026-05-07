'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, ChevronUp, Filter, X, ExternalLink, Zap, Clock, DollarSign } from 'lucide-react';

const PROVIDERS = [
  'Anthropic', 'OpenAI', 'Google', 'Meta', 'Mistral', 'Cohere', 'DeepSeek',
  'xAI', 'Microsoft', 'Amazon', 'Perplexity', 'Together AI', 'Fireworks', 'Groq',
];

const CONTEXT_SIZES = [
  { label: 'Any', value: 0 },
  { label: '8K+', value: 8000 },
  { label: '32K+', value: 32000 },
  { label: '128K+', value: 128000 },
  { label: '200K+', value: 200000 },
  { label: '1M+', value: 1000000 },
];

const OUTPUT_TYPES = ['Text', 'Image', 'Code', 'Embedding', 'Audio'];

const SORT_OPTIONS = [
  { label: 'Throughput', value: 'throughput' },
  { label: 'Latency', value: 'latency' },
  { label: 'Price (low)', value: 'price_asc' },
  { label: 'Price (high)', value: 'price_desc' },
  { label: 'Context size', value: 'context' },
  { label: 'Name', value: 'name' },
];

interface Model {
  id: string;
  name: string;
  provider: string;
  providerColor: string;
  context: number;
  contextLabel: string;
  inputPrice: number;
  outputPrice: number;
  inputPriceLabel: string;
  outputPriceLabel: string;
  throughput: number;
  latency: number;
  description: string;
  tags: string[];
  isFree: boolean;
  isNew: boolean;
}

const MODELS: Model[] = [
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    providerColor: '#c96442',
    context: 200000,
    contextLabel: '200K',
    inputPrice: 3,
    outputPrice: 15,
    inputPriceLabel: '$3/M',
    outputPriceLabel: '$15/M',
    throughput: 87,
    latency: 1.2,
    description: 'Anthropic\'s most capable model for complex tasks with 200K context.',
    tags: ['Popular', 'Coding', 'Reasoning'],
    isFree: false,
    isNew: false,
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    providerColor: '#c96442',
    context: 200000,
    contextLabel: '200K',
    inputPrice: 0.25,
    outputPrice: 1.25,
    inputPriceLabel: '$0.25/M',
    outputPriceLabel: '$1.25/M',
    throughput: 214,
    latency: 0.6,
    description: 'Fast and compact model for lightweight tasks.',
    tags: ['Fast', 'Cheap'],
    isFree: false,
    isNew: false,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    providerColor: '#10a37f',
    context: 128000,
    contextLabel: '128K',
    inputPrice: 5,
    outputPrice: 15,
    inputPriceLabel: '$5/M',
    outputPriceLabel: '$15/M',
    throughput: 72,
    latency: 1.8,
    description: 'OpenAI\'s flagship multimodal model with vision and audio.',
    tags: ['Multimodal', 'Popular'],
    isFree: false,
    isNew: false,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    providerColor: '#10a37f',
    context: 128000,
    contextLabel: '128K',
    inputPrice: 0.15,
    outputPrice: 0.6,
    inputPriceLabel: '$0.15/M',
    outputPriceLabel: '$0.60/M',
    throughput: 155,
    latency: 0.8,
    description: 'Compact multimodal model at a fraction of the cost.',
    tags: ['Cheap', 'Fast'],
    isFree: false,
    isNew: false,
  },
  {
    id: 'google/gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    providerColor: '#4285f4',
    context: 1000000,
    contextLabel: '1M',
    inputPrice: 3.5,
    outputPrice: 10.5,
    inputPriceLabel: '$3.5/M',
    outputPriceLabel: '$10.5/M',
    throughput: 65,
    latency: 2.1,
    description: 'Google\'s capable model with industry-leading 1M token context.',
    tags: ['Long Context', 'Multimodal'],
    isFree: false,
    isNew: false,
  },
  {
    id: 'google/gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    providerColor: '#4285f4',
    context: 1000000,
    contextLabel: '1M',
    inputPrice: 0.075,
    outputPrice: 0.3,
    inputPriceLabel: '$0.075/M',
    outputPriceLabel: '$0.30/M',
    throughput: 312,
    latency: 0.4,
    description: 'Google\'s fastest model with 1M context at ultra-low cost.',
    tags: ['Fast', 'Cheap', 'Long Context'],
    isFree: false,
    isNew: false,
  },
  {
    id: 'meta-llama/llama-3.1-405b-instruct',
    name: 'Llama 3.1 405B',
    provider: 'Meta',
    providerColor: '#0866ff',
    context: 128000,
    contextLabel: '128K',
    inputPrice: 2.7,
    outputPrice: 2.7,
    inputPriceLabel: '$2.7/M',
    outputPriceLabel: '$2.7/M',
    throughput: 28,
    latency: 3.5,
    description: 'Meta\'s largest open-source model competing with frontier models.',
    tags: ['Open Source', 'Coding'],
    isFree: false,
    isNew: false,
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    provider: 'Meta',
    providerColor: '#0866ff',
    context: 128000,
    contextLabel: '128K',
    inputPrice: 0.35,
    outputPrice: 0.4,
    inputPriceLabel: '$0.35/M',
    outputPriceLabel: '$0.40/M',
    throughput: 90,
    latency: 1.1,
    description: 'Strong open-source model available via multiple providers.',
    tags: ['Open Source', 'Popular'],
    isFree: false,
    isNew: false,
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    name: 'Llama 3.1 8B (free)',
    provider: 'Meta',
    providerColor: '#0866ff',
    context: 128000,
    contextLabel: '128K',
    inputPrice: 0,
    outputPrice: 0,
    inputPriceLabel: 'Free',
    outputPriceLabel: 'Free',
    throughput: 210,
    latency: 0.5,
    description: 'Free tier of Meta\'s 8B model, community-supported.',
    tags: ['Free', 'Open Source'],
    isFree: true,
    isNew: false,
  },
  {
    id: 'mistral/mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral',
    providerColor: '#f7a130',
    context: 128000,
    contextLabel: '128K',
    inputPrice: 3,
    outputPrice: 9,
    inputPriceLabel: '$3/M',
    outputPriceLabel: '$9/M',
    throughput: 95,
    latency: 1.0,
    description: 'Mistral\'s top model with strong multilingual and coding capabilities.',
    tags: ['Multilingual', 'Coding'],
    isFree: false,
    isNew: false,
  },
  {
    id: 'mistral/mistral-7b-instruct:free',
    name: 'Mistral 7B (free)',
    provider: 'Mistral',
    providerColor: '#f7a130',
    context: 32000,
    contextLabel: '32K',
    inputPrice: 0,
    outputPrice: 0,
    inputPriceLabel: 'Free',
    outputPriceLabel: 'Free',
    throughput: 280,
    latency: 0.4,
    description: 'Free and fast 7B model from Mistral AI.',
    tags: ['Free', 'Fast'],
    isFree: true,
    isNew: false,
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    providerColor: '#4d6bfe',
    context: 64000,
    contextLabel: '64K',
    inputPrice: 0.55,
    outputPrice: 2.19,
    inputPriceLabel: '$0.55/M',
    outputPriceLabel: '$2.19/M',
    throughput: 45,
    latency: 4.2,
    description: 'DeepSeek\'s reasoning model matching o1-level performance.',
    tags: ['Reasoning', 'New'],
    isFree: false,
    isNew: true,
  },
  {
    id: 'x-ai/grok-2',
    name: 'Grok 2',
    provider: 'xAI',
    providerColor: '#1a1a1a',
    context: 131072,
    contextLabel: '128K',
    inputPrice: 2,
    outputPrice: 10,
    inputPriceLabel: '$2/M',
    outputPriceLabel: '$10/M',
    throughput: 78,
    latency: 1.4,
    description: 'xAI\'s latest model with real-time internet access.',
    tags: ['Web Access', 'New'],
    isFree: false,
    isNew: true,
  },
  {
    id: 'cohere/command-r-plus',
    name: 'Command R+',
    provider: 'Cohere',
    providerColor: '#39594d',
    context: 128000,
    contextLabel: '128K',
    inputPrice: 3,
    outputPrice: 15,
    inputPriceLabel: '$3/M',
    outputPriceLabel: '$15/M',
    throughput: 60,
    latency: 1.9,
    description: 'Enterprise-grade model optimized for RAG and tool use.',
    tags: ['RAG', 'Enterprise'],
    isFree: false,
    isNew: false,
  },
  {
    id: 'perplexity/llama-3.1-sonar-large',
    name: 'Sonar Large (Online)',
    provider: 'Perplexity',
    providerColor: '#20b2aa',
    context: 127000,
    contextLabel: '127K',
    inputPrice: 1,
    outputPrice: 1,
    inputPriceLabel: '$1/M',
    outputPriceLabel: '$1/M',
    throughput: 55,
    latency: 2.0,
    description: 'Perplexity\'s online model with real-time web search built in.',
    tags: ['Web Search', 'Online'],
    isFree: false,
    isNew: false,
  },
];

function ModelCard({ model }: { model: Model }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50/80 transition-colors duration-100 cursor-pointer group">
      {/* Provider indicator */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
        style={{ backgroundColor: model.providerColor }}
      >
        {model.provider[0]}
      </div>

      {/* Name + tags */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-900 group-hover:text-[#6467F2] transition-colors truncate">
            {model.name}
          </span>
          {model.isFree && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium shrink-0">
              FREE
            </span>
          )}
          {model.isNew && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium shrink-0">
              NEW
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-0.5 truncate">{model.provider}</div>
      </div>

      {/* Context */}
      <div className="hidden sm:flex flex-col items-center gap-0.5 min-w-[52px] text-center">
        <span className="text-xs font-medium text-gray-700">{model.contextLabel}</span>
        <span className="text-[10px] text-gray-400">context</span>
      </div>

      {/* Input price */}
      <div className="hidden md:flex flex-col items-center gap-0.5 min-w-[60px] text-center">
        <span className="text-xs font-medium text-gray-700">{model.inputPriceLabel}</span>
        <span className="text-[10px] text-gray-400">input</span>
      </div>

      {/* Output price */}
      <div className="hidden md:flex flex-col items-center gap-0.5 min-w-[60px] text-center">
        <span className="text-xs font-medium text-gray-700">{model.outputPriceLabel}</span>
        <span className="text-[10px] text-gray-400">output</span>
      </div>

      {/* Throughput */}
      <div className="hidden lg:flex flex-col items-center gap-0.5 min-w-[60px] text-center">
        <span className="text-xs font-medium text-gray-700">{model.throughput} t/s</span>
        <span className="text-[10px] text-gray-400">throughput</span>
      </div>

      {/* Latency */}
      <div className="hidden lg:flex flex-col items-center gap-0.5 min-w-[52px] text-center">
        <span className="text-xs font-medium text-gray-700">{model.latency}s</span>
        <span className="text-[10px] text-gray-400">latency</span>
      </div>

      {/* External link */}
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
      </div>
    </div>
  );
}

export default function ModelsPage() {
  const [search, setSearch] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedOutputTypes, setSelectedOutputTypes] = useState<string[]>([]);
  const [minContext, setMinContext] = useState(0);
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [sortBy, setSortBy] = useState('throughput');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [providerExpanded, setProviderExpanded] = useState(true);
  const [contextExpanded, setContextExpanded] = useState(true);
  const [outputExpanded, setOutputExpanded] = useState(false);

  const toggleProvider = useCallback((p: string) => {
    setSelectedProviders((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }, []);

  const filteredModels = useMemo(() => {
    let result = MODELS.filter((m) => {
      if (search && !m.name.toLowerCase().includes(search.toLowerCase()) &&
          !m.provider.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedProviders.length > 0 && !selectedProviders.includes(m.provider)) return false;
      if (minContext > 0 && m.context < minContext) return false;
      if (showFreeOnly && !m.isFree) return false;
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'throughput': return b.throughput - a.throughput;
        case 'latency': return a.latency - b.latency;
        case 'price_asc': return a.inputPrice - b.inputPrice;
        case 'price_desc': return b.inputPrice - a.inputPrice;
        case 'context': return b.context - a.context;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

    return result;
  }, [search, selectedProviders, minContext, showFreeOnly, sortBy]);

  const clearFilters = () => {
    setSelectedProviders([]);
    setSelectedOutputTypes([]);
    setMinContext(0);
    setShowFreeOnly(false);
  };

  const hasFilters = selectedProviders.length > 0 || minContext > 0 || showFreeOnly;

  return (
    <div className="pt-14 min-h-screen bg-white">
      {/* Page header */}
      <div className="border-b border-gray-200 bg-white sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Models</h1>
              <p className="text-sm text-gray-500">
                {filteredModels.length} of {MODELS.length} models
              </p>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 focus-within:border-[#6467F2] focus-within:ring-2 focus-within:ring-[#6467F2]/20 transition-all w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search models..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 pl-3 pr-8 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white appearance-none outline-none focus:border-[#6467F2] cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filter toggle mobile */}
            <button
              className="sm:hidden flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-700"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {hasFilters && (
                <span className="w-4 h-4 rounded-full bg-[#6467F2] text-white text-[10px] flex items-center justify-center">
                  {selectedProviders.length + (minContext > 0 ? 1 : 0) + (showFreeOnly ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Output type tabs */}
          <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            <button
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors shrink-0 ${
                selectedOutputTypes.length === 0
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
              onClick={() => setSelectedOutputTypes([])}
            >
              All
            </button>
            {OUTPUT_TYPES.map((type) => (
              <button
                key={type}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors shrink-0 ${
                  selectedOutputTypes.includes(type)
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
                onClick={() => setSelectedOutputTypes((prev) =>
                  prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} sm:block w-full sm:w-56 shrink-0`}>
          <div className="sticky top-40 space-y-1">
            {/* Clear filters */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#6467F2] hover:bg-[#6467F2]/5 rounded-md transition-colors mb-2"
              >
                <span>Clear all filters</span>
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Free only toggle */}
            <label className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-50 cursor-pointer">
              <span className="text-sm text-gray-700">Free only</span>
              <div
                className={`w-9 h-5 rounded-full transition-colors ${showFreeOnly ? 'bg-[#6467F2]' : 'bg-gray-200'}`}
                onClick={() => setShowFreeOnly(!showFreeOnly)}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white shadow mt-0.5 transition-transform ${showFreeOnly ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </label>

            {/* Provider filter */}
            <div className="border-t border-gray-100 pt-2 mt-2">
              <button
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setProviderExpanded(!providerExpanded)}
              >
                <span>Provider</span>
                {providerExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {providerExpanded && (
                <div className="mt-1 space-y-0.5 max-h-52 overflow-y-auto">
                  {PROVIDERS.map((p) => (
                    <label
                      key={p}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProviders.includes(p)}
                        onChange={() => toggleProvider(p)}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-[#6467F2] focus:ring-[#6467F2]"
                      />
                      <span className="text-sm text-gray-600">{p}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Context size filter */}
            <div className="border-t border-gray-100 pt-2">
              <button
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setContextExpanded(!contextExpanded)}
              >
                <span>Context size</span>
                {contextExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {contextExpanded && (
                <div className="mt-1 space-y-0.5">
                  {CONTEXT_SIZES.map((s) => (
                    <button
                      key={s.label}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                        minContext === s.value
                          ? 'bg-[#6467F2]/10 text-[#6467F2] font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      onClick={() => setMinContext(s.value)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Model list */}
        <div className="flex-1 min-w-0">
          {/* Column headers */}
          <div className="flex items-center gap-4 px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-200">
            <div className="flex-1">Model</div>
            <div className="hidden sm:block min-w-[52px] text-center">Context</div>
            <div className="hidden md:block min-w-[60px] text-center">Input</div>
            <div className="hidden md:block min-w-[60px] text-center">Output</div>
            <div className="hidden lg:block min-w-[60px] text-center">
              <span className="flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" /> Throughput
              </span>
            </div>
            <div className="hidden lg:block min-w-[52px] text-center">
              <span className="flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" /> Latency
              </span>
            </div>
            <div className="w-5" />
          </div>

          {filteredModels.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-gray-400 mb-2">No models match your filters</div>
              <button onClick={clearFilters} className="text-sm text-[#6467F2] hover:underline">
                Clear all filters
              </button>
            </div>
          ) : (
            <div>
              {filteredModels.map((model) => (
                <ModelCard key={model.id} model={model} />
              ))}
            </div>
          )}

          <div className="py-6 text-center text-xs text-gray-400">
            Showing {filteredModels.length} of 400+ available models.{' '}
            <Link href="#" className="text-[#6467F2] hover:underline">
              View full catalog via API
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
