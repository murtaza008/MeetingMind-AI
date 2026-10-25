"use client";

import { useState } from "react";
import { Loader2, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Posts to /api/demo/login, which signs in to the shared demo account on the
 * server and redirects to the dashboard. A native form POST, so the password
 * never touches the browser and the button works before hydration.
 */
export function TryDemoButton({ className, label = "Try demo" }: { className?: string; label?: string }) {
  const [pending, setPending] = useState(false);
  return (
    <form action="/api/demo/login" method="post" onSubmit={() => setPending(true)} className="contents">
      <button
        type="submit"
        disabled={pending}
        className={cn("group inline-flex items-center justify-center gap-2 disabled:opacity-70", className)}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <PlayCircle className="size-4" strokeWidth={2} />}
        {pending ? "Opening demo…" : label}
      </button>
    </form>
  );
}
