"use client";
import { useEffect, useRef } from "react";

export function MatrixRain({ opacity = 0.35 }: { opacity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const fontSize = 14;
    let columns = 0;
    let drops: number[] = [];
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789()[]{}<>=+*!?/\\|$#@&";

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columns = Math.floor(width / fontSize);
      drops = new Array(columns).fill(0).map(() => Math.random() * -50);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = 0;
    const step = (t: number) => {
      if (t - last < 70) {
        raf = requestAnimationFrame(step);
        return;
      }
      last = t;

      ctx.fillStyle = "rgba(4, 7, 6, 0.12)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
      for (let i = 0; i < columns; i++) {
        const ch = chars.charAt(Math.floor(Math.random() * chars.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const fade = Math.min(1, drops[i] / 8);
        ctx.fillStyle = `rgba(24, 196, 147, ${0.35 + 0.45 * fade})`;
        if (Math.random() > 0.985) {
          ctx.fillStyle = "rgba(200, 255, 230, 0.95)";
        }
        ctx.fillText(ch, x, y);

        if (y > height && Math.random() > 0.972) drops[i] = 0;
        drops[i] += 1;
      }

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" style={{ opacity }}>
      <canvas ref={ref} className="absolute inset-0 w-full h-full" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(6,10,8,0.75) 0%, rgba(4,7,6,0.92) 100%)",
        }}
      />
    </div>
  );
}
