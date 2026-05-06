"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Palette,
  Users,
  ListChecks,
  Plug,
  HelpCircle,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Check,
} from "lucide-react";
import { getSessionId } from "@/lib/supabase";
import { useProjectStore } from "@/store/projects";
import { useAgentPresetStore, BUILTIN_PRESETS } from "@/store/agent-presets";
import { useApiKeyStore } from "@/store/api-key";
import { useAgentStore, AgentPlan } from "@/store/agent";
import { DesignPreviewCard, buildOptions, PaletteOption } from "./DesignPreviewCard";

interface Clarification {
  id: string;
  question: string;
  category: "design" | "audience" | "features" | "integration" | "general";
  answer: string;
}

const CATEGORY_ICON = {
  design: Palette,
  audience: Users,
  features: ListChecks,
  integration: Plug,
  general: HelpCircle,
} as const;

const CATEGORY_LABEL = {
  design: "Desain",
  audience: "Audiens",
  features: "Fitur",
  integration: "Integrasi",
  general: "Umum",
} as const;

export function ClarifyPanel() {
  const router = useRouter();
  const activeId = useProjectStore((s) => s.activeId);
  const projects = useProjectStore((s) => s.projects);
  const hydrated = useProjectStore((s) => s.hydrated);
  const hydrateProjects = useProjectStore((s) => s.hydrate);
  const setStatus = useProjectStore((s) => s.setStatus);

  const agentPresetId = useAgentPresetStore((s) => s.activeId);
  const hydratePresets = useAgentPresetStore((s) => s.hydrate);
  const openrouterKey = useApiKeyStore((s) => s.openrouterKey);
  const cloudflareToken = useApiKeyStore((s) => s.cloudflareToken);
  const cloudflareAccountId = useApiKeyStore((s) => s.cloudflareAccountId);
  const hydrateKeys = useApiKeyStore((s) => s.hydrate);
  const setPlan = useAgentStore((s) => s.setPlan);
  const resetAgent = useAgentStore((s) => s.reset);
  const agent =
    BUILTIN_PRESETS.find((p) => p.id === agentPresetId) || BUILTIN_PRESETS[0];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Clarification[]>([]);
  const [serverProjectId, setServerProjectId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"questions" | "design">("questions");
  const [plan, setLocalPlan] = useState<AgentPlan | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<string>("plan");

  const activeProject = projects.find((p) => p.id === activeId) || null;

  useEffect(() => {
    hydrateProjects();
    hydratePresets();
    hydrateKeys();
  }, [hydrateProjects, hydratePresets, hydrateKeys]);

  useEffect(() => {
    if (!hydrated) return;
    if (!activeProject) {
      router.replace("/");
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/nj-clarify`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            sessionId: getSessionId(),
            name: activeProject.name,
            prompt: activeProject.prompt,
            kind: activeProject.kind,
            agentPresetId,
            byok: openrouterKey
              ? { source: "openrouter", apiKey: openrouterKey }
              : cloudflareToken && cloudflareAccountId
              ? {
                  source: "cloudflare",
                  cfToken: cloudflareToken,
                  cfAccountId: cloudflareAccountId,
                }
              : undefined,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        if (cancelled) return;

        const rowsRes = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/nj_project_clarifications?project_id=eq.${json.projectId}&order=order_idx.asc&select=id,question,category,answer`,
          {
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
          }
        );
        const rows = (await rowsRes.json()) as Clarification[];
        if (cancelled) return;
        setServerProjectId(json.projectId);
        setQuestions(rows);
      } catch (e) {
        if (!cancelled) setError((e as Error).message || "Gagal memuat pertanyaan");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, activeProject?.id, agentPresetId]);

  const setAnswer = (id: string, val: string) => {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, answer: val } : q)));
  };

  const canProceed = questions.length > 0 && questions.every((q) => q.answer.trim().length > 0);

  const finalize = async (skip = false) => {
    if (!serverProjectId || !activeProject) return;
    setSaving(true);
    try {
      const saveUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/nj-clarify-save`;
      await fetch(saveUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          projectId: serverProjectId,
          sessionId: getSessionId(),
          answers: skip ? [] : questions.map((q) => ({ id: q.id, answer: q.answer })),
          finalize: true,
        }),
      });

      const byok = openrouterKey
        ? { source: "openrouter" as const, apiKey: openrouterKey }
        : cloudflareToken && cloudflareAccountId
        ? {
            source: "cloudflare" as const,
            cfToken: cloudflareToken,
            cfAccountId: cloudflareAccountId,
          }
        : undefined;

      const planUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/nj-plan`;
      const planRes = await fetch(planUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          projectId: serverProjectId,
          sessionId: getSessionId(),
          byok,
        }),
      });
      let receivedPlan: AgentPlan | null = null;
      if (planRes.ok) {
        const { plan: p } = await planRes.json();
        receivedPlan = p || null;
      }
      setLocalPlan(receivedPlan);
      setSelectedPalette("plan");
      setPhase("design");
      setSaving(false);
    } catch {
      setSaving(false);
    }
  };

  const confirmDesign = (opt: PaletteOption) => {
    if (!activeProject) return;
    resetAgent();
    const finalPlan: AgentPlan | null = plan
      ? {
          ...plan,
          designTokens: {
            ...plan.designTokens,
            palette: opt.palette,
            typography: opt.typography,
            vibe: opt.vibe,
          },
        }
      : null;
    setPlan(finalPlan);
    setStatus(activeProject.id, "building");
    router.push("/agent");
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <motion.button
        whileHover={{ x: -3 }}
        onClick={() => router.push("/")}
        className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-white transition mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali
      </motion.button>

      <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-3">
        <Sparkles className="h-3.5 w-3.5 text-[#18C493]" />
        Agent has questions for you
      </div>

      <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold text-white tracking-tight">
        Sebelum <span className="text-[#18C493]">{agent.label}</span> mulai, butuh klarifikasi
      </h1>
      <p className="mt-1.5 text-[13px] text-gray-500">
        Semakin spesifik jawaban kamu, semakin akurat hasil desain & kode yang dihasilkan.
      </p>

      {activeProject && (
        <div className="mt-4 rounded-xl bg-[#070b09]/80 border border-white/[0.06] px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
            Prompt awal
          </p>
          <p className="text-[13px] text-gray-200 leading-relaxed">{activeProject.prompt}</p>
        </div>
      )}

      {phase === "design" && (
        <div className="mt-6 space-y-4">
          <DesignPreviewCard
            options={buildOptions(plan)}
            selectedId={selectedPalette}
            onSelect={(o) => setSelectedPalette(o.id)}
          />
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setPhase("questions")}
              className="text-[12px] text-gray-400 hover:text-white transition"
            >
              Ubah jawaban
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                const opts = buildOptions(plan);
                const chosen = opts.find((o) => o.id === selectedPalette) || opts[0];
                confirmDesign(chosen);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-semibold bg-gradient-to-r from-[#18C493] to-[#14B489] text-[#052018] shadow-[0_0_18px_rgba(24,196,147,0.45)]"
            >
              Konfirmasi desain
              <ChevronRight className="h-3.5 w-3.5" />
            </motion.button>
          </div>
        </div>
      )}

      <div className={`mt-6 space-y-3 ${phase === "design" ? "hidden" : ""}`}>
        {loading && (
          <div className="flex items-center gap-2 text-[12px] text-gray-500 py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-[#18C493]" />
            Menyiapkan pertanyaan klarifikasi...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[12px] text-red-300">
            {error}
          </div>
        )}

        <AnimatePresence initial={false}>
          {!loading &&
            questions.map((q, i) => {
              const Icon = CATEGORY_ICON[q.category] || HelpCircle;
              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-white/[0.08] bg-[#070b09]/90 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 shrink-0 rounded-md flex items-center justify-center bg-[#18C493]/15 border border-[#18C493]/30">
                      <Icon className="h-4 w-4 text-[#18C493]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-wider text-[#9BF3D3] font-semibold">
                          {CATEGORY_LABEL[q.category]}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {i + 1} / {questions.length}
                        </span>
                      </div>
                      <p className="text-[13.5px] text-white leading-snug">{q.question}</p>
                      <textarea
                        value={q.answer}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                        placeholder="Jawabanmu..."
                        rows={2}
                        className="mt-2 w-full bg-[#0c1411] border border-white/[0.08] rounded-lg px-3 py-2 text-[12.5px] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#18C493] transition resize-none"
                      />
                    </div>
                    {q.answer.trim() && (
                      <Check className="h-4 w-4 text-[#18C493] shrink-0 mt-1.5" />
                    )}
                  </div>
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>

      {!loading && phase === "questions" && questions.length > 0 && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <motion.button
            whileHover={{ x: -2 }}
            disabled={saving}
            onClick={() => finalize(true)}
            className="text-[12px] text-gray-400 hover:text-white transition disabled:opacity-50"
          >
            Lewati & mulai tanpa klarifikasi
          </motion.button>

          <motion.button
            whileHover={canProceed && !saving ? { scale: 1.03 } : {}}
            whileTap={canProceed && !saving ? { scale: 0.97 } : {}}
            disabled={!canProceed || saving}
            onClick={() => finalize(false)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-semibold transition ${
              canProceed && !saving
                ? "bg-gradient-to-r from-[#18C493] to-[#14B489] text-[#052018] shadow-[0_0_18px_rgba(24,196,147,0.45)]"
                : "bg-white/[0.04] text-gray-600 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                Mulai Build
                <ChevronRight className="h-3.5 w-3.5" />
              </>
            )}
          </motion.button>
        </div>
      )}
    </div>
  );
}
