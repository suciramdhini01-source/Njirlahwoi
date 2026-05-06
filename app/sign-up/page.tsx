"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirm) {
      toast.error("Lengkapi semua field");
      return;
    }
    if (password !== confirm) {
      toast.error("Password tidak cocok");
      return;
    }
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <CheckCircle2 className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Cek Email Anda!</h2>
          <p className="text-gray-400 mb-6">
            Kami telah mengirimkan link konfirmasi ke <span className="text-cyan-400">{email}</span>. Klik link tersebut untuk mengaktifkan akun Anda.
          </p>
          <Link href="/sign-in">
            <Button className="bg-gradient-to-r from-cyan-600 to-blue-600">
              Ke halaman Sign In
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text inline-block cursor-pointer hover:opacity-80 transition">
              NJIRLAH
            </h1>
          </Link>
          <p className="text-gray-400 mt-2">Buat akun gratis Anda</p>
        </div>

        <Card className="bg-white/5 border-white/10 p-8">
          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Email</label>
              <Input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-cyan-500"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">Password</label>
              <Input
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-cyan-500"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">Konfirmasi Password</label>
              <Input
                type="password"
                placeholder="Ulangi password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-cyan-500"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" /> Memproses...
                </>
              ) : (
                "Buat Akun"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Sudah punya akun?{" "}
            <Link href="/sign-in" className="text-cyan-400 hover:text-cyan-300 transition">
              Masuk di sini
            </Link>
          </div>
        </Card>

        <p className="text-center text-xs text-gray-600 mt-6">
          Dengan mendaftar, Anda menyetujui syarat dan ketentuan NJIRLAH.
        </p>
      </motion.div>
    </div>
  );
}
