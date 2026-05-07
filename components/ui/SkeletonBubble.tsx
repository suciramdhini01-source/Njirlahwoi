'use client';

import { motion } from 'framer-motion';

export default function SkeletonBubble() {
  return (
    <div className="flex items-start gap-3 px-4 py-2">
      {/* Avatar skeleton */}
      <div className="w-8 h-8 rounded-full bg-[#1C1C26] skeleton flex-shrink-0" />
      {/* Lines */}
      <div className="flex flex-col gap-2 flex-1 max-w-sm pt-1">
        <div className="h-3 rounded-full bg-[#1C1C26] skeleton" style={{ width: '72%' }} />
        <div className="h-3 rounded-full bg-[#1C1C26] skeleton" style={{ width: '55%' }} />
        <div className="h-3 rounded-full bg-[#1C1C26] skeleton" style={{ width: '65%' }} />
      </div>
    </div>
  );
}
