"use client";

import { animate, motion, useInView } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export const ease = [0.16, 1, 0.3, 1] as const;

/** Scroll-triggered fade/rise-in that re-plays every time it re-enters the viewport. */
export function Reveal({
  children,
  delay = 0,
  y = 14,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.32, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Stagger-in props for a child element at index `i` within a group (mount-triggered). */
export function stagger(i: number, step = 0.06) {
  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.04 + i * step, duration: 0.3, ease },
  };
}

/** Parent for a staggered group. Pair with `StaggerItem`. Replays on every viewport re-entry. */
export function Stagger({
  children,
  className,
  step = 0.06,
  once = false,
}: {
  children: ReactNode;
  className?: string;
  step?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: step, delayChildren: 0.04 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  y = 12,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.3, ease } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animates a number from 0 to `value` whenever it scrolls into view — and
 * resets/replays every time, so a stat you scroll past twice counts up twice.
 */
export function CountUp({
  value,
  format = (n: number) => Math.round(n).toLocaleString("en-US"),
  duration = 0.9,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: false, margin: "-80px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease,
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {format(display)}
    </span>
  );
}
