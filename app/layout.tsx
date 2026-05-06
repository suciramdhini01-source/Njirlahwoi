import "./globals.css";
import type { Metadata } from "next";
import { Inter, Space_Grotesk, Orbitron, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "NJIRLAH AI — Chat AI Tersesat",
  description:
    "Platform chat multi-model AI. Built-in Replit (OpenAI/Anthropic/Gemini), Cloudflare Workers AI, OpenRouter BYOK. Dibuat oleh Andikaa Saputraa.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${spaceGrotesk.variable} ${orbitron.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen font-sans text-white antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
