'use client';

import { useEffect, useRef, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';

interface TrailDot { x: number; y: number; id: number; }

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [trail, setTrail] = useState<TrailDot[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const trailIdRef = useRef(0);
  const velRef = useRef({ vx: 0, vy: 0, prevX: 0, prevY: 0 });

  const [spring, api] = useSpring(() => ({
    x: -100, y: -100, scale: 1,
    config: { mass: 1, tension: 220, friction: 22 },
  }));

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const { prevX, prevY } = velRef.current;
      const vx = e.clientX - prevX;
      const vy = e.clientY - prevY;
      velRef.current = { vx, vy, prevX: e.clientX, prevY: e.clientY };
      setPos({ x: e.clientX, y: e.clientY });
      api.start({ x: e.clientX, y: e.clientY });
      const speed = Math.sqrt(vx * vx + vy * vy);
      const count = Math.max(1, Math.min(Math.floor(speed / 3), 4));
      for (let i = 0; i < count; i++) {
        const id = trailIdRef.current++;
        setTrail((prev) => [...prev.slice(-28), { x: e.clientX, y: e.clientY, id }]);
      }
    };
    const handleDown = () => { setIsClicking(true); api.start({ scale: 0.7 }); };
    const handleUp = () => { setIsClicking(false); api.start({ scale: 1 }); };
    const handleOver = (e: MouseEvent) => {
      const interactive = (e.target as HTMLElement).closest('button, a, input, textarea, [role="button"], select');
      setIsHovering(!!interactive);
      api.start({ scale: interactive ? 1.8 : 1 });
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('mouseover', handleOver);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('mouseover', handleOver);
    };
  }, [api]);

  const TRAIL_COLORS = ['#5AC8FA', '#34C759', '#A9D171', '#FF9500', '#FF3B30'];

  return (
    <>
      <style>{`* { cursor: none !important; }`}</style>
      {trail.map((dot) => {
        const age = trail.length - 1 - trail.findIndex((d) => d.id === dot.id);
        const opacity = Math.max(0, 1 - age / 28);
        const size = Math.max(2, 10 - age * 0.35);
        const color = TRAIL_COLORS[dot.id % TRAIL_COLORS.length];
        return (
          <div
            key={dot.id}
            className="fixed pointer-events-none z-[9998] rounded-full"
            style={{
              left: dot.x - size / 2, top: dot.y - size / 2,
              width: size, height: size,
              background: color,
              opacity: opacity * 0.55,
              filter: `blur(${age * 0.25}px)`,
              transition: 'none',
            }}
          />
        );
      })}
      <div
        className="fixed pointer-events-none z-[9999] rounded-full"
        style={{
          left: pos.x - 4, top: pos.y - 4, width: 8, height: 8,
          background: isHovering ? '#34C759' : '#ffffff',
          boxShadow: `0 0 ${isHovering ? 12 : 5}px ${isHovering ? '#34C75980' : '#ffffff80'}`,
          transition: 'background 0.15s, box-shadow 0.15s',
        }}
      />
      <animated.div
        className="fixed pointer-events-none z-[9998] rounded-full border-2"
        style={{
          width: 28, height: 28, marginLeft: -14, marginTop: -14,
          borderColor: isHovering ? '#34C759' : isClicking ? '#FF3B30' : '#5AC8FA',
          boxShadow: `0 0 10px ${isHovering ? '#34C75950' : '#5AC8FA50'}`,
          x: spring.x, y: spring.y, scale: spring.scale,
        }}
      />
    </>
  );
}
