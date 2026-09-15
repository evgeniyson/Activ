"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { CurrencyCode } from "@/lib/currency";
import { formatMoney } from "@/lib/format";

/** Counts up from 0 to `value` when scrolled into view. Respects reduced-motion. */
export function AnimatedNumber({ value, format, className, duration = 0.9 }: { value: number; format: (v: number) => string; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => setCurrent(v),
    });
    return () => controls.stop();
  }, [inView, value, reduce, duration]);

  const shown = reduce ? value : current;
  return (
    <span ref={ref} className={cn("tnum", className)}>
      {format(shown)}
    </span>
  );
}

/** Serializable wrapper so Server Components can request an animated money value. */
export function AnimatedMoney({ amount, currency, signed, decimals, className }: { amount: number; currency: CurrencyCode; signed?: boolean; decimals?: number; className?: string }) {
  return <AnimatedNumber value={amount} format={(v) => formatMoney(v, currency, { signed, decimals })} className={className} />;
}
