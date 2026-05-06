export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  tokenUsage?: { prompt: number; completion: number };
}

export interface Chat {
  id: string;
  modelSource: "openrouter" | "cloudflare";
  modelId: string;
  messages: Message[];
  createdAt: number;
}
