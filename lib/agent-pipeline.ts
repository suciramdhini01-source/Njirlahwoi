import { AgentFile, AgentStep, ModelSource } from "@/types";
import { AgentPlan } from "@/store/agent";
import { AgentPreset } from "@/store/agent-presets";

export interface PipelineCallbacks {
  onStep: (step: AgentStep) => void;
  updateStep: (id: string, patch: Partial<AgentStep>) => void;
  onFileStart: (path: string) => void;
  onFileChunk: (path: string, chunk: string) => void;
  onFileEnd: (path: string) => void;
  onFileRewrite: (path: string, content: string) => void;
  onLog: (msg: string) => void;
  onPlan: (plan: AgentPlan) => void;
  onToolCall: (tool: string, args: unknown, result: unknown) => void;
  signal: AbortSignal;
}

export interface PipelineInput {
  prompt: string;
  modelSource: ModelSource;
  modelId: string;
  apiKey: string;
  cfToken: string;
  cfAccountId: string;
  sessionId: string;
  projectId?: string;
  preset: AgentPreset | null;
  existingPlan: AgentPlan | null;
}

function authHeaders(src: ModelSource, input: PipelineInput): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (src === "openrouter") {
    h["x-api-key"] = input.apiKey;
  } else if (src === "cloudflare") {
    h["x-cf-token"] = input.cfToken;
    h["x-cf-account-id"] = input.cfAccountId;
  }
  // anthropic/gemini/replit/njiriah: server-side keys via env, no client headers needed
  return h;
}

function heuristicPlan(prompt: string, preset: AgentPreset | null): AgentPlan {
  const nextish = preset?.id === "nextjs" || /next\.?js|app router/i.test(prompt);
  return {
    summary: prompt.slice(0, 200),
    techStack: nextish
      ? ["Next.js (App Router)", "React", "Tailwind CSS"]
      : ["React", "Tailwind CSS"],
    files: nextish
      ? [
          { path: "app/layout.tsx", purpose: "Root shell with providers and globals" },
          { path: "app/page.tsx", purpose: "Landing page with hero and features" },
          { path: "app/globals.css", purpose: "Tailwind globals + CSS variables" },
          { path: "components/Hero.tsx", purpose: "Hero section component" },
          { path: "components/Features.tsx", purpose: "Feature grid" },
          { path: "components/Footer.tsx", purpose: "Footer section" },
        ]
      : [
          { path: "src/App.tsx", purpose: "Root React component" },
          { path: "src/components/Hero.tsx", purpose: "Hero section" },
          { path: "src/components/Features.tsx", purpose: "Feature grid" },
          { path: "src/index.css", purpose: "Global styles" },
        ],
    pages: [{ route: "/", purpose: "Landing" }],
    designTokens: {
      palette: {
        bg: "#05050A",
        surface: "#0B0B12",
        primary: "#18C493",
        accent: "#7CF7D0",
        text: "#E6E6EC",
      },
      typography: { heading: "Space Grotesk", body: "Inter" },
      radius: "0.75rem",
      vibe: "clean modern dark UI with neon accents",
    },
  };
}

async function runPlanner(input: PipelineInput, cb: PipelineCallbacks): Promise<AgentPlan> {
  const stepId = crypto.randomUUID();
  cb.onStep({
    id: stepId,
    title: "Planner",
    description: "Menyusun arsitektur proyek + design tokens",
    status: "running",
    startedAt: Date.now(),
  });
  cb.onLog("Planner: menganalisis prompt...");

  if (input.existingPlan) {
    cb.onLog("Planner: menggunakan plan yang sudah ada");
    cb.updateStep(stepId, { status: "done", endedAt: Date.now() });
    cb.onPlan(input.existingPlan);
    return input.existingPlan;
  }

  if (input.projectId) {
    try {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/nj-plan`;
      const byok =
        input.modelSource === "openrouter"
          ? { source: "openrouter" as const, apiKey: input.apiKey, modelId: input.modelId }
          : {
              source: "cloudflare" as const,
              cfToken: input.cfToken,
              cfAccountId: input.cfAccountId,
              modelId: input.modelId,
            };
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          sessionId: input.sessionId,
          projectId: input.projectId,
          byok,
        }),
        signal: cb.signal,
      });
      if (res.ok) {
        const { plan } = await res.json();
        if (plan) {
          cb.onLog(`Planner: ${plan.files?.length || 0} file, stack ${(plan.techStack || []).join(", ")}`);
          cb.updateStep(stepId, { status: "done", endedAt: Date.now() });
          cb.onPlan(plan);
          return plan;
        }
      }
    } catch {
      /* fall through */
    }
  }

  const plan = heuristicPlan(input.prompt, input.preset);
  cb.onLog(`Planner (heuristic): ${plan.files.length} file, stack ${plan.techStack.join(", ")}`);
  cb.updateStep(stepId, { status: "done", endedAt: Date.now() });
  cb.onPlan(plan);
  return plan;
}

async function callTool(tool: string, args: unknown): Promise<unknown> {
  const res = await fetch("/api/tools/dispatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, args }),
  });
  if (!res.ok) return { error: `tool ${tool} ${res.status}` };
  return (await res.json()).result;
}

async function runToolsPass(
  input: PipelineInput,
  plan: AgentPlan,
  cb: PipelineCallbacks
): Promise<Record<string, unknown>> {
  const stepId = crypto.randomUUID();
  cb.onStep({
    id: stepId,
    title: "Tools",
    description: "Memanggil MCP tools (icons, components, docs)",
    status: "running",
    startedAt: Date.now(),
  });

  const collected: Record<string, unknown> = {};

  // Icon search based on file purposes
  const concepts = Array.from(
    new Set(
      plan.files
        .flatMap((f) => (f.purpose || "").toLowerCase().split(/\W+/))
        .filter((w) => w.length > 3)
    )
  ).slice(0, 4);

  for (const c of concepts) {
    try {
      const res = await callTool("iconSearch", { concept: c });
      collected[`icons:${c}`] = res;
      cb.onToolCall("iconSearch", { concept: c }, res);
    } catch {}
  }

  // Component registry hints if preset is "nextjs" or "prototype"
  if (input.preset && ["nextjs", "proto-frontend", "e-2", "e-3"].includes(input.preset.id)) {
    for (const name of ["Button", "Card", "Tabs"]) {
      try {
        const res = await callTool("componentRegistry", { name });
        collected[`component:${name}`] = res;
        cb.onToolCall("componentRegistry", { name }, res);
      } catch {}
    }
  }

  cb.updateStep(stepId, { status: "done", endedAt: Date.now() });
  cb.onLog(`Tools: ${Object.keys(collected).length} hasil dikumpulkan`);
  return collected;
}

async function runCoderForFile(
  filePath: string,
  filePurpose: string,
  existingFiles: AgentFile[],
  input: PipelineInput,
  plan: AgentPlan,
  cb: PipelineCallbacks,
  previousError?: string
): Promise<void> {
  const promptWithErr = previousError
    ? `${input.prompt}\n\n(Your previous attempt at ${filePath} failed with: ${previousError.slice(0, 400)}. Fix the issue and output a correct file.)`
    : input.prompt;
  const res = await fetch("/api/agent/file", {
    method: "POST",
    headers: authHeaders(input.modelSource, input),
    signal: cb.signal,
    body: JSON.stringify({
      prompt: promptWithErr,
      modelSource: input.modelSource,
      modelId: input.modelId,
      plan,
      filePath,
      filePurpose,
      existingFiles: existingFiles.map((f) => ({ path: f.path, content: f.content })),
      preset: input.preset ? { id: input.preset.id, systemPrompt: input.preset.systemPrompt } : undefined,
    }),
  });

  if (!res.ok || !res.body) {
    const t = await res.text();
    throw new Error(`coder ${filePath}: ${t}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let event = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) {
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try {
          const data = JSON.parse(payload);
          if (event === "file_start") cb.onFileStart(data.path);
          else if (event === "file_chunk") cb.onFileChunk(data.path, data.chunk);
          else if (event === "file_end") cb.onFileEnd(data.path);
          else if (event === "file_rewrite") cb.onFileRewrite(data.path, data.content);
          else if (event === "error") throw new Error(data.message || "stream error");
        } catch (e) {
          if (event === "error") throw e;
        }
      } else if (line === "") event = "";
    }
  }
}

export async function runPipeline(
  input: PipelineInput,
  cb: PipelineCallbacks
): Promise<{ plan: AgentPlan; files: AgentFile[] }> {
  const plan = await runPlanner(input, cb);
  await runToolsPass(input, plan, cb);

  const built: AgentFile[] = [];
  for (let i = 0; i < plan.files.length; i++) {
    if (cb.signal.aborted) break;
    const target = plan.files[i];
    const stepId = crypto.randomUUID();
    cb.onStep({
      id: stepId,
      title: `Coder ${i + 1}/${plan.files.length}`,
      description: `Menulis ${target.path}`,
      status: "running",
      startedAt: Date.now(),
      files: [target.path],
    });
    try {
      await runCoderForFile(target.path, target.purpose, built, input, plan, cb);
      built.push({
        path: target.path,
        content: "",
        language: target.path.split(".").pop() || "text",
      });
      cb.updateStep(stepId, { status: "done", endedAt: Date.now() });
    } catch (e) {
      const msg = (e as Error).message || "error";
      cb.onLog(`Coder gagal ${target.path}: ${msg}. Mencoba ulang file ini...`);
      try {
        await runCoderForFile(target.path, target.purpose, built, input, plan, cb, msg);
        built.push({
          path: target.path,
          content: "",
          language: target.path.split(".").pop() || "text",
        });
        cb.updateStep(stepId, { status: "done", endedAt: Date.now() });
        cb.onLog(`Retry berhasil untuk ${target.path}`);
      } catch (e2) {
        const m2 = (e2 as Error).message || "error";
        cb.onLog(`Retry gagal ${target.path}: ${m2}`);
        cb.updateStep(stepId, { status: "error", endedAt: Date.now() });
      }
    }
  }

  return { plan, files: built };
}

export async function retryFile(
  filePath: string,
  input: PipelineInput,
  plan: AgentPlan,
  existingFiles: AgentFile[],
  cb: PipelineCallbacks
): Promise<void> {
  const target = plan.files.find((f) => f.path === filePath);
  if (!target) {
    cb.onLog(`Tidak ada file ${filePath} di plan`);
    return;
  }
  const stepId = crypto.randomUUID();
  cb.onStep({
    id: stepId,
    title: `Retry ${filePath}`,
    description: `Regenerasi ${filePath}`,
    status: "running",
    startedAt: Date.now(),
    files: [filePath],
  });
  try {
    const peers = existingFiles.filter((f) => f.path !== filePath);
    await runCoderForFile(target.path, target.purpose, peers, input, plan, cb, "user requested retry");
    cb.updateStep(stepId, { status: "done", endedAt: Date.now() });
    cb.onLog(`Retry selesai untuk ${filePath}`);
  } catch (e) {
    cb.updateStep(stepId, { status: "error", endedAt: Date.now() });
    cb.onLog(`Retry gagal: ${(e as Error).message}`);
  }
}
