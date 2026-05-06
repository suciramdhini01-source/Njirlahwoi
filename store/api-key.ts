"use client";
import { create } from "zustand";
import { decrypt, encrypt } from "@/lib/encryption";

const LS_OR = "nj_or_key_v1";
const LS_CF_TOKEN = "nj_cf_token_v1";
const LS_CF_ACC = "nj_cf_acc_v1";
const LS_GH = "nj_gh_pat_v1";

interface ApiKeyState {
  openrouterKey: string;
  cloudflareToken: string;
  cloudflareAccountId: string;
  githubToken: string;
  hydrated: boolean;
  setOpenrouterKey: (k: string) => Promise<void>;
  setCloudflare: (token: string, accountId: string) => Promise<void>;
  setGithubToken: (k: string) => Promise<void>;
  clearKey: (which: "openrouter" | "cloudflare" | "github") => void;
  hydrate: () => Promise<void>;
  testOpenrouter: () => Promise<boolean>;
  testCloudflare: () => Promise<boolean>;
}

export const useApiKeyStore = create<ApiKeyState>((set, get) => ({
  openrouterKey: "",
  cloudflareToken: "",
  cloudflareAccountId: "",
  githubToken: "",
  hydrated: false,

  hydrate: async () => {
    if (typeof window === "undefined") return;
    const or = localStorage.getItem(LS_OR) || "";
    const cft = localStorage.getItem(LS_CF_TOKEN) || "";
    const cfa = localStorage.getItem(LS_CF_ACC) || "";
    const gh = localStorage.getItem(LS_GH) || "";
    const [openrouterKey, cloudflareToken, cloudflareAccountId, githubToken] = await Promise.all([
      or ? decrypt(or) : "",
      cft ? decrypt(cft) : "",
      cfa ? decrypt(cfa) : "",
      gh ? decrypt(gh) : "",
    ]);
    set({ openrouterKey, cloudflareToken, cloudflareAccountId, githubToken, hydrated: true });
  },

  setGithubToken: async (k) => {
    const cipher = k ? await encrypt(k) : "";
    if (cipher) localStorage.setItem(LS_GH, cipher);
    else localStorage.removeItem(LS_GH);
    set({ githubToken: k });
  },

  setOpenrouterKey: async (k) => {
    const cipher = k ? await encrypt(k) : "";
    if (cipher) localStorage.setItem(LS_OR, cipher);
    else localStorage.removeItem(LS_OR);
    set({ openrouterKey: k });
  },

  setCloudflare: async (token, accountId) => {
    const [ct, ca] = await Promise.all([
      token ? encrypt(token) : "",
      accountId ? encrypt(accountId) : "",
    ]);
    if (ct) localStorage.setItem(LS_CF_TOKEN, ct);
    else localStorage.removeItem(LS_CF_TOKEN);
    if (ca) localStorage.setItem(LS_CF_ACC, ca);
    else localStorage.removeItem(LS_CF_ACC);
    set({ cloudflareToken: token, cloudflareAccountId: accountId });
  },

  clearKey: (which) => {
    if (which === "openrouter") {
      localStorage.removeItem(LS_OR);
      set({ openrouterKey: "" });
    } else if (which === "github") {
      localStorage.removeItem(LS_GH);
      set({ githubToken: "" });
    } else {
      localStorage.removeItem(LS_CF_TOKEN);
      localStorage.removeItem(LS_CF_ACC);
      set({ cloudflareToken: "", cloudflareAccountId: "" });
    }
  },

  testOpenrouter: async () => {
    const { openrouterKey } = get();
    if (!openrouterKey) return false;
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${openrouterKey}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  testCloudflare: async () => {
    const { cloudflareToken, cloudflareAccountId } = get();
    if (!cloudflareToken || !cloudflareAccountId) return false;
    try {
      const res = await fetch("/api/cloudflare/models", {
        method: "POST",
        headers: {
          "x-cf-token": cloudflareToken,
          "x-cf-account-id": cloudflareAccountId,
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  },
}));
