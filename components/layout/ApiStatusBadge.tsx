"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

type StatusMap = Record<string, { ok: boolean; latencyMs: number; configured: boolean }>;

export function ApiStatusBadge({ collapsed }: { collapsed?: boolean }) {
  const [status, setStatus] = useState<StatusMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchIt = async () => {
      try {
        const r = await fetch("/api/status");
        const j = (await r.json()) as StatusMap;
        if (!cancelled) setStatus(j);
      } catch {
        if (!cancelled) setStatus(null);
      }
    };
    fetchIt();
    const t = setInterval(fetchIt, 30000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const providers = status ? Object.keys(status) : [];
  const onlineCount = providers.filter((p) => status?.[p].ok && status[p].configured).length;
  const total = providers.length || 5;

  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      className={`glass rounded-lg flex items-center gap-1.5 text-[11px] ${collapsed ? "p-1.5 justify-center" : "px-2.5 py-1"}`}
      title={
        status
          ? providers
              .map(
                (p) =>
                  `${p}: ${status[p].configured ? (status[p].ok ? "ok" : "err") : "off"}`
              )
              .join(" · ")
          : "menunggu..."
      }
    >
      <Activity className="h-3 w-3 text-accent-a" />
      {!collapsed && (
        <span className="text-white/70">
          {onlineCount}/{total} online
        </span>
      )}
      <motion.span
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
        className={`h-1.5 w-1.5 rounded-full ${
          onlineCount > 0 ? "bg-emerald-400" : "bg-red-400"
        }`}
      />
    </motion.div>
  );
}
