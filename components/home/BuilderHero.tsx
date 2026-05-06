"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Smartphone,
  FileText,
  Paperclip,
  GitBranch,
  Cpu,
  Sparkles,
  User,
  Mic,
  ArrowUp,
  ChevronDown,
  Zap,
  FileCode2,
  MessageSquare,
  Sun,
  ListChecks,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProjectStore, ProjectKind } from "@/store/projects";
import { useWorkspaceStore } from "@/store/workspace";
import { RecentProjects } from "./RecentProjects";
import { useAgentPresetStore } from "@/store/agent-presets";
import { AgentPicker } from "./AgentPicker";

const TABS: { id: ProjectKind; label: string; icon: typeof Layers }[] = [
  { id: "fullstack", label: "Full Stack App", icon: Layers },
  { id: "mobile", label: "Mobile App", icon: Smartphone },
  { id: "landing", label: "Landing Page", icon: FileText },
];

const TEMPLATES = [
  { label: "Wingman", icon: MessageSquare, badge: "Beta", prompt: "Build a wingman conversation coach with real-time suggestions" },
  { label: "My Counter Part", icon: Zap, prompt: "Create a productivity counterpart app that tracks daily goals" },
  { label: "Bill Generator", icon: FileCode2, prompt: "Make a bill generator with PDF export and customer management" },
  { label: "Word of the Day", icon: Sun, prompt: "Build a word of the day app with vocabulary cards and quizzes" },
];

const PLACEHOLDERS: Record<ProjectKind, string> = {
  fullstack: "Build me an e-commerce platform with...",
  mobile: "Design a mobile app for habit tracking...",
  landing: "Create a landing page for a SaaS product...",
};

export function BuilderHero() {
  const [tab, setTab] = useState<ProjectKind>("fullstack");
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const create = useProjectStore((s) => s.create);
  const hydrateProjects = useProjectStore((s) => s.hydrate);
  const hydrated = useProjectStore((s) => s.hydrated);
  const hydratePresets = useAgentPresetStore((s) => s.hydrate);
  const createWorkspace = useWorkspaceStore((s) => s.createProject);
  const loadRecent = useWorkspaceStore((s) => s.loadRecent);
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) hydrateProjects();
    hydratePresets();
    loadRecent();
  }, [hydrated, hydrateProjects, hydratePresets, loadRecent]);

  const handleSubmit = async () => {
    const text = prompt.trim();
    if (!text) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      // Create in workspace store (Supabase-backed, isolated state)
      const wsId = await createWorkspace({ prompt: text, kind: tab });
      // Also keep legacy local store in sync
      create({ prompt: text, kind: tab });
      await new Promise((r) => setTimeout(r, 120));
      router.push(`/workspace/${wsId}`);
    } catch {
      setSubmitting(false);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="relative z-10 w-full">
      {/* HERO */}
      <section className="relative px-6 pt-24 pb-20 flex flex-col items-center">
        {/* Soft radial halo behind hero */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(600px circle at 50% 180px, rgba(24,196,147,0.14), transparent 60%)",
          }}
        />

        {/* You Project pill */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a1310]/80 border border-[#18C493]/25 mb-6 shadow-[0_0_18px_rgba(24,196,147,0.12)]"
        >
          <motion.span
            animate={{ scale: [1, 1.35, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-2 w-2 rounded-full bg-[#18C493] shadow-[0_0_8px_#18C493]"
          />
          <span className="text-[11px] font-medium text-gray-200">Your Project</span>
          <ChevronDown className="h-3 w-3 text-gray-500" />
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="relative font-[family-name:var(--font-space-grotesk)] text-[36px] md:text-[46px] font-medium text-white tracking-tight text-center"
        >
          What will you <span className="text-[#18C493]">build</span> today?
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.14 }}
          className="relative mt-2 text-[13px] text-gray-500 text-center max-w-md"
        >
          Tulis ide Anda, agent NJIRLAH yang membangunnya.
        </motion.p>

        {/* Prompt card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={shake ? { opacity: 1, y: 0, x: [0, -8, 8, -6, 6, -3, 3, 0] } : { opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 22 }}
          className="relative w-full max-w-[720px] mt-7 rounded-2xl bg-[#070b09]/95 border border-white/[0.08] backdrop-blur-xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
        >
          {/* Glow border on hover */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 transition-opacity"
            style={{
              background:
                "linear-gradient(120deg, transparent 40%, rgba(24,196,147,0.25) 50%, transparent 60%)",
            }}
          />

          {/* Tabs */}
          <div className="flex items-center gap-0 px-2 pt-2 border-b border-white/[0.06]">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium transition ${
                    active ? "text-white" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="builder-tab"
                      className="absolute inset-0 rounded-t-lg bg-[#0d1411]"
                      transition={{ type: "spring", stiffness: 320, damping: 26 }}
                    />
                  )}
                  <Icon className="h-3.5 w-3.5 relative" />
                  <span className="relative">{t.label}</span>
                  {active && (
                    <motion.span
                      layoutId="builder-tab-underline"
                      className="absolute left-2 right-2 bottom-0 h-[2px] bg-[#18C493] rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Textarea */}
          <div className="px-4 pt-4 pb-2">
            <AnimatePresence mode="wait">
              <motion.textarea
                key={tab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={PLACEHOLDERS[tab]}
                rows={3}
                className="w-full bg-transparent outline-none text-[14px] text-white placeholder:text-gray-500 resize-none leading-relaxed"
              />
            </AnimatePresence>
          </div>

          {/* Footer row */}
          <div className="flex items-center gap-1 px-3 pb-3">
            <IconButton icon={Paperclip} title="Lampirkan" />
            <PillButton icon={GitBranch} label="main" title="Branch" />
            <AgentPicker />
            <PillButton icon={User} label="Maxx" dot title="Role" />

            <div className="ml-auto flex items-center gap-1">
              <IconButton icon={ListChecks} title="Outline" />
              <IconButton icon={Mic} title="Voice" />
              <motion.button
                onClick={handleSubmit}
                disabled={!prompt.trim() || submitting}
                whileHover={prompt.trim() ? { scale: 1.08 } : {}}
                whileTap={prompt.trim() ? { scale: 0.92 } : {}}
                animate={prompt.trim() ? { boxShadow: ["0 0 0 rgba(24,196,147,0.0)", "0 0 18px rgba(24,196,147,0.55)", "0 0 0 rgba(24,196,147,0.0)"] } : {}}
                transition={{ boxShadow: { duration: 2, repeat: Infinity } }}
                className={`h-8 w-8 flex items-center justify-center rounded-full transition ${
                  prompt.trim()
                    ? "bg-gradient-to-br from-[#18C493] to-[#0FAF7A] text-[#052018]"
                    : "bg-white/[0.06] border border-white/[0.08] text-gray-500 cursor-not-allowed"
                }`}
                aria-label="Kirim"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowUp className="h-3.5 w-3.5" />
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Template chips */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="relative flex flex-wrap items-center justify-center gap-2 mt-6"
        >
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            return (
              <motion.button
                key={t.label}
                whileHover={{ y: -2, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setPrompt(t.prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0a1310]/80 border border-white/[0.08] text-[11px] text-gray-300 hover:text-white hover:border-[#18C493]/40 hover:bg-[#0d1714] transition"
              >
                <Icon className="h-3 w-3" />
                {t.label}
                {t.badge && (
                  <span className="px-1.5 py-[1px] rounded-full bg-[#18C493]/25 border border-[#18C493]/50 text-[8px] font-semibold text-[#9BF3D3]">
                    {t.badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative text-[10px] text-gray-600 mt-8 font-mono tracking-wider"
        >
          CMD + ENTER UNTUK KIRIM
        </motion.p>
      </section>

      {/* FEATURES GRID */}
      <section className="relative px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <FeatureCard
              icon={Sparkles}
              title="Multi-model AI"
              description="6 provider built-in + 20 BYOK. Claude, GPT, Gemini, Llama, Qwen — semua dalam satu tempat."
            />
            <FeatureCard
              icon={Cpu}
              title="Agent Codegen"
              description="Prompt ke app full-stack dalam hitungan detik. Live preview sandbox Babel + iframe."
            />
            <FeatureCard
              icon={Zap}
              title="Edge-first"
              description="Streaming SSE, AES-GCM BYOK encryption, Supabase persistence, 0ms cold-start."
            />
          </motion.div>
        </div>
      </section>

      {/* RECENT PROJECTS */}
      <RecentProjects />

      {/* LED CTA SECTION */}
      <section className="relative flex flex-col items-center px-6 pt-10 pb-28 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-[family-name:var(--font-space-grotesk)] text-[46px] md:text-[60px] font-bold text-white leading-[1.05] tracking-tight"
        >
          Start building with
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, type: "spring", stiffness: 140, damping: 18 }}
          className="mt-5"
        >
          <LedText text="NJIRLAH TODAY" />
        </motion.div>

        <Link href="/">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              document
                .querySelector("textarea")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="mt-12 px-8 py-3 rounded-full bg-white text-[#0a0e0c] text-[13px] font-semibold shadow-[0_10px_40px_rgba(255,255,255,0.18)] hover:shadow-[0_16px_50px_rgba(255,255,255,0.28)] transition"
          >
            Keep Building
          </motion.button>
        </Link>
      </section>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Cpu;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative rounded-2xl border border-white/[0.07] bg-[#070b09]/70 p-5 overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"
        style={{
          background:
            "radial-gradient(400px circle at 50% 0%, rgba(24,196,147,0.14), transparent 70%)",
        }}
      />
      <div className="relative">
        <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-[#18C493]/15 border border-[#18C493]/30 mb-3">
          <Icon className="h-4 w-4 text-[#18C493]" />
        </div>
        <h3 className="text-[14px] font-semibold text-white mb-1.5">{title}</h3>
        <p className="text-[12px] text-gray-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

function PillButton({
  icon: Icon,
  label,
  accent,
  dot,
  title,
}: {
  icon: typeof Cpu;
  label: string;
  accent?: boolean;
  dot?: boolean;
  title?: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      title={title}
      className={`flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-medium border transition ${
        accent
          ? "bg-[#18C49322] border-[#18C493]/40 text-[#BFF5E0]"
          : "bg-white/[0.04] border-white/[0.08] text-gray-300 hover:bg-white/[0.08]"
      }`}
    >
      <Icon className={`h-3 w-3 ${accent ? "text-[#18C493]" : ""}`} />
      {label && <span>{label}</span>}
      {dot && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-[#18C493]" />}
      <ChevronDown className="h-2.5 w-2.5 opacity-60" />
    </motion.button>
  );
}

function IconButton({ icon: Icon, title }: { icon: typeof Cpu; title?: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title={title}
      className="h-7 w-7 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/[0.06] transition"
    >
      <Icon className="h-3.5 w-3.5" />
    </motion.button>
  );
}

function LedText({ text }: { text: string }) {
  return (
    <div className="relative inline-block">
      <span
        aria-hidden
        className="absolute inset-0 font-[family-name:var(--font-orbitron)] text-[46px] md:text-[72px] font-black tracking-[0.14em] blur-[10px] opacity-70"
        style={{ color: "#18C493" }}
      >
        {text}
      </span>
      <span
        className="relative font-[family-name:var(--font-orbitron)] text-[46px] md:text-[72px] font-black tracking-[0.14em]"
        style={{
          color: "#18C493",
          textShadow:
            "0 0 4px #18C493, 0 0 12px rgba(24,196,147,0.85), 0 0 26px rgba(24,196,147,0.6), 0 0 50px rgba(24,196,147,0.35)",
        }}
      >
        {text}
      </span>
    </div>
  );
}
