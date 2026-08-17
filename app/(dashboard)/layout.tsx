"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/lib/hooks/use-org";

/**
 * Auth itself is enforced by proxy.ts; this only redirects signed-in users
 * with no organization yet into onboarding, mirroring `needsOnboarding` on
 * every dashboard page.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoading, needsOnboarding } = useWorkspace();

  useEffect(() => {
    if (!isLoading && needsOnboarding) router.replace("/onboarding");
  }, [isLoading, needsOnboarding, router]);

  return <>{children}</>;
}
