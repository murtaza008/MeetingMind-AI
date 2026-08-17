"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { ease } from "@/components/motion/reveal";

const OPTIONS = [
  { id: "light" as const, icon: Sun, label: "Light" },
  { id: "dark" as const, icon: Moon, label: "Dark" },
  { id: "system" as const, icon: Monitor, label: "System" },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div
      className={cn(
        "relative flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5",
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const active = mounted && theme === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setTheme(option.id)}
            aria-label={`${option.label} theme`}
            className={cn(
              "relative flex h-6 flex-1 items-center justify-center rounded-[3px] transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="theme-toggle-pill"
                className="absolute inset-0 -z-10 rounded-[3px] bg-surface-raised shadow-panel"
                transition={{ duration: 0.28, ease }}
              />
            )}
            <option.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        );
      })}
    </div>
  );
}
