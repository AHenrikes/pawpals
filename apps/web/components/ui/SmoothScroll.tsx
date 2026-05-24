"use client";
import { gsap } from "gsap";
import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

interface SmoothScrollProps {
  contentSelector?: string;
  wrapperSelector?: string;
  smoothAmount?: number;
  enableEffects?: boolean;
}

export function SmoothScroll({
  contentSelector = "smooth-content",
  wrapperSelector = "smooth-wrapper",
  smoothAmount = 1,
  enableEffects = true,
}: SmoothScrollProps = {}): null {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

    const smoother = ScrollSmoother.create({
      content: `#${contentSelector}`,
      wrapper: `#${wrapperSelector}`,
      smooth: smoothAmount,
      effects: enableEffects,
    });

    return () => {
      if (smoother) {
        try {
          smoother.kill();
        } catch {}
      }
    };
  }, [contentSelector, wrapperSelector, smoothAmount, enableEffects]);

  return null;
}
