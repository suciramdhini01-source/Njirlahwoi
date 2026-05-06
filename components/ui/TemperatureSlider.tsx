'use client';

import { useRef, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thermometer } from 'lucide-react';

interface TemperatureSliderProps {
  value?: number;
  onChange: (v: number) => void;
}

const MIN = 0;
const MAX = 2;
const TRACK_WIDTH = 160;
const DEFAULT_TEMP = 0.7;

function getColor(v: number) {
  if (v < 0.5) return '#06B6D4';
  if (v < 1.0) return '#A855F7';
  if (v < 1.5) return '#EC4899';
  return '#EF4444';
}

function getLabel(v: number) {
  if (v < 0.3) return 'Presisi';
  if (v < 0.7) return 'Seimbang';
  if (v < 1.2) return 'Kreatif';
  if (v < 1.7) return 'Wild';
  return '🔥 Gila';
}

export default function TemperatureSlider({ value: valueProp, onChange }: TemperatureSliderProps) {
  const value = typeof valueProp === 'number' ? valueProp : DEFAULT_TEMP;
  const [open, setOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const pct = (value - MIN) / (MAX - MIN);
  const color = getColor(value);

  const [{ thumbX }, api] = useSpring(() => ({
    thumbX: pct * TRACK_WIDTH,
    config: { mass: 0.6, tension: 400, friction: 24 },
  }));

  const bind = useDrag(
    ({ offset: [ox], first, last }) => {
      const clamped = Math.max(0, Math.min(TRACK_WIDTH, ox));
      api.start({ thumbX: clamped, immediate: true });
      const newVal = parseFloat(((clamped / TRACK_WIDTH) * (MAX - MIN) + MIN).toFixed(2));
      onChange(newVal);
    },
    { axis: 'x', bounds: { left: 0, right: TRACK_WIDTH }, from: () => [thumbX.get(), 0] }
  );

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 glass rounded-xl px-2.5 py-2 border border-white/10 text-xs"
        style={{ color }}
      >
        <Thermometer size={12} />
        <span className="font-mono">{value.toFixed(1)}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 380 }}
            className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 glass rounded-2xl border border-white/10 p-4 shadow-2xl z-50 w-52"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">Temperature</span>
              <motion.span
                key={getLabel(value)}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-bold"
                style={{ color }}
              >
                {getLabel(value)}
              </motion.span>
            </div>

            {/* iOS-style track */}
            <div className="relative" ref={trackRef}>
              <div
                className="h-2 rounded-full relative overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.08)', width: TRACK_WIDTH }}
              >
                <animated.div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    width: thumbX,
                    background: `linear-gradient(90deg, #06B6D4, ${color})`,
                    boxShadow: `0 0 8px ${color}80`,
                  }}
                />
              </div>

              {/* Thumb */}
              <animated.div
                {...bind()}
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white/80 shadow-lg flex items-center justify-center touch-none select-none"
                style={{
                  x: thumbX,
                  marginLeft: -10,
                  background: color,
                  boxShadow: `0 0 12px ${color}80, 0 2px 8px rgba(0,0,0,0.4)`,
                  cursor: 'grab',
                }}
              />
            </div>

            {/* Tick marks */}
            <div className="flex justify-between mt-3 text-[9px] text-gray-600" style={{ width: TRACK_WIDTH }}>
              <span>0</span>
              <span>0.5</span>
              <span>1</span>
              <span>1.5</span>
              <span>2</span>
            </div>

            <p className="text-[10px] text-gray-600 mt-2 text-center">
              Seret untuk ubah kreativitas AI
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
