"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Github, Loader2, ExternalLink, X, CheckCircle2 } from "lucide-react";
import { useApiKeyStore } from "@/store/api-key";
import { AgentFile } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  files: AgentFile[];
}

export function GitHubPushDialog({ open, onClose, files }: Props) {
  const githubToken = useApiKeyStore((s) => s.githubToken);
  const setGithubToken = useApiKeyStore((s) => s.setGithubToken);

  const [token, setToken] = useState(githubToken);
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [message, setMessage] = useState("chore: sync from NJIRLAH AI");
  const [privateRepo, setPrivateRepo] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ url: string; commit: string } | null>(null);

  const push = async () => {
    setErr(null);
    setDone(null);
    if (!token || !repo) {
      setErr("PAT dan nama repo wajib diisi");
      return;
    }
    setBusy(true);
    try {
      if (token !== githubToken) await setGithubToken(token);
      const res = await fetch("/api/github/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-github-token": token,
        },
        body: JSON.stringify({
          repo,
          branch,
          commitMessage: message,
          createIfMissing: true,
          privateRepo,
          files: files.map((f) => ({ path: f.path, content: f.content })),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `push failed: ${res.status}`);
      setDone({ url: j.url, commit: j.commit });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl glass-strong border border-white/10 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Github className="h-5 w-5 text-white" />
                <h3 className="text-base font-semibold">Push to GitHub</h3>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {done ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <p className="text-emerald-300 font-medium">Push berhasil</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      commit {done.commit.slice(0, 7)}
                    </p>
                  </div>
                </div>
                <a
                  href={done.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm"
                >
                  Buka di GitHub
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={onClose}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 text-sm"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Personal Access Token (BYOK)
                  </label>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-neon-cyan"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Butuh scope <code>repo</code>. Token hanya dipakai sekali lalu
                    disimpan terenkripsi di browser Anda.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Repository</label>
                    <input
                      value={repo}
                      onChange={(e) => setRepo(e.target.value)}
                      placeholder="nama-repo"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Branch</label>
                    <input
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Commit Message</label>
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privateRepo}
                    onChange={(e) => setPrivateRepo(e.target.checked)}
                  />
                  Buat sebagai repo privat jika belum ada
                </label>

                {err && (
                  <div className="text-xs text-red-300 p-2 rounded-lg bg-red-500/10 border border-red-500/30 font-mono">
                    {err}
                  </div>
                )}

                <button
                  onClick={push}
                  disabled={busy || !token || !repo}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-medium disabled:opacity-40"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Mendorong {files.length} file...
                    </>
                  ) : (
                    <>
                      <Github className="h-4 w-4" />
                      Push {files.length} file
                    </>
                  )}
                </button>
                <p className="text-[10px] text-gray-500 text-center">
                  Endpoint proxy tidak menyimpan token. Semua kredensial BYOK.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
