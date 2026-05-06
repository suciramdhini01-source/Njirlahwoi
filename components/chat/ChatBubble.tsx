"use client";
import { motion } from "framer-motion";
import { User, Sparkles } from "lucide-react";
import { ChatMessage } from "@/types";

export function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`relative h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
          isUser
            ? "bg-neon-pink/20 text-neon-pink border border-neon-pink/30"
            : "bg-gradient-to-br from-neon-purple to-neon-cyan text-white"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        {!isUser && (
          <motion.div
            className="absolute inset-0 rounded-xl"
            animate={{ boxShadow: ["0 0 0px rgba(168,85,247,0.0)", "0 0 20px rgba(168,85,247,0.7)", "0 0 0px rgba(168,85,247,0.0)"] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          />
        )}
      </div>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? "bg-neon-pink/10 border border-neon-pink/25 text-white"
            : "glass text-gray-100"
        }`}
      >
        {msg.content || (
          <span className="inline-flex gap-1 py-1">
            <Dot d={0} />
            <Dot d={0.15} />
            <Dot d={0.3} />
          </span>
        )}
      </div>
    </motion.div>
  );
}

function Dot({ d }: { d: number }) {
  return (
    <motion.span
      className="inline-block h-1.5 w-1.5 rounded-full bg-neon-cyan"
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 0.9, repeat: Infinity, delay: d }}
    />
  );
}
