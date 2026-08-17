"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const BAR_COUNT = 48;
const IDLE_LEVELS = new Array(BAR_COUNT).fill(0.04);

/** Live audio-level bars driven by an AnalyserNode. Falls back to a flat line when idle. */
export function Waveform({
  analyser,
  active,
  className,
}: {
  analyser: AnalyserNode | null;
  active: boolean;
  className?: string;
}) {
  const [levels, setLevels] = useState<number[]>(IDLE_LEVELS);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!analyser || !active) {
      if (frame.current) cancelAnimationFrame(frame.current);
      return;
    }
    const buffer = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        const v = (buffer[i]! - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buffer.length);
      const level = Math.min(1, Math.max(0.04, rms * 3.2));
      setLevels((prev) => [...prev.slice(1), level]);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [analyser, active]);

  const displayLevels = active ? levels : IDLE_LEVELS;

  return (
    <div className={cn("flex h-20 items-center justify-center gap-[3px]", className)} aria-hidden>
      {displayLevels.map((l, i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] rounded-full transition-[height] duration-75",
            active ? "bg-primary" : "bg-border-strong",
          )}
          style={{ height: `${Math.round(l * 100)}%`, minHeight: 3 }}
        />
      ))}
    </div>
  );
}
