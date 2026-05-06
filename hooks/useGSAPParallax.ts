'use client';

import { useEffect, useRef } from 'react';

export function useGSAPParallax(selector: string, strength = 0.15) {
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    (async () => {
      try {
        const gsap = (await import('gsap')).gsap;
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);

        const els = document.querySelectorAll<HTMLElement>(selector);
        const triggers: ReturnType<typeof ScrollTrigger.create>[] = [];

        els.forEach((el) => {
          const trig = ScrollTrigger.create({
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            onUpdate: (self) => {
              const progress = self.progress;
              gsap.set(el, { y: (progress - 0.5) * 100 * strength, force3D: true });
            },
          });
          triggers.push(trig);
        });

        cleanup = () => {
          triggers.forEach((t) => t.kill());
          ScrollTrigger.refresh();
        };
      } catch {}
    })();
    return () => cleanup?.();
  }, [selector, strength]);
}

export function useGSAPScrollZoom(selector: string) {
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    (async () => {
      try {
        const gsap = (await import('gsap')).gsap;
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);

        const el = document.querySelector<HTMLElement>(selector);
        if (!el) return;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5,
          },
        });
        tl.to(el, { scale: 1.18, opacity: 0.4, y: 30, ease: 'none' });

        cleanup = () => { tl.kill(); ScrollTrigger.refresh(); };
      } catch {}
    })();
    return () => cleanup?.();
  }, [selector]);
}
