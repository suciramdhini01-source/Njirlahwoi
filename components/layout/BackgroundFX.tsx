"use client";
import { motion } from "framer-motion";

export function BackgroundFX() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Floating neon orbs */}
      <motion.div
        className="absolute top-[-25%] left-[-10%] h-[65vh] w-[65vh] rounded-full blur-[140px]"
        style={{ background: "#A855F7", opacity: 0.35 }}
        animate={{ x: [0, 60, -20, 0], y: [0, 30, -10, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[15%] right-[-15%] h-[60vh] w-[60vh] rounded-full blur-[140px]"
        style={{ background: "#06B6D4", opacity: 0.28 }}
        animate={{ x: [0, -40, 20, 0], y: [0, 40, -20, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-25%] left-[25%] h-[55vh] w-[55vh] rounded-full blur-[140px]"
        style={{ background: "#EC4899", opacity: 0.25 }}
        animate={{ x: [0, 50, -30, 0], y: [0, -40, 20, 0], scale: [1, 1.05, 0.95, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[40%] left-[40%] h-[40vh] w-[40vh] rounded-full blur-[120px]"
        style={{ background: "#A855F7", opacity: 0.15 }}
        animate={{ x: [0, -30, 40, 0], y: [0, 30, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Animated grid */}
      <div
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(168,85,247,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Moving scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px opacity-40"
        style={{
          background: "linear-gradient(90deg, transparent, #A855F7, #06B6D4, #EC4899, transparent)",
        }}
        initial={{ top: "-2%" }}
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Corner vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
        }}
      />
    </div>
  );
}
