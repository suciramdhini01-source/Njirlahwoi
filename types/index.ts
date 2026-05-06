export type ModelProvider =
  | "replit"
  | "anthropic"
  | "gemini"
  | "cloudflare"
  | "openrouter"
  | "njiriah";

export type ModelSource = ModelProvider;

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  source: ModelSource;
  context?: number;
  free?: boolean;
  description?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  tokens?: number;
  latencyMs?: number;
  tokensPerSec?: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  modelId: string;
  source: ModelSource;
  updatedAt: number;
}

export interface AgentFile {
  path: string;
  content: string;
  language?: string;
}

export type AgentRole = "planner" | "designer" | "coder" | "reviewer";

export interface AgentStep {
  id: string;
  role?: AgentRole;
  title: string;
  description: string;
  status: "pending" | "running" | "done" | "error";
  files?: string[];
  startedAt?: number;
  endedAt?: number;
  tokens_in?: number;
  tokens_out?: number;
}

export type AccentColor = "violet" | "blue" | "cyan" | "emerald" | "rose" | "amber";
export type Density = "compact" | "default" | "relaxed";

export interface ProviderStatus {
  provider: ModelProvider;
  ok: boolean;
  latencyMs: number;
  message?: string;
}
