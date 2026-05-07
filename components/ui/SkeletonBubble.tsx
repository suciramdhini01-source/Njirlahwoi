  'use client';

import { motion } from 'framer-motion';

function ShimmerLine({ width }: { width: string }) {
  return (
    <div className="relative overflow-hidden rounded-full" style={{ width, height: 10 }}>
      <div className="absolute inset-0 bg-white/5 rounded-full" />
      <motion.div
        className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full"
        animate={{ x: ['-100%', '300%'] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

export default function SkeletonBubble() {
  return (
    <div className="flex items-start gap-3 px-4 py-2">
      {/* Avatar skeleton */}
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ['-100%', '300%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
          />
        </div>
      </div>

      {/* Lines */}
      <div className="flex flex-col gap-2.5 pt-1 max-w-xs">
        <ShimmerLine width="240px" />
        <ShimmerLine width="180px" />
        <ShimmerLine width="210px" />
        <ShimmerLine width="140px" />
      </div>
    </div>
  );
}
