"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { json } from "@/lib/hooks/fetcher";

export type ActionItemRow = {
  id: string;
  meetingId: string;
  description: string;
  assigneeLabel: string | null;
  dueDate: string | null;
  status: "OPEN" | "DONE";
  meeting: { id: string; title: string; meetingDate: string } | null;
};

export function useActionItems(orgId?: string) {
  return useQuery({
    queryKey: ["action-items", orgId],
    enabled: !!orgId,
    queryFn: () => json<ActionItemRow[]>(`/api/action-items?orgId=${orgId}`),
  });
}

export function useToggleActionItem(orgId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "OPEN" | "DONE" }) =>
      json(`/api/action-items/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["action-items", orgId] });
      qc.invalidateQueries({ queryKey: ["meeting"] });
      qc.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}
