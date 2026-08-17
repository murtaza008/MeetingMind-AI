import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  READY: "border-border-strong bg-secondary text-secondary-foreground",
  PROCESSING: "border-warning/40 bg-warning/12 text-warning",
  FAILED: "border-destructive/40 bg-destructive/10 text-destructive",
};

const LABELS: Record<string, string> = {
  READY: "Ready",
  PROCESSING: "Processing",
  FAILED: "Failed",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        STYLES[status] ?? STYLES.READY,
        className,
      )}
    >
      {status === "PROCESSING" && (
        <span className="size-1.5 animate-pulse rounded-full bg-warning" aria-hidden />
      )}
      {LABELS[status] ?? status}
    </span>
  );
}
