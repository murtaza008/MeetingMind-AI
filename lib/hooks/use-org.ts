"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { json } from "@/lib/hooks/fetcher";

export type OrgRole = "OWNER" | "ADMIN" | "MEMBER";
export type OrgPlan = "FREE" | "TEAM" | "BUSINESS";

export type Membership = {
  role: OrgRole;
  org: { id: string; name: string; slug: string; plan: OrgPlan };
  workspaces: { id: string; name: string; slug: string }[];
};

const ACTIVE_KEY = "meetingmind.workspace";

export function useMemberships() {
  return useQuery({
    queryKey: ["memberships"],
    queryFn: () => json<Membership[]>("/api/orgs"),
  });
}

/** The active workspace (persisted in localStorage) plus its org + role. */
export function useWorkspace() {
  const { data: memberships, isLoading, error } = useMemberships();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveId(localStorage.getItem(ACTIVE_KEY));
  }, []);

  const all = (memberships ?? []).flatMap((m) => m.workspaces.map((w) => ({ ...w, membership: m })));
  const active = all.find((w) => w.id === activeId) ?? all[0] ?? null;

  const setActive = useCallback(
    (id: string) => {
      localStorage.setItem(ACTIVE_KEY, id);
      setActiveId(id);
      queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const role = active?.membership.role ?? null;

  return {
    isLoading,
    error: error as Error | null,
    memberships: memberships ?? [],
    workspaces: all,
    workspace: active,
    org: active?.membership.org ?? null,
    role,
    canAdmin: role === "OWNER" || role === "ADMIN",
    setActive,
    needsOnboarding: !isLoading && !error && all.length === 0,
  };
}

export function useCreateOrg() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { orgName: string; workspaceName: string }) =>
      json<{ orgId: string; workspaceId: string }>("/api/orgs", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async (data) => {
      localStorage.setItem(ACTIVE_KEY, data.workspaceId);
      await queryClient.invalidateQueries({ refetchType: "all" });
    },
  });
}

export function useUpdateOrg(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name?: string }) =>
      json(`/api/orgs/${orgId}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["memberships"] }),
  });
}

/** Switch plan: demo mode flips it in Postgres instantly; real Stripe returns a checkout url. */
export function useCheckout(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plan: Exclude<OrgPlan, "FREE">) =>
      json<{ demo?: boolean; url?: string }>("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ orgId, plan }),
      }),
    onSuccess: (result) => {
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
    },
  });
}

export function usePortal(orgId: string | undefined) {
  return useMutation({
    mutationFn: () =>
      json<{ url: string }>("/api/billing/portal", {
        method: "POST",
        body: JSON.stringify({ orgId }),
      }),
    onSuccess: (result) => {
      window.location.href = result.url;
    },
  });
}

export function useCreateWorkspace(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      json(`/api/orgs/${orgId}/workspaces`, { method: "POST", body: JSON.stringify({ name }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["memberships"] }),
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) =>
      json<{ workspaceId: string }>("/api/invites/accept", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
    onSuccess: async (data) => {
      localStorage.setItem(ACTIVE_KEY, data.workspaceId);
      await queryClient.invalidateQueries({ refetchType: "all" });
    },
  });
}
