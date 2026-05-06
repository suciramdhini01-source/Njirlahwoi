"use client";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

const DOTS = [
  { size: 14, opacity: 0.55, stiffness: 340, damping: 28 },
  { size: 10, opacity: 0.4, stiffness: 260, damping: 26 },
  { size: 8, opacity: 0.3, stiffness: 190, damping: 24 },
  { size: 6, opacity: 0.22, stiffness: 140, damping: 22 },
];

export function CursorTrail() {
  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  return (
    <>
      {DOTS.map((d, i) => (
        <TrailDot key={i} mx={mx} my={my} {...d} />
      ))}
    </>
  );
}

function TrailDot({
  mx,
  my,
  size,
  opacity,
  stiffness,
  damping,
}: {
  mx: any;
  my: any;
  size: number;
  opacity: number;
  stiffness: number;
  damping: number;
}) {
  const sx = useSpring(mx, { stiffness, damping, mass: 0.5 });
  const sy = useSpring(my, { stiffness, damping, mass: 0.5 });
  return (
    <motion.div
      className="pointer-events-none fixed z-[9999] rounded-full"
      style={{
        left: sx,
        top: sy,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        background: `rgba(var(--accent-a), ${opacity})`,
        filter: "blur(0.5px)",
        boxShadow: `0 0 18px rgba(var(--accent-a), ${opacity})`,
      }}
    />
  );
}
