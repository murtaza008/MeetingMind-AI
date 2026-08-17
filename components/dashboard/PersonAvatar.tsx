import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

export function PersonAvatar({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-6 items-center justify-center rounded-full border border-border bg-secondary font-mono text-[9px] font-medium text-secondary-foreground",
        className,
      )}
      title={name ?? undefined}
    >
      {initials(name)}
    </span>
  );
}
