'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';

export default function UnicornBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const [glowSpring, glowApi] = useSpring(() => ({
    x: -200, y: -200,
    config: { mass: 3, tension: 80, friction: 40 },
  }));

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      glowApi.start({ x: e.clientX - 150, y: e.clientY - 150 });
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, [glowApi]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const COLORS = ['#FF3B30', '#34C759', '#5AC8FA', '#A9D171', '#FF9500', '#A855F7'];
    const count = 55;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.6 + 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random(),
      alphaD: Math.random() > 0.5 ? 0.003 : -0.003,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.alpha += p.alphaD;
        if (p.alpha <= 0 || p.alpha >= 1) p.alphaD *= -1;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * 0.5;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = ((100 - d) / 100) * 0.09;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: 0.45 }} />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          background: [
            'radial-gradient(ellipse at 15% 40%, rgba(255,59,48,0.05) 0%, transparent 50%)',
            'radial-gradient(ellipse at 85% 20%, rgba(90,200,250,0.05) 0%, transparent 50%)',
            'radial-gradient(ellipse at 50% 85%, rgba(52,199,89,0.04) 0%, transparent 50%)',
          ].join(', '),
        }} />
        <animated.div
          className="absolute w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{
            x: glowSpring.x, y: glowSpring.y,
            background: 'radial-gradient(circle, rgba(90,200,250,0.1) 0%, transparent 70%)',
            filter: 'blur(28px)',
          }}
        />
        <motion.div
          className="absolute top-1/4 left-1/5 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(52,199,89,0.05) 0%, transparent 70%)', filter: 'blur(50px)' }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/5 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,149,0,0.05) 0%, transparent 70%)', filter: 'blur(50px)' }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.7, 0.4, 0.7] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-2/3 left-1/3 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(169,209,113,0.04) 0%, transparent 70%)', filter: 'blur(60px)' }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>
    </>
  );
}
