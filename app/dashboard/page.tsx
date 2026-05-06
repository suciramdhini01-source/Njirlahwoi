"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy, Check, Trash2, Plus, Eye, EyeOff, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  last_used_at: string | null;
  created_at: string;
  rate_limit_rpm: number;
  is_revoked: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [usage, setUsage] = useState({ requests: 0, limit: 1440 });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/sign-in");
        return;
      }
      setSession(data.session);
      loadApiKeys();
      loadUsage();
    })();
  }, [router]);

  const loadApiKeys = async () => {
    // In production, fetch from api_keys table
    setApiKeys([
      {
        id: "1",
        name: "Production Key",
        prefix: "nj_live_a1b2c3d4",
        last_used_at: new Date(Date.now() - 3600000).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        rate_limit_rpm: 100,
        is_revoked: false,
      },
      {
        id: "2",
        name: "Development",
        prefix: "nj_live_x9y8z7w6",
        last_used_at: null,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        rate_limit_rpm: 10,
        is_revoked: false,
      },
    ]);
    setLoading(false);
  };

  const loadUsage = async () => {
    // In production, fetch from api_usage table
    setUsage({
      requests: 342,
      limit: 1440,
    });
  };

  const createApiKey = async () => {
    if (!keyName.trim()) {
      toast.error("Enter a key name");
      return;
    }

    setCreating(true);
    try {
      // Generate new key
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name: keyName,
        prefix: `nj_live_${Math.random().toString(36).slice(2, 10)}`,
        created_at: new Date().toISOString(),
        last_used_at: null,
        rate_limit_rpm: 10,
        is_revoked: false,
      };

      setApiKeys([newKey, ...apiKeys]);
      const newRevealed = new Set(revealedKeys);
      newRevealed.add(newKey.id);
      setRevealedKeys(newRevealed);
      setKeyName("");
      toast.success(`API key "${keyName}" created!`);
    } catch (e) {
      toast.error("Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleReveal = (id: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const revokeKey = async (id: string) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    setApiKeys(apiKeys.map((k) => (k.id === id ? { ...k, is_revoked: true } : k)));
    toast.success("API key revoked");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text cursor-pointer hover:opacity-80">
              NJIRLAH Dashboard
            </h1>
          </Link>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-3 py-1.5 text-sm border border-white/20 rounded hover:border-white/40 transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Usage Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card className="bg-white/5 border-white/10 p-6">
            <p className="text-sm text-gray-400 mb-2">Today's Requests</p>
            <p className="text-3xl font-bold text-cyan-400">{usage.requests}</p>
            <p className="text-xs text-gray-500 mt-2">of {usage.limit} daily limit</p>
          </Card>

          <Card className="bg-white/5 border-white/10 p-6">
            <p className="text-sm text-gray-400 mb-2">API Keys</p>
            <p className="text-3xl font-bold text-green-400">{apiKeys.length}</p>
            <p className="text-xs text-gray-500 mt-2">
              {apiKeys.filter((k) => !k.is_revoked).length} active
            </p>
          </Card>

          <Card className="bg-white/5 border-white/10 p-6">
            <p className="text-sm text-gray-400 mb-2">Plan</p>
            <p className="text-3xl font-bold text-purple-400">Free</p>
            <p className="text-xs text-gray-500 mt-2">
              <Link href="/pricing" className="text-cyan-400 hover:underline">
                Upgrade
              </Link>
            </p>
          </Card>
        </motion.div>

        {/* Create API Key */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/5 border-white/10 p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" /> Create New API Key
            </h3>

            <div className="flex gap-3 mb-4">
              <Input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Key name (e.g., 'Production', 'Mobile App')"
                className="bg-white/5 border-white/10 text-white placeholder-gray-600"
                onKeyPress={(e) => e.key === "Enter" && createApiKey()}
              />
              <Button
                onClick={createApiKey}
                disabled={creating || !keyName.trim()}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 whitespace-nowrap"
              >
                {creating ? "Creating..." : "Create"}
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              API keys allow your applications to access NJIRLAH API without rate limiting
            </p>
          </Card>
        </motion.div>

        {/* API Keys List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/5 border-white/10">
            <div className="border-b border-white/10 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">API Keys</h3>
            </div>

            <div className="divide-y divide-white/10">
              {apiKeys.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">No API keys yet</div>
              ) : (
                apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className={`px-6 py-4 transition ${key.is_revoked ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div>
                        <p className="font-semibold text-white flex items-center gap-2">
                          {key.name}
                          {key.is_revoked && (
                            <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-300 rounded">
                              Revoked
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          Created {new Date(key.created_at).toLocaleDateString()}
                          {key.last_used_at &&
                            ` • Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded font-mono">
                          {key.rate_limit_rpm} req/min
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center">
                      <div className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-sm flex items-center justify-between">
                        <span className={revealedKeys.has(key.id) ? "text-cyan-400" : "text-gray-500"}>
                          {revealedKeys.has(key.id)
                            ? key.prefix + "*".repeat(20)
                            : key.prefix + "•••••••••••••••••••"}
                        </span>

                        <button
                          onClick={() => toggleReveal(key.id)}
                          className="p-1 hover:bg-white/10 rounded transition text-gray-400 hover:text-white"
                        >
                          {revealedKeys.has(key.id) ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <button
                        onClick={() => copyKey(key.prefix)}
                        className="p-2 hover:bg-white/10 rounded transition text-gray-400 hover:text-white"
                      >
                        {copiedKey === key.prefix ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {!key.is_revoked && (
                        <button
                          onClick={() => revokeKey(key.id)}
                          className="p-2 hover:bg-red-500/20 rounded transition text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex gap-3"
        >
          <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-300">
            <p className="font-semibold mb-1">Keep your API keys safe</p>
            <p>Never commit API keys to version control. Use environment variables instead.</p>
          </div>
        </motion.div>

        {/* Documentation Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 mb-4">Ready to integrate?</p>
          <Link href="/docs">
            <Button className="bg-gradient-to-r from-cyan-600 to-blue-600">
              View API Documentation
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
