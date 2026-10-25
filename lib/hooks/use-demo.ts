"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { json } from "@/lib/hooks/fetcher";
import { isDemoEmail } from "@/lib/demo";

/** True while signed in as the shared public demo account. */
export function useIsDemo() {
  const { data: session } = useSession();
  return isDemoEmail(session?.user?.email);
}

export type DemoStatus =
  | { isDemo: false }
  | { isDemo: true; uploadLimit: number; uploadsRemaining: number; maxSeconds: number };

export function useDemoStatus(enabled: boolean) {
  return useQuery({
    queryKey: ["demo-status"],
    enabled,
    queryFn: () => json<DemoStatus>("/api/demo/status"),
  });
}
