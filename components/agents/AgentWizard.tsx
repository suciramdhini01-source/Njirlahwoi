"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Bot,
  Gauge,
  Flame,
  Zap,
  Layers,
  Smartphone,
  Rocket,
  Database,
  FileText,
  Brain,
  Plug,
  Eye,
  TestTube,
  Workflow,
  Wrench,
  CloudUpload,
  Sparkles,
} from "lucide-react";
import { useAgentPresetStore, BUILTIN_PRESETS, AgentTier } from "@/store/agent-presets";

const ICONS = [
  { id: "Bot", Icon: Bot },
  { id: "Gauge", Icon: Gauge },
  { id: "Flame", Icon: Flame },
  { id: "Zap", Icon: Zap },
  { id: "Layers", Icon: Layers },
  { id: "Smartphone", Icon: Smartphone },
  { id: "Rocket", Icon: Rocket },
  { id: "Sparkles", Icon: Sparkles },
];

const MCP_TOOLS = [
  { id: "Supabase MCP", Icon: Database, desc: "Database, auth, storage, edge functions" },
  { id: "Notion MCP", Icon: FileText, desc: "Read & write Notion pages and databases" },
  { id: "Memory MCP", Icon: Brain, desc: "Persistent long-term memory across sessions" },
  { id: "Custom MCP server", Icon: Plug, desc: "Connect your own MCP server URL" },
  { id: "Specialized tools", Icon: Wrench, desc: "Domain-specific high-power tools" },
  { id: "Default tools", Icon: Workflow, desc: "File edit, shell, web search, package install" },
];

const SUB_AGENTS = [
  { id: "Vision", Icon: Eye, desc: "Visual QA & design critique" },
  { id: "Fullstack Testing", Icon: TestTube, desc: "End-to-end test generation" },
  { id: "Frontend Testing", Icon: TestTube, desc: "UI component / snapshot tests" },
  { id: "Backend Testing", Icon: TestTube, desc: "API contract & integration tests" },
  { id: "Integration", Icon: Workflow, desc: "Wire third-party services" },
  { id: "Troubleshoot", Icon: Wrench, desc: "Debug production issues" },
  { id: "Deployment", Icon: CloudUpload, desc: "Build, ship, and rollback" },
];

const TEMPLATES = BUILTIN_PRESETS.map((p) => ({
  id: p.id,
  label: p.label,
  tagline: p.tagline,
  systemPrompt: p.systemPrompt,
  mcpTools: p.mcpTools,
  subAgents: p.subAgents,
  icon: p.icon,
}));

const STEPS = ["Basic Info", "MCP Tools", "Sub-agents"] as const;

export function AgentWizard() {
  const router = useRouter();
  const createCustom = useAgentPresetStore((s) => s.createCustom);
  const setActive = useAgentPresetStore((s) => s.setActive);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Bot");
  const [template, setTemplate] = useState(TEMPLATES[0].id);
  const [tier, setTier] = useState<AgentTier>("free");
  const [systemPrompt, setSystemPrompt] = useState(TEMPLATES[0].systemPrompt);
  const [mcp, setMcp] = useState<string[]>(["Default tools"]);
  const [subs, setSubs] = useState<string[]>([]);

  const nameOk = name.trim().length >= 2;

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const applyTemplate = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setTemplate(id);
    setSystemPrompt(t.systemPrompt);
    setMcp(t.mcpTools);
    setSubs(t.subAgents);
    setIcon(t.icon);
  };

  const submit = () => {
    if (!nameOk) return;
    const id = createCustom({
      label: name.trim(),
      tagline: "Custom agent",
      tier,
      icon,
      accent: "#18C493",
      systemPrompt,
      mcpTools: mcp,
      subAgents: subs,
    });
    setActive(id);
    router.push("/");
  };

  const canNext = step === 0 ? nameOk : true;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-[11px] text-gray-500 mb-3"
      >
        <Sparkles className="h-3.5 w-3.5 text-[#18C493]" />
        Define your Agent
      </motion.div>

      <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold text-white tracking-tight">
        Buat <span className="text-[#18C493]">agent baru</span>
      </h1>
      <p className="mt-1.5 text-[13px] text-gray-500">
        Rancang agent dengan tools, sub-agent, dan system prompt sendiri.
      </p>

      <div className="mt-7 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-semibold border transition ${
                i < step
                  ? "bg-[#18C493] border-[#18C493] text-[#052018]"
                  : i === step
                  ? "bg-[#0d1411] border-[#18C493] text-[#18C493]"
                  : "bg-white/[0.03] border-white/[0.08] text-gray-500"
              }`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={`text-[12px] font-medium whitespace-nowrap ${
                i === step ? "text-white" : "text-gray-500"
              }`}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px ${
                  i < step ? "bg-[#18C493]" : "bg-white/[0.08]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#070b09]/90 p-5">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="basic"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="space-y-5"
            >
              <div>
                <label className="text-[11px] uppercase tracking-wider text-gray-500">
                  Nama Agent
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="contoh: Kode Kilat"
                  className="mt-1.5 w-full bg-[#0c1411] border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#18C493] transition"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-gray-500">
                  Icon
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ICONS.map(({ id, Icon }) => (
                    <button
                      key={id}
                      onClick={() => setIcon(id)}
                      className={`h-9 w-9 rounded-lg flex items-center justify-center border transition ${
                        icon === id
                          ? "bg-[#18C493]/15 border-[#18C493]/60 text-[#18C493]"
                          : "bg-white/[0.03] border-white/[0.08] text-gray-400 hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-gray-500">
                  Template Dasar
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {TEMPLATES.map((t) => {
                    const active = template === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => applyTemplate(t.id)}
                        className={`text-left rounded-lg p-3 border transition ${
                          active
                            ? "bg-[#18C493]/10 border-[#18C493]/50"
                            : "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.2]"
                        }`}
                      >
                        <p className="text-[12.5px] font-semibold text-white">
                          {t.label}
                        </p>
                        <p className="text-[10.5px] text-gray-500 mt-0.5">{t.tagline}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-gray-500">
                  Tier
                </label>
                <div className="mt-2 flex gap-2">
                  {(["free", "pro", "beta"] as AgentTier[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTier(t)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border uppercase tracking-wide transition ${
                        tier === t
                          ? "bg-[#18C493]/15 border-[#18C493]/50 text-[#18C493]"
                          : "bg-white/[0.03] border-white/[0.08] text-gray-400"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-gray-500">
                  System Prompt
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={6}
                  className="mt-1.5 w-full bg-[#0c1411] border border-white/[0.08] rounded-lg px-3 py-2.5 text-[12.5px] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#18C493] font-mono leading-relaxed resize-none"
                />
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="mcp"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="space-y-3"
            >
              <p className="text-[12px] text-gray-500">
                Pilih MCP tools yang boleh digunakan agent ini.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MCP_TOOLS.map((t) => {
                  const active = mcp.includes(t.id);
                  const Icon = t.Icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggle(mcp, setMcp, t.id)}
                      className={`text-left rounded-lg p-3 border transition flex items-start gap-2.5 ${
                        active
                          ? "bg-[#18C493]/10 border-[#18C493]/50"
                          : "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.2]"
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${
                          active
                            ? "bg-[#18C493]/20 text-[#18C493]"
                            : "bg-white/[0.04] text-gray-400"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-white">{t.id}</p>
                        <p className="text-[10.5px] text-gray-500 mt-0.5 leading-snug">
                          {t.desc}
                        </p>
                      </div>
                      {active && <Check className="h-3.5 w-3.5 text-[#18C493]" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="subs"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="space-y-3"
            >
              <p className="text-[12px] text-gray-500">
                Tambahkan sub-agent untuk tugas terspesialisasi.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUB_AGENTS.map((t) => {
                  const active = subs.includes(t.id);
                  const Icon = t.Icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggle(subs, setSubs, t.id)}
                      className={`text-left rounded-lg p-3 border transition flex items-start gap-2.5 ${
                        active
                          ? "bg-[#18C493]/10 border-[#18C493]/50"
                          : "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.2]"
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${
                          active
                            ? "bg-[#18C493]/20 text-[#18C493]"
                            : "bg-white/[0.04] text-gray-400"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-white">{t.id}</p>
                        <p className="text-[10.5px] text-gray-500 mt-0.5 leading-snug">
                          {t.desc}
                        </p>
                      </div>
                      {active && <Check className="h-3.5 w-3.5 text-[#18C493]" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => (step === 0 ? router.back() : setStep(step - 1))}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-medium text-gray-400 hover:text-white transition"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {step === 0 ? "Batal" : "Kembali"}
        </motion.button>

        {step < STEPS.length - 1 ? (
          <motion.button
            whileHover={canNext ? { scale: 1.03 } : {}}
            whileTap={canNext ? { scale: 0.97 } : {}}
            onClick={() => canNext && setStep(step + 1)}
            disabled={!canNext}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-semibold transition ${
              canNext
                ? "bg-gradient-to-r from-[#18C493] to-[#14B489] text-[#052018] shadow-[0_0_18px_rgba(24,196,147,0.45)]"
                : "bg-white/[0.04] text-gray-600 cursor-not-allowed"
            }`}
          >
            Lanjut
            <ChevronRight className="h-3.5 w-3.5" />
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={submit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-semibold bg-gradient-to-r from-[#18C493] to-[#14B489] text-[#052018] shadow-[0_0_18px_rgba(24,196,147,0.45)]"
          >
            <Check className="h-3.5 w-3.5" />
            Buat Agent
          </motion.button>
        )}
      </div>
    </div>
  );
}
