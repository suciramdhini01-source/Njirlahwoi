'use client';

import { motion } from 'framer-motion';

export default function LoadingCube() {
  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-[#05050A]">
      <div className="perspective-[600px] w-20 h-20 mb-8">
        <motion.div
          className="relative w-20 h-20"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateX: 360, rotateY: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          {[
            { transform: 'translateZ(40px)', bg: 'rgba(168,85,247,0.3)', border: '#A855F7' },
            { transform: 'translateZ(-40px) rotateY(180deg)', bg: 'rgba(6,182,212,0.3)', border: '#06B6D4' },
            { transform: 'rotateY(90deg) translateZ(40px)', bg: 'rgba(236,72,153,0.3)', border: '#EC4899' },
            { transform: 'rotateY(-90deg) translateZ(40px)', bg: 'rgba(168,85,247,0.3)', border: '#A855F7' },
            { transform: 'rotateX(90deg) translateZ(40px)', bg: 'rgba(6,182,212,0.3)', border: '#06B6D4' },
            { transform: 'rotateX(-90deg) translateZ(40px)', bg: 'rgba(236,72,153,0.3)', border: '#EC4899' },
          ].map((face, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-lg border"
              style={{
                transform: face.transform,
                background: face.bg,
                borderColor: face.border,
                boxShadow: `0 0 20px ${face.border}60`,
              }}
            />
          ))}
        </motion.div>
      </div>
      <motion.p
        className="text-sm text-gray-500 font-heading"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Loading NJIRLAH AI...
      </motion.p>
    </div>
  );
}
