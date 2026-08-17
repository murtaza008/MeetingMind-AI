"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Processing happens synchronously inside one request (no background job),
// so there is no real per-step server status to poll. This stepper is a
// cosmetic, elapsed-time-driven approximation of what the single Gemini
// call is doing, purely to keep the upload wait from feeling frozen.
export const PIPELINE_STEPS = [
  "Uploading audio",
  "Transcribing & identifying speakers",
  "Extracting decisions & action items",
  "Saving results",
] as const;

const STEP_DURATIONS_MS = [1200, 9000, 9000, Infinity];

export function ProcessingSteps({ failed, className }: { failed?: boolean; className?: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (failed) return;
    let cancelled = false;
    let index = 0;
    function schedule() {
      const delay = STEP_DURATIONS_MS[index];
      if (!Number.isFinite(delay)) return;
      const timer = setTimeout(() => {
        if (cancelled) return;
        index += 1;
        setActiveIndex(index);
        schedule();
      }, delay);
      return () => clearTimeout(timer);
    }
    const cleanup = schedule();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [failed]);

  return (
    <ol className={cn("space-y-2.5", className)}>
      {PIPELINE_STEPS.map((step, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex && !failed;
        return (
          <li key={step} className="flex items-center gap-2.5 text-sm">
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border",
                done && "border-success/40 bg-success/12 text-success",
                active && "border-primary/40 bg-primary/10 text-primary",
                !done && !active && "border-border text-muted-foreground",
              )}
            >
              {done ? (
                <Check className="size-3" strokeWidth={2.5} />
              ) : active ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <span className="size-1 rounded-full bg-current" />
              )}
            </span>
            <span className={cn(done || active ? "text-foreground" : "text-muted-foreground")}>
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
