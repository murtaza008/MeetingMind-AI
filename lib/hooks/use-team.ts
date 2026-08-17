"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { json } from "@/lib/hooks/fetcher";
import type { OrgRole } from "@/lib/hooks/use-org";

export type MemberRow = {
  id: string;
  userId: string;
  role: OrgRole;
  createdAt: string;
  profile: { email: string; fullName: string | null };
};

export type InviteRow = {
  id: string;
  email: string;
  role: OrgRole;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
};

export function useMembers(orgId?: string) {
  return useQuery({
    queryKey: ["members", orgId],
    enabled: !!orgId,
    queryFn: () => json<MemberRow[]>(`/api/orgs/${orgId}/members`),
  });
}

export function useInvites(orgId?: string) {
  return useQuery({
    queryKey: ["invites", orgId],
    enabled: !!orgId,
    queryFn: () => json<InviteRow[]>(`/api/orgs/${orgId}/invites`),
  });
}

export function useUpdateMemberRole(orgId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: OrgRole }) =>
      json(`/api/orgs/${orgId}/members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members", orgId] }),
  });
}

export function useRemoveMember(orgId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => json(`/api/orgs/${orgId}/members/${memberId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members", orgId] }),
  });
}

export function useCreateInvite(orgId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role: OrgRole }) =>
      json<{ token: string }>(`/api/orgs/${orgId}/invites`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invites", orgId] }),
  });
}

export function useRevokeInvite(orgId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => json(`/api/orgs/${orgId}/invites/${inviteId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invites", orgId] }),
  });
}
