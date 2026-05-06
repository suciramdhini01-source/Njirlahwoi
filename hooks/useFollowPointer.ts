'use client';

import { useEffect, useRef } from 'react';
import { useSpring } from '@react-spring/web';

export function useFollowPointer() {
  const ref = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [springs, api] = useSpring(() => ({
    x: 0,
    y: 0,
    config: { mass: 1, tension: 180, friction: 22 },
  }));

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      ref.current = { x: e.clientX, y: e.clientY };
      api.start({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [api]);

  return { springs };
}

export function useCursorTrail() {
  const [springs, api] = useSpring(() => ({
    x: 0,
    y: 0,
    config: { mass: 1, tension: 120, friction: 18 },
  }));

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      api.start({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [api]);

  return springs;
}
