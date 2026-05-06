"use client";
import { create } from "zustand";
import { AccentColor, Density } from "@/types";
import { supabase, getSessionId } from "@/lib/supabase";

const LS_KEY = "nj_appearance_v1";

interface State {
  accent: AccentColor;
  density: Density;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setAccent: (a: AccentColor) => void;
  setDensity: (d: Density) => void;
}

function loadLocal(): Pick<State, "accent" | "density"> {
  if (typeof window === "undefined") return { accent: "violet", density: "default" };
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "") || {
      accent: "violet",
      density: "default",
    };
  } catch {
    return { accent: "violet", density: "default" };
  }
}

function saveLocal(s: { accent: AccentColor; density: Density }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}

async function syncSupabase(accent: AccentColor, density: Density) {
  try {
    const sid = getSessionId();
    await supabase.from("nj_preferences").upsert({
      session_id: sid,
      accent,
      density,
      updated_at: new Date().toISOString(),
    });
  } catch {
    /* ignore */
  }
}

export const useAppearanceStore = create<State>((set, get) => ({
  accent: "violet",
  density: "default",
  hydrated: false,
  hydrate: async () => {
    const local = loadLocal();
    set({ ...local, hydrated: true });
    applyCssVars(local.accent, local.density);
    try {
      const sid = getSessionId();
      const { data } = await supabase
        .from("nj_preferences")
        .select("accent,density")
        .eq("session_id", sid)
        .maybeSingle();
      if (data) {
        set({ accent: data.accent as AccentColor, density: data.density as Density });
        saveLocal({ accent: data.accent as AccentColor, density: data.density as Density });
        applyCssVars(data.accent as AccentColor, data.density as Density);
      }
    } catch {
      /* ignore */
    }
  },
  setAccent: (accent) => {
    const s = { accent, density: get().density };
    set({ accent });
    saveLocal(s);
    applyCssVars(s.accent, s.density);
    void syncSupabase(s.accent, s.density);
  },
  setDensity: (density) => {
    const s = { accent: get().accent, density };
    set({ density });
    saveLocal(s);
    applyCssVars(s.accent, s.density);
    void syncSupabase(s.accent, s.density);
  },
}));

const ACCENTS: Record<AccentColor, { a: string; b: string }> = {
  violet: { a: "124, 58, 237", b: "158, 158, 255" },
  blue: { a: "37, 99, 235", b: "96, 165, 250" },
  cyan: { a: "6, 182, 212", b: "141, 240, 204" },
  emerald: { a: "16, 185, 129", b: "110, 231, 183" },
  rose: { a: "244, 63, 94", b: "251, 113, 133" },
  amber: { a: "245, 158, 11", b: "251, 191, 36" },
};

function applyCssVars(accent: AccentColor, density: Density) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const a = ACCENTS[accent];
  root.style.setProperty("--accent-a", a.a);
  root.style.setProperty("--accent-b", a.b);
  const dens = density === "compact" ? "0.85" : density === "relaxed" ? "1.15" : "1";
  root.style.setProperty("--density", dens);
}
