"use client";
import { motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mt-auto border-t border-white/[0.06] bg-[#050908]/80 backdrop-blur-xl py-8 text-center overflow-hidden">
      <motion.div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(24,196,147,0.8), rgba(159,243,211,0.9), rgba(24,196,147,0.8), transparent)",
          backgroundSize: "200% 100%",
        }}
        animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="absolute left-[10%] top-4 text-[#18C493]/60"
        animate={{
          x: [0, 120, 240, 360, 0],
          y: [0, -8, 0, -8, 0],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      >
        <Sparkles className="h-3 w-3" />
      </motion.div>

      <p className="text-lg font-bold text-[#18C493] flex items-center justify-center gap-2 relative z-10">
        Dibuat dengan
        <Heart className="h-5 w-5 text-red-500 fill-red-500 animate-heart" />
        oleh{" "}
        <span className="underline decoration-[#18C493] underline-offset-4 decoration-2 text-white">
          Andikaa Saputraa
        </span>
      </p>
      <p className="text-sm text-gray-400 mt-1.5 relative z-10">
        Membangun masa depan AI yang bebas, tanpa batas, ala kadarnya tapi njir lah keren.
      </p>
      <p className="text-xs text-gray-500 mt-2.5 relative z-10 tracking-wider">
        © {new Date().getFullYear()} NJIRLAH AI
      </p>
    </footer>
  );
}
